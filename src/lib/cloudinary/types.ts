/**
 * Cloudinary types & shared constants.
 *
 * These are the server-side + delivery types for the Cloudinary service.
 * No secret/credential type ever reaches the browser bundle.
 */

export type CloudinaryResourceType = 'image' | 'video' | 'auto'

/** Base credentials needed for server-side Cloudinary API calls. */
export interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
  /** Optional secure, HTTPS delivery prefix (defaults to res.cloudinary.com). */
  secureUrl?: string
  /** Default asset folder to scope uploads (e.g. "souk-el-gomla/products"). */
  folder?: string
}

/** Size/transformation hints used to build delivery URLs. */
export interface CloudinaryTransformOptions {
  width?: number
  height?: number
  /** Cloudinary crop mode (default 'fill'). */
  crop?: 'fill' | 'lpad' | 'fit' | 'scale' | 'thumb' | 'crop' | 'limit' | 'pad'
  /** Must crop the image to exact dimensions when crop=fill (false = maintain aspect & allow UNCROPPED). */
  gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west'
  /** Quality 1-100 or 'auto'. */
  quality?: number | 'auto'
  /** Output format or 'auto' for automatic format negotiation. */
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif' | 'gif'
  /** Device pixel ratio 1-3. */
  dpr?: 1 | 2 | 3 | 'auto'
  /** Focal length / aspect ratio. */
  aspectRatio?: string
  /** Fade/sharpen/other effect flags. */
  flags?: string[]
  /** Fine control over auto-optimization. */
  fetch_format?: string
}

/** A Cloudinary-validated upload result (server only). */
export interface CloudinaryUploadResult {
  publicId: string
  secureUrl: string
  width: number
  height: number
  format: string
  resourceType: CloudinaryResourceType
  bytes: number
  /** Original filename, safe for display only (never trusted for paths). */
  originalFilename?: string
  /** Provider error if any (e.g. quota, invalid credentials, network). */
  error?: string
}

/** Validation rules enforced before any upload reaches Cloudinary. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10MB
export const ALLOWED_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
] as const
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'] as const

/** Server-only config getter path — values never serialized to client. */
export function cloudinaryConfigKeys() {
  return ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'] as const
}

