'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { getBreadcrumbs } from '@/lib/breadcrumbs'
import { cn } from '@/lib/utils'

interface BreadcrumbsProps {
  className?: string
}

/**
 * Breadcrumb trail derived from the sidebar navigation config.
 * Renders "الرئيسية / {section} / {page}" for the current path.
 */
export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const pathname = usePathname()
  const items = getBreadcrumbs(pathname)

  return (
    <nav aria-label="مسار التنقل" className={cn('flex items-center gap-1 text-xs', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <div key={`${item.href}-${index}`} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronLeft className="size-3.5 text-muted-foreground/60" aria-hidden />
            )}
            {isLast || item.current ? (
              <span className="font-medium text-foreground" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

