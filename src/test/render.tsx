import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { ReactNode } from 'react'

/**
 * Test wrapper with all required providers (QueryClient + Theme).
 * Use this for component tests that depend on app providers.
 */

interface TestWrapperOptions {
  queryClient?: QueryClient
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  })
}

export function renderWithProviders(
  ui: ReactNode,
  options: TestWrapperOptions & RenderOptions = {}
) {
  const queryClient = options.queryClient ?? createTestQueryClient()

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
                <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

/** Utility to create a fresh QueryClient per test */
export { createTestQueryClient }
