/**
 * Cloudinary module — public entry point.
 *
 * Browser-safe: only imports delivery URL helpers and validation types.
 * Server-only: uses the upload/client submodules (credentials stay server-side).
 *
 * GUIDANCE:
 *   - Client components: import `{ buildCloudinaryUrl, productCardImageUrl, ... }`
 *     from here (or `./urls`). These never touch credentials.
 *   - Server routes/services: additionally import the upload/deletion helpers
 *     from here. The client bundle will never receive those imports.
 */

// Safe for browser (no credentials).
export {
  buildCloudinaryUrl,
  heroImageUrl,
  categoryImageUrl,
  productCardImageUrl,
  productDetailImageUrl,
  placeholderImage,
} from './urls'
export type { CloudinaryTransformOptions } from './types'
export {
  MAX_IMAGE_BYTES,
  ALLOWED_IMAGE_MIME,
  ALLOWED_IMAGE_EXTENSIONS,
} from './types'
export type {
  CloudinaryConfig,
  CloudinaryResourceType,
  CloudinaryUploadResult,
} from './types'

