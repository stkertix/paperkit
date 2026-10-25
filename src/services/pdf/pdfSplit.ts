import { PDFDocument } from 'pdf-lib'
import { createPdfError, toPdfError } from '@/services/errors/pdfErrors'

/** Parse "1,3-5,8" → unique sorted 1-based page numbers within 1..pageCount */
export function parsePageRanges(input: string, pageCount: number): number[] {
  const trimmed = input.trim()
  if (!trimmed) return []
  const pages = new Set<number>()
  for (const part of trimmed.split(',')) {
    const token = part.trim()
    if (!token) continue
    if (token.includes('-')) {
      const [a, b] = token.split('-').map((s) => s.trim())
      const start = Number(a)
      const end = Number(b)
      if (!Number.isInteger(start) || !Number.isInteger(end)) {
        throw createPdfError('UNSUPPORTED')
      }
      const from = Math.min(start, end)
      const to = Math.max(start, end)
      for (let p = from; p <= to; p++) {
        if (p < 1 || p > pageCount) throw createPdfError('UNSUPPORTED')
        pages.add(p)
      }
    } else {
      const p = Number(token)
      if (!Number.isInteger(p) || p < 1 || p > pageCount) {
        throw createPdfError('UNSUPPORTED')
      }
      pages.add(p)
    }
  }
  return [...pages].sort((x, y) => x - y)
}

export async function extractPages(
  data: Uint8Array,
  pages: number[],
  options?: { signal?: AbortSignal },
): Promise<Uint8Array> {
  if (!pages.length) throw createPdfError('EMPTY_INPUT')
  if (options?.signal?.aborted) throw createPdfError('CANCELLED')
  try {
    const src = await PDFDocument.load(data)
    const count = src.getPageCount()
    for (const p of pages) {
      if (p < 1 || p > count) throw createPdfError('UNSUPPORTED')
    }
    const out = await PDFDocument.create()
    const copied = await out.copyPages(
      src,
      pages.map((p) => p - 1),
    )
    copied.forEach((page) => out.addPage(page))
    return out.save()
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) throw error
    throw toPdfError(error)
  }
}

export async function splitEveryPage(
  data: Uint8Array,
  options?: {
    signal?: AbortSignal
    onProgress?: (current: number, total: number) => void
  },
): Promise<{ name: string; data: Uint8Array }[]> {
  try {
    const src = await PDFDocument.load(data)
    const total = src.getPageCount()
    const results: { name: string; data: Uint8Array }[] = []
    for (let i = 0; i < total; i++) {
      if (options?.signal?.aborted) throw createPdfError('CANCELLED')
      const out = await PDFDocument.create()
      const [page] = await out.copyPages(src, [i])
      out.addPage(page)
      const bytes = await out.save()
      results.push({
        name: `page-${String(i + 1).padStart(3, '0')}.pdf`,
        data: bytes,
      })
      options?.onProgress?.(i + 1, total)
    }
    return results
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) throw error
    throw toPdfError(error)
  }
}
