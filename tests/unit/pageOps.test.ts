import { describe, expect, it } from 'vitest'
import { PDFDocument, degrees } from 'pdf-lib'
import { deletePages, duplicatePages, reorderPages, rotatePages } from '@/services/pdf/pageOps'

async function threePagePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.addPage([100, 100])
  doc.addPage([200, 200])
  doc.addPage([300, 300])
  return doc.save()
}

describe('pageOps', () => {
  it('rotates a page', async () => {
    const data = await threePagePdf()
    const out = await rotatePages(data, [1], 90)
    const doc = await PDFDocument.load(out)
    expect(doc.getPage(0).getRotation().angle).toBe(90)
    void degrees
  })

  it('deletes pages but keeps at least one', async () => {
    const data = await threePagePdf()
    const out = await deletePages(data, [2])
    const doc = await PDFDocument.load(out)
    expect(doc.getPageCount()).toBe(2)
    await expect(deletePages(data, [1, 2, 3])).rejects.toMatchObject({ code: 'UNSUPPORTED' })
  })

  it('reorders pages', async () => {
    const data = await threePagePdf()
    const out = await reorderPages(data, [3, 1, 2])
    const doc = await PDFDocument.load(out)
    expect(doc.getPage(0).getSize().width).toBe(300)
  })

  it('duplicates pages', async () => {
    const data = await threePagePdf()
    const out = await duplicatePages(data, [1])
    const doc = await PDFDocument.load(out)
    expect(doc.getPageCount()).toBe(4)
  })
})
