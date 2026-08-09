/**
 * Cloudinary client — SERVER-ONLY.
 *
 * Reads credentials from environment variables or Cloudflare bindings and
 * provides low-level signed requests to the Cloudinary Admin/Upload APIs.
 *
 * IMPORTANT:
 *  - Never expose `apiSecret` (or any credential) to the browser.
 *  - GUI code / client components must import only from `./urls` (delivery)
 *    or the safe public helpers — never from this module.
 */

import { cloudinaryConfigKeys, type CloudinaryConfig } from './types'
import { logger } from '@/lib/logger'

const API_BASE = 'https://api.cloudinary.com/v1_1'

/** True when real Cloudinary credentials are configured (server-side only). */
export function cloudinaryConfigured(): boolean {
  const { cloudName, apiKey, apiSecret } = readConfigOrNull()
  return Boolean(cloudName && apiKey && apiSecret)
}

function readConfigOrNull(): Partial<CloudinaryConfig> {
  const binding = globalThis as Record<string, unknown>
  const cloudName =
    (binding.CLOUDINARY_CLOUD_NAME as string | undefined) ??
    process.env.CLOUDINARY_CLOUD_NAME ??
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey =
    (binding.CLOUDINARY_API_KEY as string | undefined) ??
    process.env.CLOUDINARY_API_KEY
  const apiSecret =
    (binding.CLOUDINARY_API_SECRET as string | undefined) ??
    process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return { cloudName: cloudName ?? '', apiKey: apiKey ?? '', apiSecret: apiSecret ?? '' }
  }
  return { cloudName, apiKey, apiSecret }
}

/**
 * Server-only config. Throws when credentials are absent so callers that
 * genuinely need to upload fail fast instead of silently no-opping.
 * Never bundled to the client (import guard in `index.ts`).
 */
export function getCloudinaryServerConfig(): CloudinaryConfig {
  const config = readConfigOrNull()
  if (!config.cloudName || !config.apiKey || !config.apiSecret) {
    throw new Error(
      [
        `Cloudinary server credentials missing.`,
        `Required: ${cloudinaryConfigKeys().join(', ')}.`,
        `Set them as env vars or Cloudflare bindings (do not commit secrets).`,
      ].join(' ')
    )
  }
  return {
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    apiSecret: config.apiSecret as string,
  }
}

/**
 * Build the SHA-1 signature Cloudinary expects for an unsigned/signed request.
 * Algorithm: sha1(sortedQueryString + apiSecret).
 * Only used server-side; apiSecret never leaves this module.
 */
export async function signCloudinaryRequest(
  apiSecret: string,
  params: Record<string, unknown>
): Promise<string> {
  const data = new TextEncoder()
  const sorted = Object.keys(params)
    .filter((k) => params[k] != null && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
  const digest = await crypto.subtle.digest('SHA-1', data.encode(sorted + apiSecret))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Generate a fresh upload signature + timestamp for controlled browser uploads. */
export async function createUploadSignature(
  config: CloudinaryConfig,
  params: { timestamp: number; folder?: string }
): Promise<{ signature: string; timestamp: number }> {
  const toSign: Record<string, unknown> = { timestamp: params.timestamp }
  if (params.folder) toSign.folder = params.folder
  const signature = await signCloudinaryRequest(config.apiSecret, toSign)
  return { signature, timestamp: params.timestamp }
}

/** POST the raw buffer to Cloudinary's upload endpoint (server-to-server). */
export async function uploadBufferToCloudinary(
  config: CloudinaryConfig,
  buffer: Uint8Array,
  opts: { resourceType: 'image' | 'video' | 'auto'; folder?: string; publicId?: string }
): Promise<Response> {
  const form = new FormData()
  form.append('file', new Blob([buffer as BlobPart]))
  form.append('upload_preset', opts.publicId ? 'default' : 'default')
  form.append('folder', opts.folder ?? config.folder ?? '')
  if (opts.publicId) form.append('public_id', opts.publicId)
  form.append('api_key', config.apiKey)
  if (opts.resourceType === 'video') form.append('resource_type', 'video')

  const url = `${API_BASE}/${config.cloudName}/${opts.resourceType}/upload`
  logger.info('Cloudinary: upload requested', { folder: opts.folder, resourceType: opts.resourceType })
  return fetch(url, { method: 'POST', body: form })
}

/** Delete a single asset by public_id (server-to-server). */
export async function deleteFromCloudinary(
  config: CloudinaryConfig,
  publicId: string
): Promise<boolean> {
  const timestamp = Math.floor(Date.now() / 1000)
  const params = { public_id: publicId, timestamp }
  const signature = await signCloudinaryRequest(config.apiSecret, params)
  const url = `${API_BASE}/${config.cloudName}/image/destroy`
  const form = new FormData()
  form.append('api_key', config.apiKey)
  form.append('timestamp', String(timestamp))
  form.append('signature', signature)
  form.append('public_id', publicId)
  const res = await fetch(url, { method: 'POST', body: form })
  if (!res.ok) {
    logger.warn('Cloudinary: delete non-2xx', { publicId, status: res.status })
    return false
  }
  const json = (await res.json()) as { result?: string }
  return json.result === 'ok'
}

