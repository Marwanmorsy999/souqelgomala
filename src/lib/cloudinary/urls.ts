/**
 * Cloudinary delivery URL builder — SAFE FOR THE BROWSER.
 *
 * This module only builds a CDN URL from a public_id + transformation options.
 * It never touches credentials, so it may be imported by client components.
 *
 * Use these presets for consistent, correctly-cropped, auto-optimized images:
 *   - heroImage():    wide, high-quality
 *   - categoryImage(): square thumbnail
 *   - productCard():  near-square optimized thumbnail
 *   - productDetail(): larger responsive image
 */

import type { CloudinaryTransformOptions } from './types'

/** Read the public cloud name from env/binding (only used for URL building). */
function getCloudName(): string {
  const binding = globalThis as Record<string, unknown>
  const name =
    (binding.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string | undefined) ??
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ??
    process.env.CLOUDINARY_CLOUD_NAME ??
    'demo'
  return name
}

function escapeSegment(value: string): string {
  // Only replace characters that Cloudinary does not accept in public_ids
  // so URLs stay valid. Preserves slashes (folders).
  return value.replace(/[?%=]/g, '_')
}

/** Default delivery base (secure). */
const DEFAULT_BASE = 'https://res.cloudinary.com'

/**
 * Build a Cloudinary delivery URL for a public_id with transformation options.
 * The public_id must be URL-safe (folders split by `/`).
 */
export function buildCloudinaryUrl(
  publicId: string,
  options: CloudinaryTransformOptions = {}
): string {
  const cloudName = getCloudName()
  const segments: string[] = []
  if (options.width) segments.push(`w_${options.width}`)
  if (options.height) segments.push(`h_${options.height}`)
  if (options.aspectRatio) segments.push(`ar_${options.aspectRatio}`)
  if (options.crop) segments.push(`c_${options.crop}`)
  if (options.gravity) segments.push(`g_${options.gravity}`)
  if (options.dpr) segments.push(`dpr_${options.dpr}`)
  if (options.flags && options.flags.length) segments.push(options.flags.join(','))
  // Automatic quality + format optimization.
  segments.push(`q_${options.quality ?? 'auto'}`)
  segments.push(`f_${options.format ?? 'auto'}`)

  const transformation = segments.join(',')
  const path = escapeSegment(publicId)
  const base = (globalThis as Record<string, unknown>).NEXT_PUBLIC_CLOUDINARY_BASE as string | undefined
  const cloudinaryBase = base || DEFAULT_BASE
  return `${cloudinaryBase}/${cloudName}/image/upload/${transformation}/${path}`
}

/** Fallback placeholder when no media exists yet (infra-ready, no fake data). */
export function placeholderImage(width = 600, height = 600): string {
  return `/placeholder.svg`
}

// ============================================
// PRESETS (single source of truth for the UI)
// ============================================

/** Wide hero background — high quality, auto format. */
export function heroImageUrl(publicId: string): string {
  return buildCloudinaryUrl(publicId, {
    width: 1600,
    height: 900,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto',
  })
}

/** Circular/square category thumbnail. */
export function categoryImageUrl(publicId: string): string {
  return buildCloudinaryUrl(publicId, {
    width: 400,
    height: 400,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto',
  })
}

/** Product card thumbnail — near-square, optimized. */
export function productCardImageUrl(publicId: string): string {
  return buildCloudinaryUrl(publicId, {
    width: 500,
    height: 500,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto',
    dpr: 2,
  })
}

/** Product detail image — larger, responsive-friendly. */
export function productDetailImageUrl(publicId: string): string {
  return buildCloudinaryUrl(publicId, {
    width: 900,
    height: 900,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto',
  })
}

