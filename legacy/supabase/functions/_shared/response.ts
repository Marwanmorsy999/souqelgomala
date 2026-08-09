/**
 * Shared JSON response helpers for Supabase Edge Functions.
 */

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
    },
    status,
  })
}

export function success(data: unknown, status = 200) {
  return json({ success: true, data }, status)
}

export function error(message: string, status = 400) {
  return json({ success: false, error: message }, status)
}

export function notFound(message = 'Resource not found') {
  return error(message, 404)
}

export function unauthorized(message = 'Unauthorized') {
  return error(message, 401)
}

export function forbidden(message = 'Forbidden') {
  return error(message, 403)
}

export function validationError(errors: Record<string, string[]>) {
  return json({ success: false, errors }, 422)
}
