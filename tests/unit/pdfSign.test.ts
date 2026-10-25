import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import {
  positionForAnchor,
  resolveTargetPages,
  stampSignature,
} from '@/services/pdf/pdfSign'

describe('resolveTargetPages', () => {
  it('defaults to last page', () => {
    expect(resolveTargetPages(5)).toEqual([5])
  })

  it('accepts explicit pages', () => {
    expect(resolveTargetPages(5, [1, 3])).toEqual([1, 3])
  })

  it('rejects out of range', () => {
    expect(() => resolveTargetPages(2, [3])).toThrow()
  })
})

describe('positionForAnchor', () => {
  it('places bottom-right with margin', () => {
    const pos = positionForAnchor('bottom-right', 600, 800, 100, 40, 20)
    expect(pos.x).toBe(480)
    expect(pos.y).toBe(20)
  })

  it('places center', () => {
    const pos = positionForAnchor('center', 600, 800, 100, 40, 0)
    expect(pos.x).toBe(250)
    expect(pos.y).toBe(380)
  })
})

describe('stampSignature', () => {
  it('stamps a png onto the last page', async () => {
    const doc = await PDFDocument.create()
    doc.addPage([400, 400])
    doc.addPage([400, 400])
    const pdfBytes = await doc.save()

    // 1x1 red PNG
    const png = Uint8Array.from(
      atob(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      ),
      (c) => c.charCodeAt(0),
    )

    const out = await stampSignature(
      pdfBytes,
      { bytes: png, mime: 'image/png' },
      { anchor: 'bottom-right', widthPt: 80, marginPt: 24 },
    )
    const signed = await PDFDocument.load(out)
    expect(signed.getPageCount()).toBe(2)
  })

  it('stamps using normalized drag placement', async () => {
    const doc = await PDFDocument.create()
    doc.addPage([400, 600])
    const pdfBytes = await doc.save()
    const png = Uint8Array.from(
      atob(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      ),
      (c) => c.charCodeAt(0),
    )
    const out = await stampSignature(
      pdfBytes,
      { bytes: png, mime: 'image/png' },
      {
        pages: [1],
        placement: { xNorm: 0.1, yNorm: 0.2, widthNorm: 0.25 },
      },
    )
    expect((await PDFDocument.load(out)).getPageCount()).toBe(1)
  })
})
