import { PDFDocument } from 'pdf-lib'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { toPdfError } from '@/services/errors/pdfErrors'

if (import.meta.env.MODE !== 'test') {
  GlobalWorkerOptions.workerSrc = pdfWorker
}

export type InspectValue<T> = { status: 'ok'; value: T } | { status: 'unavailable' }

function ok<T>(value: T): InspectValue<T> {
  return { status: 'ok', value }
}

function unavailable<T>(): InspectValue<T> {
  return { status: 'unavailable' }
}

export interface PdfInspection {
  file: {
    name: string
    size: number
    pages: InspectValue<number>
    version: InspectValue<string>
  }
  security: {
    encrypted: InspectValue<boolean>
  }
  document: {
    title: InspectValue<string>
    author: InspectValue<string>
    subject: InspectValue<string>
    creator: InspectValue<string>
    producer: InspectValue<string>
  }
  content: {
    fonts: InspectValue<string[]>
    images: InspectValue<number>
    annotations: InspectValue<number>
    forms: InspectValue<boolean>
    embeddedFiles: InspectValue<number>
  }
  pages: InspectValue<{ pageNumber: number; width: number; height: number }[]>
}

export async function inspectPdf(
  data: Uint8Array,
  meta: { name: string; size: number },
): Promise<PdfInspection> {
  const result: PdfInspection = {
    file: {
      name: meta.name,
      size: meta.size,
      pages: unavailable(),
      version: unavailable(),
    },
    security: { encrypted: unavailable() },
    document: {
      title: unavailable(),
      author: unavailable(),
      subject: unavailable(),
      creator: unavailable(),
      producer: unavailable(),
    },
    content: {
      fonts: unavailable(),
      images: unavailable(),
      annotations: unavailable(),
      forms: unavailable(),
      embeddedFiles: unavailable(),
    },
    pages: unavailable(),
  }

  try {
    const doc = await PDFDocument.load(data, { ignoreEncryption: true })
    result.file.pages = ok(doc.getPageCount())
    const title = doc.getTitle()
    const author = doc.getAuthor()
    const subject = doc.getSubject()
    const creator = doc.getCreator()
    const producer = doc.getProducer()
    if (title) result.document.title = ok(title)
    if (author) result.document.author = ok(author)
    if (subject) result.document.subject = ok(subject)
    if (creator) result.document.creator = ok(creator)
    if (producer) result.document.producer = ok(producer)

    const pageInfos = doc.getPages().map((page, i) => {
      const { width, height } = page.getSize()
      return { pageNumber: i + 1, width, height }
    })
    result.pages = ok(pageInfos)

    try {
      const form = doc.getForm()
      const fields = form.getFields()
      result.content.forms = ok(fields.length > 0)
    } catch {
      result.content.forms = unavailable()
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message.toLowerCase() : ''
    if (msg.includes('encrypt') || msg.includes('password')) {
      result.security.encrypted = ok(true)
      return result
    }
    // continue to pdf.js attempt
  }

  try {
    const loadingTask = getDocument({ data: data.slice() })
    const pdf = await loadingTask.promise
    result.file.pages = ok(pdf.numPages)
    const metadata = await pdf.getMetadata().catch(() => null)
    const info = (metadata?.info ?? {}) as Record<string, string>
    if (info.PDFFormatVersion) result.file.version = ok(`PDF ${info.PDFFormatVersion}`)
    if (info.Title) result.document.title = ok(info.Title)
    if (info.Author) result.document.author = ok(info.Author)
    if (info.Subject) result.document.subject = ok(info.Subject)
    if (info.Creator) result.document.creator = ok(info.Creator)
    if (info.Producer) result.document.producer = ok(info.Producer)

    let annotationCount = 0
    const pageInfos: { pageNumber: number; width: number; height: number }[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 1 })
      pageInfos.push({ pageNumber: i, width: viewport.width, height: viewport.height })
      const annotations = await page.getAnnotations().catch(() => [])
      annotationCount += annotations.length
    }
    result.pages = ok(pageInfos)
    result.content.annotations = ok(annotationCount)
    // Fonts/images/embedded files: not reliably enumerable without deep parse
    result.content.fonts = unavailable()
    result.content.images = unavailable()
    result.content.embeddedFiles = unavailable()
    await pdf.cleanup()
  } catch (error) {
    if (result.file.pages.status === 'unavailable') {
      throw toPdfError(error)
    }
  }

  if (result.security.encrypted.status === 'unavailable') {
    result.security.encrypted = ok(false)
  }

  return result
}
