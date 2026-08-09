'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'

/**
 * Global error boundary for the admin section.
 * Catches render errors in any admin page and offers a retry.
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Surface the error to the central logger + monitoring (client-side).
  logger.error('Admin page render error', { digest: error.digest })

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertTriangle className="size-7 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-black">حدث خطأ غير متوقع</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          تعذر عرض هذه الصفحة. حاول مرة أخرى، وإذا استمرت المشكلة تواصل مع الدعم الفني.
        </p>
        {error.digest ? (
          <p className="font-mono text-[10px] text-muted-foreground/70">رمز الخطأ: {error.digest}</p>
        ) : null}
      </div>
      <Button onClick={reset} className="gap-2">
        <RefreshCw className="size-4" />
        إعادة المحاولة
      </Button>
    </div>
  )
}

