import { describe, expect, it, vi } from 'vitest'

vi.mock('@/services/pdf/pdfDocument', () => ({
  openPdfDocument: vi.fn(async () => ({
    numPages: 1,
    getPage: async () => ({
      getViewport: () => ({ height: 800, width: 600 }),
      getTextContent: async () => ({
        items: [
          {
            str: 'Introduction to PaperKit',
            transform: [1, 0, 0, 14, 40, 700],
          },
        ],
      }),
    }),
    cleanup: async () => undefined,
  })),
}))

import { pdfToMarkdown } from '@/services/pdf/pdfToMarkdown'

describe('pdfToMarkdown', () => {
  it('converts mocked text content', async () => {
    const result = await pdfToMarkdown(new Uint8Array([1, 2, 3]))
    expect(result.markdown).toMatch(/Introduction|PaperKit|Page 1/)
    expect(result.warnings.length).toBeGreaterThan(0)
  })
})
