/**
 * Storage Abstraction (stubbed)
 *
 * Image upload is now handled via Cloudinary. All functions throw a
 * not-implemented error so that any accidental call fails loudly with
 * "Image upload not configured. Use Cloudinary."
 */

import {
  uploadToR2,
  deleteFromR2,
  getSignedUrl,
  getR2Object,
  objectExists,
  R2Resource,
  R2UploadResult,
  R2UploadOptions,
  R2ValidationError,
} from '@/lib/cloudflare/r2'
import { logger } from '@/lib/logger'

export type { R2Resource, R2UploadResult, R2UploadOptions } from '@/lib/cloudflare/r2'

export async function uploadFile(
  resource: R2Resource,
  data: Uint8Array,
  options: Omit<R2UploadOptions, 'size' | 'originalName' | 'mimeType'> & {
    size: number
    originalName: string
    mimeType: string
  }
): Promise<R2UploadResult> {
  logger.warn('Storage: uploadFile called — R2 is removed, use Cloudinary')
  throw new Error('Image upload not configured. Use Cloudinary.')
}

export async function deleteFile(resource: R2Resource, key: string): Promise<void> {
  logger.warn('Storage: deleteFile called — R2 is removed, use Cloudinary')
  throw new Error('Image upload not configured. Use Cloudinary.')
}

export function getPublicUrl(resource: R2Resource, key: string): string {
  logger.warn('Storage: getPublicUrl called — R2 is removed, use Cloudinary')
  throw new Error('Image upload not configured. Use Cloudinary.')
}

export async function getSignedDownloadUrl(
  resource: R2Resource,
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  logger.warn('Storage: getSignedDownloadUrl called — R2 is removed, use Cloudinary')
  throw new Error('Image upload not configured. Use Cloudinary.')
}

export async function fileExists(resource: R2Resource, key: string): Promise<boolean> {
  logger.warn('Storage: fileExists called — R2 is removed, use Cloudinary')
  throw new Error('Image upload not configured. Use Cloudinary.')
}

export async function getFileStream(resource: R2Resource, key: string): Promise<unknown | null> {
  logger.warn('Storage: getFileStream called — R2 is removed, use Cloudinary')
  throw new Error('Image upload not configured. Use Cloudinary.')
}

export function validateUploadOptions(options: R2UploadOptions): void {
  if (!options.originalName) {
    throw new R2ValidationError('originalName is required')
  }
  if (!options.mimeType) {
    throw new R2ValidationError('mimeType is required')
  }
  if (options.size === undefined || options.size === null) {
    throw new R2ValidationError('size is required')
  }
  if (options.size <= 0) {
    throw new R2ValidationError('File size must be greater than 0')
  }
}
