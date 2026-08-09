import type { ReactNode } from 'react'
import { Breadcrumbs } from './breadcrumbs'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  /** Optional actions rendered at the end (e.g., a primary button). */
  actions?: ReactNode
  /** Hide the breadcrumb trail (e.g., on the dashboard home). */
  hideBreadcrumbs?: boolean
  className?: string
}

/**
 * Standard page header: breadcrumbs + title + description + actions.
 * Server-component friendly — interactive actions are passed in as
 * already-hydrated children.
 */
export function PageHeader({
  title,
  description,
  actions,
  hideBreadcrumbs = false,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {!hideBreadcrumbs && <Breadcrumbs />}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight">{title}</h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}

