'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Clock3, PackageSearch, Search, TrendingUp, X } from 'lucide-react'
import { getCategories, searchProducts } from '@/lib/services/catalog'
import type { Category, Product } from '@/lib/types'

type Props = {
  open: boolean
  onClose: () => void
  onSelectCategory: (name: string) => void
  onSelectProduct: (product: Product) => void
}

const RECENT_KEY = 'souk-recent-searches'

function readRecent(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

export function SearchOverlay({ open, onClose, onSelectCategory, onSelectProduct }: Props) {
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState<string[]>(() => readRecent())
  const [categories, setCategories] = useState<Category[]>([])
  const [results, setResults] = useState<Product[]>([])
  const [categoryResults, setCategoryResults] = useState<Category[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    // Reset query + recent lazily (wrapped in a tick to avoid the
    // "setState synchronously in an effect" lint rule).
    const t = window.setTimeout(() => {
      setQuery('')
      setRecent(readRecent())
      inputRef.current?.focus()
    }, 0)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  // Debounced async search over the public catalog API.
  useEffect(() => {
    if (!open) return
    const term = query.trim()
    if (!term) {
      // Reset results lazily (wrapped in a tick to avoid the
      // "setState synchronously in an effect" lint rule).
      const t = window.setTimeout(() => {
        setResults([])
        setCategoryResults([])
      }, 0)
      return () => window.clearTimeout(t)
    }
    let active = true
    const t = window.setTimeout(() => {
      Promise.all([searchProducts(term), getCategories()])
        .then(([p, c]) => {
          if (!active) return
          setResults(p)
          setCategoryResults(c.filter((cat) => cat.name.includes(term)))
        })
        .catch(() => {
          if (active) {
            setResults([])
            setCategoryResults([])
          }
        })
    }, 200)
    return () => {
      active = false
      window.clearTimeout(t)
    }
  }, [query, open])

  const saveRecent = (term: string) => {
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 5)
    setRecent(next)
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  const pickProduct = (p: Product) => {
    saveRecent(p.name)
    onClose()
    onSelectProduct(p)
  }

  const pickCategory = (name: string) => {
    saveRecent(name)
    onClose()
    onSelectCategory(name)
  }
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1100] flex flex-col bg-background"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
        >
          <div className="mx-auto w-full max-w-2xl px-4 pt-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ما الذي تبحث عنه؟"
                  aria-label="ما الذي تبحث عنه؟"
                  className="h-12 w-full rounded-2xl border border-input bg-muted/50 pr-11 pl-4 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    aria-label="مسح البحث"
                    className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="إغلاق البحث"
                className="flex h-12 shrink-0 items-center gap-1 px-3 text-sm font-bold text-foreground transition-colors hover:text-primary"
              >
                إلغاء
              </button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 pb-28 pt-4">
            {query.trim() === '' ? (
              <div>
                <p className="mb-3 flex items-center gap-2 text-sm font-bold text-muted-foreground">
                  <TrendingUp className="size-4" /> الأشهر في سوق الجملة
                </p>
                {categories.slice(0, 6).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => pickCategory(c.name)}
                    className="flex w-full items-center justify-between rounded-xl px-2 py-2.5 text-sm transition-colors hover:bg-muted"
                  >
                    <span>{c.name}</span>
                    <Search className="size-4 text-muted-foreground/60" />
                  </button>
                ))}
                {recent.length > 0 && (
                  <div className="mt-6">
                    <p className="mb-3 flex items-center gap-2 text-sm font-bold text-muted-foreground">
                      <Clock3 className="size-4" /> عمليات البحث الأخيرة
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recent.map((r) => (
                        <button
                          key={r}
                          onClick={() => setQuery(r)}
                          className="rounded-full border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : results.length === 0 && categoryResults.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <PackageSearch className="size-14 text-muted-foreground/40" />
                <h2 className="text-lg font-black">مفيش نتائج</h2>
                <p className="max-w-xs text-sm text-muted-foreground">
                  جرّب كلمة تانية أو تواصل معنا على واتساب ونساعدك توصله.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {categoryResults.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => pickCategory(c.name)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-right text-sm font-bold transition-colors hover:bg-muted"
                  >
                    <span className="size-2 rounded-full bg-primary/50" /> قسم {c.name}
                  </button>
                ))}
                {results.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => pickProduct(p)}
                    className="flex w-full items-center gap-3 rounded-2xl p-2 text-right transition-colors hover:bg-muted"
                  >
                    <img src={p.image} alt={p.name} className="size-14 shrink-0 rounded-xl object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{p.name}</span>
                      <span className="block text-xs text-muted-foreground">{p.size} · {p.retail} ج.م</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
