import { PDFDocument, degrees } from 'pdf-lib'
import type { RotateDegrees } from '@/types/pdf'
import { createPdfError, toPdfError } from '@/services/errors/pdfErrors'

async function load(data: Uint8Array) {
  try {
    return await PDFDocument.load(data)
  } catch (error) {
    throw toPdfError(error)
  }
}

export async function rotatePages(
  data: Uint8Array,
  pages: number[],
  amount: RotateDegrees,
): Promise<Uint8Array> {
  if (!pages.length) throw createPdfError('EMPTY_INPUT')
  const doc = await load(data)
  const count = doc.getPageCount()
  for (const p of pages) {
    if (p < 1 || p > count) throw createPdfError('UNSUPPORTED')
    const page = doc.getPage(p - 1)
    const current = page.getRotation().angle
    page.setRotation(degrees((current + amount) % 360))
  }
  return doc.save()
}

export async function deletePages(data: Uint8Array, pages: number[]): Promise<Uint8Array> {
  if (!pages.length) throw createPdfError('EMPTY_INPUT')
  const doc = await load(data)
  const count = doc.getPageCount()
  const toDelete = [...new Set(pages)].sort((a, b) => b - a)
  if (toDelete.length >= count) {
    throw createPdfError('UNSUPPORTED')
  }
  for (const p of toDelete) {
    if (p < 1 || p > count) throw createPdfError('UNSUPPORTED')
    doc.removePage(p - 1)
  }
  return doc.save()
}

/** `order` is a permutation of 1-based page indices covering all pages. */
export async function reorderPages(data: Uint8Array, order: number[]): Promise<Uint8Array> {
  const src = await load(data)
  const count = src.getPageCount()
  if (order.length !== count) throw createPdfError('UNSUPPORTED')
  const seen = new Set(order)
  if (seen.size !== count) throw createPdfError('UNSUPPORTED')
  for (const p of order) {
    if (p < 1 || p > count) throw createPdfError('UNSUPPORTED')
  }
  const out = await PDFDocument.create()
  const copied = await out.copyPages(
    src,
    order.map((p) => p - 1),
  )
  copied.forEach((page) => out.addPage(page))
  return out.save()
}

export async function duplicatePages(data: Uint8Array, pages: number[]): Promise<Uint8Array> {
  if (!pages.length) throw createPdfError('EMPTY_INPUT')
  const src = await load(data)
  const count = src.getPageCount()
  for (const p of pages) {
    if (p < 1 || p > count) throw createPdfError('UNSUPPORTED')
  }
  const out = await PDFDocument.create()
  const allIndices = src.getPageIndices()
  const base = await out.copyPages(src, allIndices)
  base.forEach((page) => out.addPage(page))
  const extras = await out.copyPages(
    src,
    pages.map((p) => p - 1),
  )
  extras.forEach((page) => out.addPage(page))
  return out.save()
}

export async function extractPagesOp(data: Uint8Array, pages: number[]): Promise<Uint8Array> {
  if (!pages.length) throw createPdfError('EMPTY_INPUT')
  const src = await load(data)
  const count = src.getPageCount()
  for (const p of pages) {
    if (p < 1 || p > count) throw createPdfError('UNSUPPORTED')
  }
  const out = await PDFDocument.create()
  const copied = await out.copyPages(
    src,
    pages.map((p) => p - 1),
  )
  copied.forEach((page) => out.addPage(page))
  return out.save()
}

export const pageOps = {
  rotate: rotatePages,
  delete: deletePages,
  reorder: reorderPages,
  duplicate: duplicatePages,
  extract: extractPagesOp,
}
