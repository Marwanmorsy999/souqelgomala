/**
 * Cloudflare R2 Storage Abstraction (stubbed)
 *
 * Image upload is now handled via Cloudinary. All R2 functions throw a
 * not-implemented error so that any accidental call fails loudly with
 * "Image upload not configured. Use Cloudinary."
 */

import type { R2BucketBinding } from '@/types/cloudflare-bindings'

export type R2Resource = 'product' | 'category' | 'offer' | 'profile' | 'branch'

export interface R2UploadResult {
  key: string
  url: string
  etag: string
  size: number
  contentType: string
  metadata: Record<string, string>
}

export interface R2UploadOptions {
  contentType?: string
  metadata?: Record<string, string>
  public?: boolean
  filename?: string
  originalName: string
  size: number
  mimeType: string
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']
export const ALLOWED_FILE_EXTENSIONS = [...ALLOWED_IMAGE_EXTENSIONS, '.pdf', '.csv']

export class R2ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'R2ValidationError'
  }
}

export function validateFile(_file: R2UploadOptions): void {
  throw new Error('Image upload not configured. Use Cloudinary.')
}

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot >= 0 ? filename.slice(lastDot) : ''
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-]/g, '_').replace(/\.+/g, '.').replace(/^_+|_+$/g, '').toLowerCase()
}

export function generateKey(_resource: R2Resource, _originalName: string): string {
  throw new Error('Image upload not configured. Use Cloudinary.')
}

export function getR2PublicBaseUrl(_resource: R2Resource): string {
  throw new Error('Image upload not configured. Use Cloudinary.')
}

export async function uploadToR2(
  _resource: R2Resource,
  _data: Uint8Array,
  _options: R2UploadOptions
): Promise<R2UploadResult> {
  throw new Error('Image upload not configured. Use Cloudinary.')
}

export async function deleteFromR2(_resource: R2Resource, _key: string): Promise<void> {
  throw new Error('Image upload not configured. Use Cloudinary.')
}

export async function getSignedUrl(
  _resource: R2Resource,
  _key: string,
  _expiresIn?: number
): Promise<string> {
  throw new Error('Image upload not configured. Use Cloudinary.')
}

export async function getR2Object(_resource: R2Resource, _key: string): Promise<unknown> {
  throw new Error('Image upload not configured. Use Cloudinary.')
}

export async function objectExists(_resource: R2Resource, _key: string): Promise<boolean> {
  throw new Error('Image upload not configured. Use Cloudinary.')
}
