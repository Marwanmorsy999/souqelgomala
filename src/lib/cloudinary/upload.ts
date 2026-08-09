/**
 * Cloudinary upload orchestration — SERVER-ONLY.
 *
 * Validates the file, uploads to Cloudinary, and returns the metadata needed
 * to persist a D1 media record. Never uploads binary data to D1 and never
 * returns a secret to the caller.
 */

import {
  MAX_IMAGE_BYTES,
  ALLOWED_IMAGE_MIME,
  ALLOWED_IMAGE_EXTENSIONS,
  type CloudinaryResourceType,
  type CloudinaryUploadResult,
} from './types'
import {
  getCloudinaryServerConfig,
  cloudinaryConfigured,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} from './client'
import { logger } from '@/lib/logger'

export interface UploadImageInput {
  /** Raw file bytes (server-only; never persists to D1). */
  buffer: Uint8Array
  originalName: string
  mimeType: string
  folder?: string
  resourceType?: CloudinaryResourceType
}

export class CloudinaryValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CloudinaryValidationError'
  }
}

export function getFileExtension(filename: string): string {
  const idx = filename.lastIndexOf('.')
  if (idx < 0 || idx === filename.length - 1) return ''
  return filename.slice(idx).toLowerCase()
}

export function validateImageUpload(input: Pick<UploadImageInput, 'buffer' | 'originalName' | 'mimeType'>): void {
  if (!input.buffer || input.buffer.byteLength === 0) {
    throw new CloudinaryValidationError('File is empty')
  }
  if (input.buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new CloudinaryValidationError(
      `File size ${input.buffer.byteLength} exceeds maximum allowed ${MAX_IMAGE_BYTES}`
    )
  }
  if (!ALLOWED_IMAGE_MIME.includes(input.mimeType as (typeof ALLOWED_IMAGE_MIME)[number])) {
    throw new CloudinaryValidationError(
      `MIME type "${input.mimeType}" is not allowed. Allowed: ${ALLOWED_IMAGE_MIME.join(', ')}`
    )
  }
  const ext = getFileExtension(input.originalName)
  if (!ext || !(ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new CloudinaryValidationError(
      `File extension "${ext}" is not allowed. Allowed: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`
    )
  }
}

/**
 * Upload an image to Cloudinary (server-to-server).
 *
 * When Cloudinary credentials are not yet configured (dev/local), this
 * function returns a "pending" result with no public_id so the API can respond
 * gracefully and the D1 media record is NOT created (avoiding orphaned rows).
 * Real uploads happen only when credentials exist and validation passes.
 */
export async function uploadImageToCloudinary(input: UploadImageInput): Promise<CloudinaryUploadResult> {
  validateImageUpload(input)

  if (!cloudinaryConfigured()) {
    // No real credentials yet: don't create an orphan media record.
    logger.warn('Cloudinary: not configured, returning pending upload (no D1 record will be created)')
    return {
      publicId: '',
      secureUrl: '',
      width: 0,
      height: 0,
      format: '',
      resourceType: input.resourceType ?? 'image',
      bytes: input.buffer.byteLength,
      originalFilename: input.originalName,
      error: 'Cloudinary not configured',
    }
  }

  const config = getCloudinaryServerConfig()
  const folder = input.folder ?? config.folder ?? 'souk-el-gomla/products'
  let res: Response
  try {
    res = await uploadBufferToCloudinary(config, input.buffer, {
      resourceType: input.resourceType ?? 'image',
      folder,
    })
  } catch (err) {
    logger.error('Cloudinary: network error during upload', { error: err })
    throw new Error('Cloudinary upload failed (network error)')
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    logger.error('Cloudinary: upload failed', { status: res.status, body })
    throw new Error(`Cloudinary upload failed (status ${res.status})`)
  }

  const json = (await res.json()) as {
    public_id?: string
    secure_url?: string
    width?: number
    height?: number
    format?: string
    bytes?: number
    error?: { message?: string }
  }

  if (json.error) {
    logger.error('Cloudinary: upload error payload', { message: json.error.message })
    throw new Error(json.error.message || 'Cloudinary upload failed')
  }

  return {
    publicId: json.public_id ?? '',
    secureUrl: json.secure_url ?? '',
    width: json.width ?? 0,
    height: json.height ?? 0,
    format: json.format ?? '',
    resourceType: input.resourceType ?? 'image',
    bytes: json.bytes ?? input.buffer.byteLength,
    originalFilename: input.originalName,
  }
}

/**
 * Delete a public asset, best-effort. Prevents orphaned Cloudinary media when
 * replacing/deleting product images. If Cloudinary is not configured, returns
 * false without throwing so the transaction can still complete locally.
 */
export async function deleteCloudinaryAsset(publicId: string): Promise<boolean> {
  if (!publicId) return false
  if (!cloudinaryConfigured()) {
    logger.warn('Cloudinary: not configured, skipping delete', { publicId })
    return false
  }
  const config = getCloudinaryServerConfig()
  try {
    return await deleteFromCloudinary(config, publicId)
  } catch (err) {
    logger.error('Cloudinary: delete failed', { publicId, error: err })
    return false
  }
}

