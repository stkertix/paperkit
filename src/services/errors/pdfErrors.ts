export type PdfErrorCode =
  | 'CORRUPT_PDF'
  | 'ENCRYPTED_PDF'
  | 'UNSUPPORTED'
  | 'EMPTY_INPUT'
  | 'CANCELLED'
  | 'OUT_OF_MEMORY'

export interface PdfAppError {
  code: PdfErrorCode
  message: string
  cause?: unknown
}

const MESSAGES: Record<PdfErrorCode, string> = {
  CORRUPT_PDF: 'Unable to open PDF. The file may be corrupted or unsupported.',
  ENCRYPTED_PDF:
    'This PDF is encrypted or password-protected and cannot be processed in the browser.',
  UNSUPPORTED: 'This file type or operation is not supported.',
  EMPTY_INPUT: 'Add at least one valid file (or select pages) to continue.',
  CANCELLED: 'Cancelled.',
  OUT_OF_MEMORY: 'The browser ran out of memory. Try fewer pages or a lower resolution.',
}

export function createPdfError(code: PdfErrorCode, cause?: unknown): PdfAppError {
  return { code, message: MESSAGES[code], cause }
}

export function toPdfError(error: unknown): PdfAppError {
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    return error as PdfAppError
  }
  if (error instanceof DOMException && error.name === 'AbortError') {
    return createPdfError('CANCELLED', error)
  }
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  if (msg.includes('password') || msg.includes('encrypt')) {
    return createPdfError('ENCRYPTED_PDF', error)
  }
  if (msg.includes('memory') || msg.includes('allocation')) {
    return createPdfError('OUT_OF_MEMORY', error)
  }
  return createPdfError('CORRUPT_PDF', error)
}

export function isPdfAppError(error: unknown): error is PdfAppError {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    'message' in error &&
    typeof (error as PdfAppError).code === 'string'
  )
}
