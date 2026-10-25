import { describe, expect, it, vi } from 'vitest'

vi.mock('@/services/pdf/pdfDocument', () => ({
  openPdfDocument: vi.fn(async () => ({
    numPages: 1,
    getPage: async () => ({
      getViewport: () => ({ height: 800, width: 600 }),
      getTextContent: async () => ({ items: [] }),
    }),
    cleanup: async () => undefined,
  })),
}))

import { pdfToMarkdown } from '@/services/pdf/pdfToMarkdown'

describe('pdfToMarkdown empty', () => {
  it('warns when little text is found', async () => {
    const result = await pdfToMarkdown(new Uint8Array([1]))
    expect(result.warnings.some((w) => /scanned|OCR|little text/i.test(w))).toBe(true)
  })
})
