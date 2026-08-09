/**
 * Cloudflare Turnstile Verification
 *
 * Replaces any CAPTCHA or anti-bot integration.
 * Turnstile is Cloudflare's privacy-first alternative to reCAPTCHA.
 *
 * Server-side only — verifies the token sent by the browser.
 */

export interface TurnstileVerificationResult {
  success: boolean
  challenge_ts?: string
  hostname?: string
  errorCodes?: string[]
}

/**
 * Verify a Turnstile token with Cloudflare.
 *
 * @param token   The token from the browser (cf-turnstile-response)
 * @param remoteIp Optional client IP
 */
export async function verifyTurnstile(
  token: string,
  remoteIp?: string
): Promise<TurnstileVerificationResult> {
  const secret = getTurnstileSecret()
  if (!secret) {
    // If no secret is configured, fail open in dev, closed in prod
    if (process.env.NODE_ENV === 'production') {
      return { success: false, errorCodes: ['missing-secret'] }
    }
    return { success: true }
  }

  const form = new FormData()
  form.append('secret', secret)
  form.append('response', token)
  if (remoteIp) {
    form.append('remoteip', remoteIp)
  }

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    })

    if (!res.ok) {
      return { success: false, errorCodes: ['http-error'] }
    }

    return (await res.json()) as TurnstileVerificationResult
  } catch (err) {
    return { success: false, errorCodes: ['network-error'] }
  }
}

function getTurnstileSecret(): string | undefined {
  // Cloudflare Workers: secret injected as a binding or env var
  const binding = (globalThis as Record<string, unknown>).TURNSTILE_SECRET_KEY
  if (typeof binding === 'string' && binding) return binding

  // Node.js / Next.js server
  if (typeof process !== 'undefined') {
    return process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY
  }

  return undefined
}
