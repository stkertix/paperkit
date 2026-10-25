export interface PdfFile {
  id: string
  file: File
  name: string
  size: number
  lastModified: number
  objectUrl?: string
}

export interface FileValidationOptions {
  acceptMime: string[]
  acceptExt: string[]
  maxBytes: number
  multiple: boolean
}

export interface ToolCard {
  id: string
  title: string
  description: string
  to: string
  icon: string
}

export interface PdfPageMeta {
  pageNumber: number
  width: number
  height: number
  rotation: number
}

export type ImageFormat = 'png' | 'jpg'
export type PagePreset = 'a4' | 'letter' | 'original'
export type Orientation = 'portrait' | 'landscape'
export type FitMode = 'contain' | 'cover' | 'stretch'
export type CompressLevel = 'low' | 'medium' | 'high'
export type RotateDegrees = 90 | 180 | 270

export const DEFAULT_MAX_BYTES = 100 * 1024 * 1024
export const THUMBNAIL_WIDTH = 160

export const PDF_ACCEPT: FileValidationOptions = {
  acceptMime: ['application/pdf'],
  acceptExt: ['.pdf'],
  maxBytes: DEFAULT_MAX_BYTES,
  multiple: true,
}

export const IMAGE_ACCEPT: FileValidationOptions = {
  acceptMime: ['image/jpeg', 'image/png', 'image/webp'],
  acceptExt: ['.jpg', '.jpeg', '.png', '.webp'],
  maxBytes: DEFAULT_MAX_BYTES,
  multiple: true,
}
