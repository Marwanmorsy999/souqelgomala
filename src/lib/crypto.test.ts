import { describe, expect, it } from 'vitest'
import {
  hashPassword,
  verifyPassword,
  hashToken,
  generateOpaqueToken,
  toBase64,
  fromBase64,
} from '@/lib/crypto'

describe('crypto (Web Crypto — Cloudflare compatible)', () => {
  it('round-trips a password through hashPassword/verifyPassword', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(hash).toBeTruthy()
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true)
    expect(await verifyPassword('wrong password', hash)).toBe(false)
  })

  it('produces distinct hashes for identical passwords (random salt)', async () => {
    const a = await hashPassword('same-pass')
    const b = await hashPassword('same-pass')
    expect(a).not.toBe(b)
    expect(await verifyPassword('same-pass', a)).toBe(true)
    expect(await verifyPassword('same-pass', b)).toBe(true)
  })

  it('rejects malformed hashes without throwing', async () => {
    expect(await verifyPassword('x', '')).toBe(false)
    expect(await verifyPassword('x', 'not-base64-!!')).toBe(false)
  })

  it('hashes tokens deterministically (SHA-256)', async () => {
    const token = 'opaque-session-token-123'
    const h1 = await hashToken(token)
    const h2 = await hashToken(token)
    expect(h1).toBe(h2)
    expect(h1).not.toBe(token)
  })

  it('generates cryptographically-random opaque tokens', () => {
    const a = generateOpaqueToken()
    const b = generateOpaqueToken()
    expect(a).toBeTruthy()
    expect(a.length).toBeGreaterThanOrEqual(32)
    expect(a).not.toBe(b)
    expect(a).toMatch(/^[a-zA-Z0-9]+$/)
  })

  it('base64 helpers round-trip byte arrays', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 255])
    const encoded = toBase64(bytes)
    const decoded = fromBase64(encoded)
    expect(Array.from(decoded)).toEqual(Array.from(bytes))
  })
})