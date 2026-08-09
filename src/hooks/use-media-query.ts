'use client'

import { useEffect, useState } from 'react'

/**
 * Reactively tracks a CSS media query.
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)')
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    // Defer initial sync to a microtask to avoid cascading render warnings
    const frame = requestAnimationFrame(() => setMatches(media.matches))

    const listener = (event: MediaQueryListEvent) => setMatches(event.matches)
    media.addEventListener('change', listener)
    return () => {
      cancelAnimationFrame(frame)
      media.removeEventListener('change', listener)
    }
  }, [query])

  return matches
}

/** Convenience breakpoint hooks */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)')
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')

