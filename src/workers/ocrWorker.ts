/**
 * OCR runs via Tesseract.js's own worker (createWorker).
 * This module isolates OCR orchestration so the UI never imports lang data eagerly.
 */
import { createWorker, type Worker } from 'tesseract.js'

export type OcrLang = 'eng' | 'ind' | 'jpn' | 'chi_sim'
export type OcrWorkerProgress = (p: number) => void

let worker: Worker | null = null
let loadedLang: OcrLang | null = null

export async function ensureOcrWorker(
  lang: OcrLang,
  onProgress?: OcrWorkerProgress,
): Promise<Worker> {
  if (worker && loadedLang === lang) return worker
  if (worker) {
    await worker.terminate()
    worker = null
    loadedLang = null
  }
  worker = await createWorker(lang, 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.(m.progress)
      }
    },
  })
  loadedLang = lang
  return worker
}

export async function recognizeImage(
  image: HTMLCanvasElement | Blob | string,
  lang: OcrLang,
  onProgress?: OcrWorkerProgress,
): Promise<string> {
  const w = await ensureOcrWorker(lang, onProgress)
  const { data } = await w.recognize(image)
  return data.text.trim()
}

export async function terminateOcrWorker(): Promise<void> {
  if (worker) {
    await worker.terminate()
    worker = null
    loadedLang = null
  }
}
