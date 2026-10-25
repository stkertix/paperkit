import { ref } from 'vue'
import type { FileValidationOptions, PdfFile } from '@/types/pdf'
import { PDF_ACCEPT } from '@/types/pdf'
import { createPdfError } from '@/services/errors/pdfErrors'

function duplicateKey(file: File): string {
  return `${file.name}::${file.size}::${file.lastModified}`
}

function extensionOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i).toLowerCase() : ''
}

export function validateFile(
  file: File,
  options: FileValidationOptions,
): { ok: true } | { ok: false; message: string } {
  const ext = extensionOf(file.name)
  const mimeOk = !file.type || options.acceptMime.includes(file.type)
  const extOk = options.acceptExt.includes(ext)
  if (!mimeOk && !extOk) {
    return { ok: false, message: `Unsupported file type: ${file.name}` }
  }
  if (file.size > options.maxBytes) {
    return {
      ok: false,
      message: `${file.name} exceeds the ${(options.maxBytes / (1024 * 1024)).toFixed(0)} MB limit`,
    }
  }
  return { ok: true }
}

export function useFileDrop(options: FileValidationOptions = PDF_ACCEPT) {
  const files = ref<PdfFile[]>([])
  const error = ref<string | null>(null)
  const seen = new Set<string>()

  function addFiles(list: FileList | File[]) {
    error.value = null
    const incoming = Array.from(list)
    if (!options.multiple && incoming.length + files.value.length > 1) {
      error.value = 'Only one file is allowed'
      return
    }
    for (const file of incoming) {
      const result = validateFile(file, options)
      if (!result.ok) {
        error.value = result.message
        continue
      }
      const key = duplicateKey(file)
      if (seen.has(key)) {
        error.value = `Duplicate skipped: ${file.name}`
        continue
      }
      seen.add(key)
      const id = crypto.randomUUID()
      files.value.push({
        id,
        file,
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        objectUrl: URL.createObjectURL(file),
      })
    }
  }

  function removeFile(id: string) {
    const idx = files.value.findIndex((f) => f.id === id)
    if (idx < 0) return
    const [removed] = files.value.splice(idx, 1)
    if (removed.objectUrl) URL.revokeObjectURL(removed.objectUrl)
    seen.delete(duplicateKey(removed.file))
  }

  function clear() {
    for (const f of files.value) {
      if (f.objectUrl) URL.revokeObjectURL(f.objectUrl)
    }
    files.value = []
    seen.clear()
    error.value = null
  }

  function requireFiles(min = 1) {
    if (files.value.length < min) throw createPdfError('EMPTY_INPUT')
  }

  function reorder(from: number, to: number) {
    if (from < 0 || to < 0 || from >= files.value.length || to >= files.value.length) return
    const next = [...files.value]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    files.value = next
  }

  return { files, error, addFiles, removeFile, clear, requireFiles, reorder, options }
}
