import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { extractPages, parsePageRanges, splitEveryPage } from '@/services/pdf/pdfSplit'

describe('parsePageRanges', () => {
  it('parses lists and ranges', () => {
    expect(parsePageRanges('1,3-5,8', 10)).toEqual([1, 3, 4, 5, 8])
  })

  it('rejects out of range', () => {
    expect(() => parsePageRanges('1,99', 5)).toThrow()
  })

  it('returns empty for blank', () => {
    expect(parsePageRanges('  ', 5)).toEqual([])
  })
})

async function twoPagePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.addPage([200, 200])
  doc.addPage([300, 400])
  return doc.save()
}

describe('extractPages / splitEveryPage', () => {
  it('extracts one page', async () => {
    const data = await twoPagePdf()
    const out = await extractPages(data, [2])
    const doc = await PDFDocument.load(out)
    expect(doc.getPageCount()).toBe(1)
    const { width, height } = doc.getPage(0).getSize()
    expect(width).toBe(300)
    expect(height).toBe(400)
  })

  it('splits every page', async () => {
    const data = await twoPagePdf()
    const parts = await splitEveryPage(data)
    expect(parts).toHaveLength(2)
    expect(parts[0].name).toBe('page-001.pdf')
  })
})
