import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { mergePdfs } from '@/services/pdf/pdfMerge'
import type { PdfFile } from '@/types/pdf'

async function makePdf(pages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  for (let i = 0; i < pages; i++) doc.addPage()
  return doc.save()
}

function asPdfFile(bytes: Uint8Array, name: string): PdfFile {
  const file = new File([bytes.slice()], name, { type: 'application/pdf' })
  return {
    id: name,
    file,
    name,
    size: file.size,
    lastModified: file.lastModified,
  }
}

describe('mergePdfs', () => {
  it('merges two documents', async () => {
    const a = asPdfFile(await makePdf(1), 'a.pdf')
    const b = asPdfFile(await makePdf(2), 'b.pdf')
    const out = await mergePdfs([a, b])
    const doc = await PDFDocument.load(out)
    expect(doc.getPageCount()).toBe(3)
  })

  it('rejects fewer than two files', async () => {
    const a = asPdfFile(await makePdf(1), 'a.pdf')
    await expect(mergePdfs([a])).rejects.toMatchObject({ code: 'EMPTY_INPUT' })
  })
})
