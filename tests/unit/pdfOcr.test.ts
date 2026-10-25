import { describe, expect, it, vi } from 'vitest'
import { OCR_LANG_LABELS } from '@/services/pdf/pdfOcr'

describe('pdfOcr', () => {
  it('defaults language labels include eng', () => {
    expect(OCR_LANG_LABELS.eng).toBe('English')
    expect(Object.keys(OCR_LANG_LABELS)).toEqual(
      expect.arrayContaining(['eng', 'ind', 'jpn', 'chi_sim']),
    )
  })

  it('progress callback shape is callable', () => {
    const onProgress = vi.fn()
    onProgress(0.5)
    expect(onProgress).toHaveBeenCalledWith(0.5)
  })
})
