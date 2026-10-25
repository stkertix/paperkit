import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { toPdfError } from '@/services/errors/pdfErrors'
import { THUMBNAIL_WIDTH } from '@/types/pdf'

// Vitest sets workerSrc in tests/setup.ts — do not overwrite with the Vite ?url path.
if (import.meta.env.MODE !== 'test') {
  GlobalWorkerOptions.workerSrc = pdfWorker
}

export async function openPdfDocument(data: Uint8Array): Promise<PDFDocumentProxy> {
  try {
    const task = getDocument({ data: data.slice() })
    return await task.promise
  } catch (error) {
    throw toPdfError(error)
  }
}

export async function renderPageThumbnail(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  targetWidth = THUMBNAIL_WIDTH,
): Promise<string> {
  const page = await pdf.getPage(pageNumber)
  const base = page.getViewport({ scale: 1 })
  const scale = targetWidth / base.width
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw toPdfError(new Error('canvas'))
  await page.render({ canvasContext: ctx, viewport, canvas }).promise
  const url = canvas.toDataURL('image/jpeg', 0.75)
  canvas.width = 0
  canvas.height = 0
  return url
}
