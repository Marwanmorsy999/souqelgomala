'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'
import { SiteSettingsProvider } from '@/components/shared/site-settings'

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <SiteSettingsProvider>{children}</SiteSettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
