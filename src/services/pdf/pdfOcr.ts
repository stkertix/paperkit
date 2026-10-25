import { openPdfDocument } from '@/services/pdf/pdfDocument'
import { createPdfError, toPdfError, type PdfAppError } from '@/services/errors/pdfErrors'
import {
  recognizeImage,
  terminateOcrWorker,
  type OcrLang,
} from '@/workers/ocrWorker'

export type { OcrLang }

export interface OcrOptions {
  lang: OcrLang
  signal?: AbortSignal
  onProgress?: (p: number) => void
  pages?: number[]
}

export interface OcrResult {
  text: string
  /** Omitted: reliable searchable-PDF generation is not guaranteed client-side. */
  searchablePdf?: Uint8Array
}

export const OCR_LANG_LABELS: Record<OcrLang, string> = {
  eng: 'English',
  ind: 'Indonesian',
  jpn: 'Japanese',
  chi_sim: 'Chinese (Simplified)',
}

export async function ocrPdf(data: Uint8Array, options: OcrOptions): Promise<OcrResult> {
  try {
    const pdf = await openPdfDocument(data)
    const pageNumbers =
      options.pages?.length ?
        options.pages
      : Array.from({ length: pdf.numPages }, (_, i) => i + 1)

    const texts: string[] = []
    const total = pageNumbers.length

    for (let i = 0; i < pageNumbers.length; i++) {
      if (options.signal?.aborted) {
        await pdf.cleanup()
        await terminateOcrWorker()
        throw createPdfError('CANCELLED')
      }
      const pageNumber = pageNumbers[i]
      if (pageNumber < 1 || pageNumber > pdf.numPages) {
        await pdf.cleanup()
        throw createPdfError('UNSUPPORTED')
      }

      const page = await pdf.getPage(pageNumber)
      const viewport = page.getViewport({ scale: 2 })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw createPdfError('UNSUPPORTED')
      await page.render({ canvasContext: ctx, viewport, canvas }).promise

      const pageText = await recognizeImage(canvas, options.lang, (p) => {
        const base = i / total
        options.onProgress?.(base + p / total)
      })
      texts.push(`--- Page ${pageNumber} ---\n${pageText}`)
      canvas.width = 0
      canvas.height = 0
      options.onProgress?.((i + 1) / total)
    }

    await pdf.cleanup()
    // Keep worker warm for same-lang re-runs; callers may terminate on leave.
    return { text: texts.join('\n\n').trim() || '(No text recognized.)' }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) throw error
    const msg = error instanceof Error ? error.message.toLowerCase() : ''
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('load')) {
      const err: PdfAppError = {
        code: 'UNSUPPORTED',
        message:
          'Could not load OCR language data. Check your network connection and try again.',
        cause: error,
      }
      throw err
    }
    throw toPdfError(error)
  }
}
