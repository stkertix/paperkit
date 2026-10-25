import { describe, expect, it } from 'vitest'
import { buildTextHunks } from '@/services/pdf/pdfDiff'

describe('pdfDiff', () => {
  it('builds hunks for differing text', () => {
    const hunks = buildTextHunks('alpha', 'beta')
    expect(hunks.length).toBeGreaterThan(0)
    expect(hunks[0].left).toContain('alpha')
    expect(hunks[0].right).toContain('beta')
  })

  it('handles identical empty strings', () => {
    const hunks = buildTextHunks('', '')
    expect(hunks[0].left).toMatch(/identical|empty/i)
  })
})
