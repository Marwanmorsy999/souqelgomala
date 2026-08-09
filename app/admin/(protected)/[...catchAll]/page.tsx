import { notFound } from 'next/navigation'

/**
 * Catch-all route for /admin/*
 *
 * Next.js segment-level `not-found.tsx` only catches `notFound()` calls
 * thrown inside a segment's pages — it does NOT catch unmatched URLs.
 * This catch-all route ensures any unmatched /admin/* path renders the
 * custom admin not-found page (wrapped in the admin shell layout).
 */
export default function AdminCatchAll() {
  notFound()
}
