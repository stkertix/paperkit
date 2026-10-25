import { describe, expect, it } from 'vitest'
import { validateFile } from '@/composables/useFileDrop'
import { PDF_ACCEPT } from '@/types/pdf'
import { dpiToScale } from '@/services/pdf/pdfToImage'

describe('validateFile', () => {
  it('accepts pdf by extension', () => {
    const file = new File(['%PDF'], 'doc.pdf', { type: '' })
    expect(validateFile(file, PDF_ACCEPT)).toEqual({ ok: true })
  })

  it('rejects oversized files', () => {
    const file = new File([new Uint8Array(10)], 'big.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'size', { value: PDF_ACCEPT.maxBytes + 1 })
    const result = validateFile(file, PDF_ACCEPT)
    expect(result.ok).toBe(false)
  })
})

describe('dpiToScale', () => {
  it('maps dpi to pdf.js scale', () => {
    expect(dpiToScale(72)).toBe(1)
    expect(dpiToScale(144)).toBe(2)
  })
})
