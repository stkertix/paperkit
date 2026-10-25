import { ref, type Ref } from 'vue'
import { createPdfError, toPdfError, type PdfAppError } from '@/services/errors/pdfErrors'

export interface ProcessingHandle {
  isProcessing: Ref<boolean>
  progress: Ref<number | null>
  error: Ref<PdfAppError | null>
  cancel: () => void
  run: <T>(fn: (signal: AbortSignal) => Promise<T>) => Promise<T | undefined>
  clearError: () => void
}

export function useProcessing(): ProcessingHandle {
  const isProcessing = ref(false)
  const progress = ref<number | null>(null)
  const error = ref<PdfAppError | null>(null)
  let controller: AbortController | null = null

  function cancel() {
    controller?.abort()
    error.value = createPdfError('CANCELLED')
    isProcessing.value = false
  }

  function clearError() {
    error.value = null
  }

  async function run<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T | undefined> {
    controller?.abort()
    controller = new AbortController()
    isProcessing.value = true
    progress.value = 0
    error.value = null
    try {
      const result = await fn(controller.signal)
      return result
    } catch (e) {
      const appError = toPdfError(e)
      if (appError.code !== 'CANCELLED') {
        error.value = appError
      } else {
        error.value = appError
      }
      return undefined
    } finally {
      isProcessing.value = false
      progress.value = null
    }
  }

  return { isProcessing, progress, error, cancel, run, clearError }
}
