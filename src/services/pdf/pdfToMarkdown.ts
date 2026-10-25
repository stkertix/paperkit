import { openPdfDocument } from '@/services/pdf/pdfDocument'
import { createPdfError, toPdfError } from '@/services/errors/pdfErrors'

export interface MarkdownConversion {
  markdown: string
  warnings: string[]
}

interface TextItem {
  str: string
  x: number
  y: number
  height: number
}

export async function pdfToMarkdown(
  data: Uint8Array,
  options?: { signal?: AbortSignal },
): Promise<MarkdownConversion> {
  const warnings: string[] = []
  try {
    const pdf = await openPdfDocument(data)
    const parts: string[] = []
    let totalChars = 0

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      if (options?.signal?.aborted) {
        await pdf.cleanup()
        throw createPdfError('CANCELLED')
      }
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale: 1 })
      const content = await page.getTextContent()
      const items: TextItem[] = []
      for (const raw of content.items) {
        if (!('str' in raw) || !raw.str.trim()) continue
        const tx = raw.transform
        items.push({
          str: raw.str,
          x: tx[4],
          y: tx[5],
          height: Math.abs(tx[3]) || 12,
        })
      }
      totalChars += items.reduce((n, i) => n + i.str.length, 0)
      parts.push(`\n\n## Page ${pageNum}\n`)
      parts.push(itemsToMarkdown(items, viewport.height))
    }

    await pdf.cleanup()

    if (totalChars < 20) {
      warnings.push(
        'Very little text was found. This may be a scanned PDF — try OCR for better results.',
      )
    } else {
      warnings.push('Best-effort conversion. Multi-column layouts and tables may be imperfect.')
    }

    const markdown = parts.join('\n').trim() || '_No extractable text._'
    return { markdown, warnings }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) throw error
    throw toPdfError(error)
  }
}

function itemsToMarkdown(items: TextItem[], pageHeight: number): string {
  if (!items.length) return '_Empty page._\n'

  // Sort top-to-bottom, then left-to-right
  const sorted = [...items].sort((a, b) => {
    const dy = b.y - a.y
    if (Math.abs(dy) > 4) return dy
    return a.x - b.x
  })

  const lines: { y: number; height: number; parts: string[] }[] = []
  for (const item of sorted) {
    const last = lines[lines.length - 1]
    if (last && Math.abs(last.y - item.y) < Math.max(item.height, last.height) * 0.6) {
      last.parts.push(item.str)
      last.height = Math.max(last.height, item.height)
    } else {
      lines.push({ y: item.y, height: item.height, parts: [item.str] })
    }
  }

  const avgHeight =
    lines.reduce((s, l) => s + l.height, 0) / Math.max(lines.length, 1)

  const out: string[] = []
  for (const line of lines) {
    const text = line.parts.join(' ').replace(/\s+/g, ' ').trim()
    if (!text) continue
    // Heuristic headings: larger text near top, or short ALL CAPS
    const nearTop = line.y > pageHeight * 0.75
    if (line.height > avgHeight * 1.4 || (nearTop && text.length < 80 && text === text.toUpperCase() && /[A-Z]/.test(text))) {
      out.push(`\n### ${text}\n`)
    } else {
      out.push(`${text}\n`)
    }
  }
  return out.join('\n')
}
