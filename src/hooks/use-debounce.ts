'use client'

import { useEffect, useState } from 'react'

/**
 * Returns a debounced copy of the input value.
 * Useful for search inputs to avoid firing queries on every keystroke.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}

