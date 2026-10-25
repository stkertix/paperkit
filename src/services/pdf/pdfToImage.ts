import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { ImageFormat } from '@/types/pdf'
import { createPdfError, toPdfError } from '@/services/errors/pdfErrors'

if (import.meta.env.MODE !== 'test') {
  GlobalWorkerOptions.workerSrc = pdfWorker
}

export interface PdfToImageOptions {
  format: ImageFormat
  quality?: number
  dpi: 72 | 150 | 300
  pages?: number[]
  signal?: AbortSignal
  onProgress?: (current: number, total: number) => void
}

export function dpiToScale(dpi: number): number {
  return dpi / 72
}

export async function pdfPagesToImages(
  data: Uint8Array,
  options: PdfToImageOptions,
): Promise<{ pageNumber: number; blob: Blob }[]> {
  try {
    const loadingTask = getDocument({ data: data.slice() })
    const pdf = await loadingTask.promise
    const pageNumbers =
      options.pages?.length ? options.pages : Array.from({ length: pdf.numPages }, (_, i) => i + 1)
    const scale = dpiToScale(options.dpi)
    const results: { pageNumber: number; blob: Blob }[] = []
    const total = pageNumbers.length

    for (let i = 0; i < pageNumbers.length; i++) {
      if (options.signal?.aborted) throw createPdfError('CANCELLED')
      const pageNumber = pageNumbers[i]
      if (pageNumber < 1 || pageNumber > pdf.numPages) throw createPdfError('UNSUPPORTED')
      const page = await pdf.getPage(pageNumber)
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw createPdfError('UNSUPPORTED')
      await page.render({ canvasContext: ctx, viewport, canvas }).promise
      const mime = options.format === 'png' ? 'image/png' : 'image/jpeg'
      const quality = options.format === 'jpg' ? (options.quality ?? 0.92) : undefined
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(createPdfError('OUT_OF_MEMORY'))),
          mime,
          quality,
        )
      })
      canvas.width = 0
      canvas.height = 0
      results.push({ pageNumber, blob })
      options.onProgress?.(i + 1, total)
    }

    await pdf.cleanup()
    return results
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) throw error
    throw toPdfError(error)
  }
}
