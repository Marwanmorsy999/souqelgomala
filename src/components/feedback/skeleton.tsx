import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export type SkeletonProps = ComponentProps<'div'>

/**
 * Loading placeholder. Base building block for skeleton screens
 * (see app/admin/loading.tsx).
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />
}

