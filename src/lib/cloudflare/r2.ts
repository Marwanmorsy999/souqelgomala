/**
 * Cloudflare R2 Storage Abstraction
 *
 * Replaces Supabase Storage. Provides upload, delete, URL generation,
 * and signed URL support for product images, category images, offer
 * banners, profile images, and branch images.
 *
 * D1 stores only metadata/object keys — binary data lives in R2.
 */

import { nanoid } from 'nanoid'
import { logger } from '@/lib/logger'
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

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf', 'text/csv']
export const MAX_FILE_SIZE = 10 * 1024 * 1024
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']
export const ALLOWED_FILE_EXTENSIONS = [...ALLOWED_IMAGE_EXTENSIONS, '.pdf', '.csv']

export class R2ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'R2ValidationError'
  }
}

/** Validate a file before upload to R2. */
export function validateFile(file: R2UploadOptions): void {
  if (file.size <= 0) {
    throw new R2ValidationError('File size must be greater than 0')
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new R2ValidationError(`File size ${file.size} exceeds maximum allowed ${MAX_FILE_SIZE}`)
  }

  const ext = getFileExtension(file.originalName).toLowerCase()
  const allowedExts = file.mimeType.startsWith('image/')
    ? ALLOWED_IMAGE_EXTENSIONS
    : ALLOWED_FILE_EXTENSIONS

  if (!allowedExts.includes(ext)) {
    throw new R2ValidationError(`File extension "${ext}" is not allowed. Allowed: ${allowedExts.join(', ')}`)
  }

  if (!ALLOWED_FILE_TYPES.includes(file.mimeType)) {
    throw new R2ValidationError(`MIME type "${file.mimeType}" is not allowed.`)
  }

  if (file.mimeType.startsWith('image/') && !ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    throw new R2ValidationError(`Image extension "${ext}" does not match MIME type "${file.mimeType}".`)
  }
}

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot >= 0 ? filename.slice(lastDot) : ''
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-]/g, '_').replace(/\.+/g, '.').replace(/^_+|_+$/g, '').toLowerCase()
}

export function generateKey(resource: R2Resource, originalName: string): string {
  const ext = getFileExtension(originalName) || '.bin'
  return `${resource}/${nanoid(16)}${ext}`
}

export function getR2PublicBaseUrl(resource: R2Resource): string {
  return `${resource}-assets.soukelgomla.com`
}

function getBucket(resource: R2Resource): R2BucketBinding {
  const bindingName = {
    product: 'PRODUCTS_BUCKET',
    category: 'CATEGORIES_BUCKET',
    offer: 'OFFERS_BUCKET',
    profile: 'PROFILES_BUCKET',
    branch: 'BRANCHES_BUCKET',
  }[resource]

  const bucket = (globalThis as Record<string, unknown>)[bindingName]
  if (!bucket) {
    throw new Error(`R2 bucket for "${resource}" (${bindingName}) is not configured`)
  }
  return bucket as unknown as R2BucketBinding
}

export async function uploadToR2(
  resource: R2Resource,
  data: Uint8Array,
  options: R2UploadOptions
): Promise<R2UploadResult> {
  validateFile(options)

  const bucket = getBucket(resource)
  const key = generateKey(resource, options.originalName)
  const contentType = options.contentType || options.mimeType

  await bucket.put(key, data, {
    httpMetadata: { contentType },
    customMetadata: {
      uploadedAt: new Date().toISOString(),
      originalName: sanitizeFilename(options.originalName),
      ...(options.metadata ?? {}),
    },
  })

  const head = await bucket.head(key)

  logger.info('R2: uploaded', { resource, key, size: options.size })

  return {
    key,
    url: `https://${getR2PublicBaseUrl(resource)}/${key}`,
    etag: head?.etag ?? '',
    size: options.size,
    contentType,
    metadata: options.metadata ?? {},
  }
}

export async function deleteFromR2(resource: R2Resource, key: string): Promise<void> {
  const bucket = getBucket(resource)
  await bucket.delete(key)
  logger.info('R2: deleted', { resource, key })
}

export async function getSignedUrl(
  resource: R2Resource,
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const bucket = getBucket(resource)
  if (typeof (bucket as { getSignedUrl?: (opts: { key: string; expires?: number }) => Promise<string> }).getSignedUrl === 'function') {
    return (bucket as { getSignedUrl: (opts: { key: string; expires?: number }) => Promise<string> })
      .getSignedUrl({ key, expires: expiresIn })
  }
  logger.warn('R2: getSignedUrl not available on bucket binding')
  return key
}

export async function getR2Object(resource: R2Resource, key: string): Promise<unknown> {
  const bucket = getBucket(resource)
  return bucket.get(key)
}

export async function objectExists(resource: R2Resource, key: string): Promise<boolean> {
  const bucket = getBucket(resource)
  const obj = await bucket.head(key)
  return obj !== null
}

