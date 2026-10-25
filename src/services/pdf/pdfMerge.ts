import { PDFDocument } from 'pdf-lib'
import type { PdfFile } from '@/types/pdf'
import { createPdfError, toPdfError } from '@/services/errors/pdfErrors'
import { fileToUint8Array } from '@/services/pdf/fileBytes'

export interface MergeProgress {
  phase: 'read' | 'merge' | 'done'
  current: number
  total: number
}

export async function mergePdfs(
  files: PdfFile[],
  options?: {
    signal?: AbortSignal
    onProgress?: (p: MergeProgress) => void
  },
): Promise<Uint8Array> {
  if (files.length < 2) {
    throw createPdfError('EMPTY_INPUT')
  }

  const { signal, onProgress } = options ?? {}
  const merged = await PDFDocument.create()
  const total = files.length

  for (let i = 0; i < files.length; i++) {
    if (signal?.aborted) throw createPdfError('CANCELLED')
    onProgress?.({ phase: 'read', current: i + 1, total })
    try {
      const bytes = await fileToUint8Array(files[i].file)
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: false })
      const indices = doc.getPageIndices()
      const pages = await merged.copyPages(doc, indices)
      pages.forEach((page) => merged.addPage(page))
    } catch (error) {
      throw toPdfError(error)
    }
    onProgress?.({ phase: 'merge', current: i + 1, total })
  }

  if (signal?.aborted) throw createPdfError('CANCELLED')
  const out = await merged.save()
  onProgress?.({ phase: 'done', current: total, total })
  return out
}
