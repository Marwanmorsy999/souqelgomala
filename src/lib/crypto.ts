/**
 * Cryptography helpers — pure Web Crypto (Cloudflare Workers / Node 18+ compatible).
 *
 * Password hashing uses PBKDF2 (SHA-256, 100,000 iterations, 16-byte random salt).
 * Stored format: base64( salt(16) || derivedKey(32) )
 *
 * No Node-only libraries — runs on Cloudflare Workers and in Node test/seed scripts.
 */

export const PBKDF2_ITERATIONS = 100_000
export const PBKDF2_SALT_BYTES = 16
export const PBKDF2_KEY_BYTES = 32

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder().encode(password)
  const salt = crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES))
  const keyMaterial = await crypto.subtle.importKey('raw', enc, { name: 'PBKDF2' }, false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    PBKDF2_KEY_BYTES * 8
  )
  const hashArray = new Uint8Array(bits)
  const combined = new Uint8Array(salt.length + hashArray.length)
  combined.set(salt)
  combined.set(hashArray, salt.length)
  return toBase64(combined)
}

export async function verifyPassword(password: string, hashBase64: string): Promise<boolean> {
  try {
    const combined = fromBase64(hashBase64)
    if (combined.byteLength !== PBKDF2_SALT_BYTES + PBKDF2_KEY_BYTES) return false

    const salt = combined.slice(0, PBKDF2_SALT_BYTES)
    const expectedHash = combined.slice(PBKDF2_SALT_BYTES)
    const enc = new TextEncoder().encode(password)
    const keyMaterial = await crypto.subtle.importKey('raw', enc, { name: 'PBKDF2' }, false, ['deriveBits'])
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      PBKDF2_KEY_BYTES * 8
    )
    const actualHash = new Uint8Array(bits)
    if (actualHash.length !== expectedHash.length) return false

    let diff = 0
    for (let i = 0; i < actualHash.length; i++) {
      diff |= actualHash[i] ^ expectedHash[i]
    }
    return diff === 0
  } catch {
    return false
  }
}

/**
 * Base64 helpers that work in both Cloudflare Workers (btoa/atob on
 * Uint8Array) and Node.js. `Buffer` is intentionally NOT used.
 */
export function toBase64(bytes: Uint8Array): string {
  if (typeof btoa === 'function') {
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
  // Node path (seed scripts / tests)
  const chunks: string[] = []
  for (let i = 0; i < bytes.length; i += 0x8000) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + 0x8000)))
  }
  return Buffer.from(chunks.join(''), 'binary').toString('base64')
}

export function fromBase64(value: string): Uint8Array {
  if (typeof atob === 'function') {
    const binary = atob(value)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }
  const buf = Buffer.from(value, 'base64')
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
}

/**
 * Generate a cryptographically-random opaque token (for session tokens).
 */
export function generateOpaqueToken(byteLength = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength))
  return toBase64(bytes).replace(/[^a-zA-Z0-9]/g, '').slice(0, 64)
}

/**
 * SHA-256 hash of a token (used to store session tokens at rest).
 */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return toBase64(new Uint8Array(digest))
}