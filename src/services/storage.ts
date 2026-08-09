/**
 * Storage Abstraction (replaces Supabase Storage)
 *
 * All binary data lives in R2. D1 stores only metadata/object keys.
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
  try {
    return await uploadToR2(resource, data, options)
  } catch (err) {
    logger.error('Storage: upload failed', { resource, error: err })
    throw err
  }
}

export async function deleteFile(resource: R2Resource, key: string): Promise<void> {
  try {
    await deleteFromR2(resource, key)
  } catch (err) {
    logger.error('Storage: delete failed', { resource, key, error: err })
    throw err
  }
}

export function getPublicUrl(resource: R2Resource, key: string): string {
  return `https://${resource}-assets.soukelgomla.com/${key}`
}

export async function getSignedDownloadUrl(
  resource: R2Resource,
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  return getSignedUrl(resource, key, expiresIn)
}

export async function fileExists(resource: R2Resource, key: string): Promise<boolean> {
  return objectExists(resource, key)
}

export async function getFileStream(resource: R2Resource, key: string): Promise<unknown | null> {
  return getR2Object(resource, key)
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


