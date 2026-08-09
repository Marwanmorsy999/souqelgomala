'use client'

import { useEffect } from 'react'

type Modifier = 'ctrl' | 'meta' | 'shift' | 'alt'

interface ShortcutOptions {
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  /** Prevent default browser behavior for the key combo */
  preventDefault?: boolean
  /** Disable the shortcut when a form field is focused (default true) */
  ignoreInputs?: boolean
}

function matchesModifiers(event: KeyboardEvent, options: ShortcutOptions): boolean {
  const ctrl = options.ctrl ?? false
  const meta = options.meta ?? false
  const shift = options.shift ?? false
  const alt = options.alt ?? false

  if (ctrl !== event.ctrlKey) return false
  if (meta !== event.metaKey) return false
  if (shift !== event.shiftKey) return false
  if (alt !== event.altKey) return false
  return true
}

function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null
  if (!element) return false
  const tag = element.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    element.isContentEditable
  )
}

/**
 * Register a keyboard shortcut.
 *
 * @param key - The key to match (e.g., 'k', 'Escape', '/')
 * @param handler - Callback fired on key match
 * @param options - Modifier keys and behavior flags
 */
export function useKeyboardShortcut(
  key: string,
  handler: (event: KeyboardEvent) => void,
  options: ShortcutOptions = {}
): void {
  const { ignoreInputs = true } = options

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key.toLowerCase()) return
      if (!matchesModifiers(event, options)) return
      if (ignoreInputs && isTypingTarget(event.target)) return

      if (options.preventDefault) event.preventDefault()
      handler(event)
    }

    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, handler, options.ctrl, options.meta, options.shift, options.alt, ignoreInputs])
}

