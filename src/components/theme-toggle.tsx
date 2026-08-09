'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

const emptySubscribe = () => () => {}

/**
 * True after the client has hydrated (SSR-safe via useSyncExternalStore).
 * Avoids setState-in-effect; prevents a hydration mismatch for the aria-label.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

/**
 * Light/dark theme toggle. Uses next-themes (already configured at the
 * root AppProviders). The two icons cross-fade to avoid layout shift.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useHydrated()

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('relative', className)}
      aria-label={mounted ? (isDark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن') : 'تبديل السمة'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      <Sun className="size-5 scale-100 rotate-0 transition-all duration-200 dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-5 scale-0 rotate-90 transition-all duration-200 dark:scale-100 dark:rotate-0" />
    </Button>
  )
}

