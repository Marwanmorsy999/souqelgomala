import { Skeleton } from '@/components/feedback/skeleton'

/**
 * Admin loading UI — skeleton screen shown during page transitions.
 * Mirrors the PageHeader + content-card structure to avoid layout shift.
 */
export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="جاري التحميل">
      {/* Breadcrumb placeholder */}
      <div className="flex items-center gap-1">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-16" />
      </div>

      {/* PageHeader placeholder */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-3.5 w-64" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Content card placeholders */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  )
}

