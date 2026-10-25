import { PDFDocument } from 'pdf-lib'
import { createPdfError, toPdfError } from '@/services/errors/pdfErrors'

export type SignatureAnchor =
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'top-right'
  | 'center'

/** Normalized placement in PDF space (origin bottom-left). */
export interface SignaturePlacementNorm {
  /** Left edge as fraction of page width (0–1) */
  xNorm: number
  /** Bottom edge as fraction of page height (0–1) */
  yNorm: number
  /** Signature width as fraction of page width (0–1) */
  widthNorm: number
}

export interface SignPdfOptions {
  /** 1-based page numbers; empty = last page only */
  pages?: number[]
  /** Preferred: drag-drop placement. Falls back to anchor if omitted. */
  placement?: SignaturePlacementNorm
  anchor?: SignatureAnchor
  /** Used only with anchor mode */
  widthPt?: number
  marginPt?: number
  signal?: AbortSignal
}

export interface SignatureImage {
  bytes: Uint8Array
  mime: string
}

async function embedImage(doc: PDFDocument, image: SignatureImage) {
  if (image.mime === 'image/png') {
    return doc.embedPng(image.bytes)
  }
  if (image.mime === 'image/jpeg' || image.mime === 'image/jpg') {
    return doc.embedJpg(image.bytes)
  }
  if (typeof document === 'undefined') throw createPdfError('UNSUPPORTED')
  const png = await toPngBytes(image.bytes, image.mime)
  return doc.embedPng(png)
}

async function toPngBytes(bytes: Uint8Array, mime: string): Promise<Uint8Array> {
  const blob = new Blob([bytes.slice()], { type: mime })
  const url = URL.createObjectURL(blob)
  try {
    const img = await loadImage(url)
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw createPdfError('UNSUPPORTED')
    ctx.drawImage(img, 0, 0)
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(createPdfError('UNSUPPORTED'))), 'image/png')
    })
    return new Uint8Array(await pngBlob.arrayBuffer())
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(createPdfError('UNSUPPORTED'))
    img.src = url
  })
}

export function resolveTargetPages(pageCount: number, pages?: number[]): number[] {
  if (!pages?.length) return [pageCount]
  const unique = [...new Set(pages)].sort((a, b) => a - b)
  for (const p of unique) {
    if (p < 1 || p > pageCount) throw createPdfError('UNSUPPORTED')
  }
  return unique
}

export function positionForAnchor(
  anchor: SignatureAnchor,
  pageW: number,
  pageH: number,
  sigW: number,
  sigH: number,
  marginPt: number,
): { x: number; y: number } {
  const m = Math.max(0, marginPt)
  switch (anchor) {
    case 'bottom-left':
      return { x: m, y: m }
    case 'bottom-center':
      return { x: (pageW - sigW) / 2, y: m }
    case 'bottom-right':
      return { x: pageW - sigW - m, y: m }
    case 'top-right':
      return { x: pageW - sigW - m, y: pageH - sigH - m }
    case 'center':
      return { x: (pageW - sigW) / 2, y: (pageH - sigH) / 2 }
    default:
      return { x: pageW - sigW - m, y: m }
  }
}

export function anchorToPlacement(
  anchor: SignatureAnchor,
  pageW: number,
  pageH: number,
  widthPt: number,
  aspect: number,
  marginPt: number,
): SignaturePlacementNorm {
  const widthNorm = Math.min(0.9, Math.max(0.08, widthPt / pageW))
  const sigW = widthNorm * pageW
  const sigH = sigW * aspect
  const { x, y } = positionForAnchor(anchor, pageW, pageH, sigW, sigH, marginPt)
  return {
    xNorm: x / pageW,
    yNorm: y / pageH,
    widthNorm,
  }
}

export async function stampSignature(
  pdfBytes: Uint8Array,
  signature: SignatureImage,
  options: SignPdfOptions,
): Promise<Uint8Array> {
  try {
    if (options.signal?.aborted) throw createPdfError('CANCELLED')
    const doc = await PDFDocument.load(pdfBytes)
    const pageCount = doc.getPageCount()
    if (pageCount < 1) throw createPdfError('EMPTY_INPUT')

    const targets = resolveTargetPages(pageCount, options.pages)
    const embedded = await embedImage(doc, signature)
    const aspect = embedded.height / embedded.width

    for (const pageNumber of targets) {
      if (options.signal?.aborted) throw createPdfError('CANCELLED')
      const page = doc.getPage(pageNumber - 1)
      const { width, height } = page.getSize()

      let x: number
      let y: number
      let widthPt: number
      let heightPt: number

      if (options.placement) {
        const widthNorm = Math.min(0.95, Math.max(0.05, options.placement.widthNorm))
        widthPt = widthNorm * width
        heightPt = widthPt * aspect
        x = options.placement.xNorm * width
        y = options.placement.yNorm * height
      } else {
        widthPt = Math.max(24, options.widthPt ?? 140)
        heightPt = widthPt * aspect
        const pos = positionForAnchor(
          options.anchor ?? 'bottom-right',
          width,
          height,
          widthPt,
          heightPt,
          options.marginPt ?? 36,
        )
        x = pos.x
        y = pos.y
      }

      page.drawImage(embedded, {
        x: Math.max(0, Math.min(x, width - widthPt)),
        y: Math.max(0, Math.min(y, height - heightPt)),
        width: widthPt,
        height: heightPt,
      })
    }

    return doc.save()
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) throw error
    throw toPdfError(error)
  }
}
