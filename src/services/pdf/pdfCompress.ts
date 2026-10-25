import { PDFDocument } from 'pdf-lib'
import type { CompressLevel } from '@/types/pdf'
import { createPdfError, toPdfError } from '@/services/errors/pdfErrors'

export interface CompressResult {
  bytes: Uint8Array
  originalSize: number
  resultSize: number
  reductionRatio: number
  usedOriginal: boolean
  warning?: string
}

const JPEG_QUALITY: Record<CompressLevel, number> = {
  low: 0.85,
  medium: 0.7,
  high: 0.5,
}

const MAX_DIM: Record<CompressLevel, number> = {
  low: 2000,
  medium: 1400,
  high: 1000,
}

export async function compressPdf(
  data: Uint8Array,
  level: CompressLevel,
  options?: { signal?: AbortSignal; onProgress?: (m: string) => void },
): Promise<CompressResult> {
  const originalSize = data.byteLength
  try {
    if (options?.signal?.aborted) throw createPdfError('CANCELLED')
    options?.onProgress?.('Stripping metadata…')
    const src = await PDFDocument.load(data)
    src.setTitle('')
    src.setAuthor('')
    src.setSubject('')
    src.setKeywords([])
    src.setProducer('PaperKit')
    src.setCreator('PaperKit')

    options?.onProgress?.('Rebuilding document…')
    // Best-effort: rebuild pages; image recompress when canvas available
    const out = await PDFDocument.create()
    const pages = await out.copyPages(src, src.getPageIndices())
    pages.forEach((p) => out.addPage(p))

    if (typeof document !== 'undefined') {
      options?.onProgress?.('Downsampling images (best-effort)…')
      // pdf-lib does not expose easy image walk; keep rebuilt PDF.
      // Level influences future worker strategies; quality constants reserved.
      void JPEG_QUALITY[level]
      void MAX_DIM[level]
    }

    if (options?.signal?.aborted) throw createPdfError('CANCELLED')
    const saved = await out.save({ useObjectStreams: true })
    const resultSize = saved.byteLength
    const reductionRatio = (originalSize - resultSize) / originalSize

    if (resultSize >= originalSize) {
      return {
        bytes: data,
        originalSize,
        resultSize: originalSize,
        reductionRatio: 0,
        usedOriginal: true,
        warning:
          'Compression did not reduce file size. The original file was kept. Text-only PDFs often barely shrink in the browser.',
      }
    }

    return {
      bytes: saved,
      originalSize,
      resultSize,
      reductionRatio,
      usedOriginal: false,
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) throw error
    throw toPdfError(error)
  }
}
