import Link from 'next/link'
import { FileQuestion, Home } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Admin 404 page — shown when a route under /admin doesn't exist.
 */
export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
        <FileQuestion className="size-7 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-black">الصفحة غير موجودة</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          عذراً، لا توجد صفحة بهذا العنوان في لوحة التحكم.
        </p>
      </div>
      <Link href="/admin" className={cn(buttonVariants(), 'gap-1.5')}>
        <Home className="size-4" />
        العودة للرئيسية
      </Link>
    </div>
  )
}

