import { openPdfDocument, renderPageThumbnail } from '@/services/pdf/pdfDocument'
import { createPdfError, toPdfError } from '@/services/errors/pdfErrors'

export type DiffMode = 'text' | 'visual'

export interface TextDiffResult {
  pageNumber: number
  hunks: { left: string; right: string }[]
  leftEmpty: boolean
  rightEmpty: boolean
}

export async function getPageCount(data: Uint8Array): Promise<number> {
  const pdf = await openPdfDocument(data)
  const n = pdf.numPages
  await pdf.cleanup()
  return n
}

export async function extractPageText(data: Uint8Array, pageNumber: number): Promise<string> {
  try {
    const pdf = await openPdfDocument(data)
    if (pageNumber < 1 || pageNumber > pdf.numPages) {
      await pdf.cleanup()
      throw createPdfError('UNSUPPORTED')
    }
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    await pdf.cleanup()
    return text
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) throw error
    throw toPdfError(error)
  }
}

/** Simple line-oriented side-by-side hunks (not a full Myers diff). */
export function buildTextHunks(left: string, right: string): { left: string; right: string }[] {
  const leftLines = left ? left.split(/\n|(?<=\.\s)/).map((s) => s.trim()).filter(Boolean) : []
  const rightLines = right ? right.split(/\n|(?<=\.\s)/).map((s) => s.trim()).filter(Boolean) : []
  const max = Math.max(leftLines.length, rightLines.length, 1)
  const hunks: { left: string; right: string }[] = []
  for (let i = 0; i < max; i++) {
    const l = leftLines[i] ?? ''
    const r = rightLines[i] ?? ''
    if (l !== r) hunks.push({ left: l || '—', right: r || '—' })
  }
  if (!hunks.length && left === right) {
    return [{ left: left || '(identical / empty)', right: right || '(identical / empty)' }]
  }
  if (!hunks.length) {
    return [{ left: left || '—', right: right || '—' }]
  }
  return hunks
}

export async function textDiffPage(
  a: Uint8Array,
  b: Uint8Array,
  pageNumber: number,
): Promise<TextDiffResult> {
  const [left, right] = await Promise.all([
    extractPageText(a, pageNumber),
    extractPageText(b, pageNumber),
  ])
  return {
    pageNumber,
    hunks: buildTextHunks(left, right),
    leftEmpty: !left,
    rightEmpty: !right,
  }
}

export async function visualComparePages(
  a: Uint8Array,
  b: Uint8Array,
  pageNumber: number,
): Promise<{ leftUrl: string; rightUrl: string }> {
  try {
    const [pdfA, pdfB] = await Promise.all([openPdfDocument(a), openPdfDocument(b)])
    if (pageNumber < 1 || pageNumber > Math.min(pdfA.numPages, pdfB.numPages)) {
      await pdfA.cleanup()
      await pdfB.cleanup()
      throw createPdfError('UNSUPPORTED')
    }
    const [leftUrl, rightUrl] = await Promise.all([
      renderPageThumbnail(pdfA, pageNumber, 480),
      renderPageThumbnail(pdfB, pageNumber, 480),
    ])
    await pdfA.cleanup()
    await pdfB.cleanup()
    return { leftUrl, rightUrl }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) throw error
    throw toPdfError(error)
  }
}
