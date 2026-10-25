import { PDFDocument, PageSizes } from 'pdf-lib'
import type { FitMode, Orientation, PagePreset } from '@/types/pdf'
import { createPdfError, toPdfError } from '@/services/errors/pdfErrors'

export interface ImageToPdfOptions {
  preset: PagePreset
  orientation: Orientation
  marginPt: number
  fit: FitMode
  signal?: AbortSignal
}

function pageSize(
  preset: PagePreset,
  orientation: Orientation,
  imgW: number,
  imgH: number,
): [number, number] {
  if (preset === 'original') {
    return [imgW, imgH]
  }
  let [w, h] = preset === 'a4' ? PageSizes.A4 : PageSizes.Letter
  if (orientation === 'landscape') {
    ;[w, h] = [h, w]
  }
  return [w, h]
}

function fitRect(
  fit: FitMode,
  boxW: number,
  boxH: number,
  imgW: number,
  imgH: number,
): { w: number; h: number; x: number; y: number } {
  if (fit === 'stretch') {
    return { w: boxW, h: boxH, x: 0, y: 0 }
  }
  const scale =
    fit === 'cover' ? Math.max(boxW / imgW, boxH / imgH) : Math.min(boxW / imgW, boxH / imgH)
  const w = imgW * scale
  const h = imgH * scale
  return { w, h, x: (boxW - w) / 2, y: (boxH - h) / 2 }
}

export async function imagesToPdf(
  images: { name: string; bytes: Uint8Array; mime: string }[],
  options: ImageToPdfOptions,
): Promise<Uint8Array> {
  if (!images.length) throw createPdfError('EMPTY_INPUT')
  try {
    const doc = await PDFDocument.create()
    for (const image of images) {
      if (options.signal?.aborted) throw createPdfError('CANCELLED')
      let embedded
      if (image.mime === 'image/jpeg' || image.mime === 'image/jpg') {
        embedded = await doc.embedJpg(image.bytes)
      } else if (image.mime === 'image/png') {
        embedded = await doc.embedPng(image.bytes)
      } else {
        // WEBP: draw via canvas → PNG when in browser
        if (typeof document !== 'undefined') {
          const pngBytes = await webpOrUnknownToPng(image.bytes, image.mime)
          embedded = await doc.embedPng(pngBytes)
        } else {
          throw createPdfError('UNSUPPORTED')
        }
      }
      const margin = Math.max(0, options.marginPt)
      const [pageW, pageH] = pageSize(
        options.preset,
        options.orientation,
        embedded.width + margin * 2,
        embedded.height + margin * 2,
      )
      const page = doc.addPage([pageW, pageH])
      const boxW = pageW - margin * 2
      const boxH = pageH - margin * 2
      const placed = fitRect(options.fit, boxW, boxH, embedded.width, embedded.height)
      page.drawImage(embedded, {
        x: margin + placed.x,
        y: margin + placed.y,
        width: placed.w,
        height: placed.h,
      })
    }
    return doc.save()
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) throw error
    throw toPdfError(error)
  }
}

async function webpOrUnknownToPng(bytes: Uint8Array, mime: string): Promise<Uint8Array> {
  const blob = new Blob([bytes.slice()], { type: mime })
  const url = URL.createObjectURL(blob)
  try {
    const img = await loadHtmlImage(url)
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

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(createPdfError('UNSUPPORTED'))
    img.src = url
  })
}
