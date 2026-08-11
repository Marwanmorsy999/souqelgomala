'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { getCategoryTree, searchProducts, flattenCategories } from '@/lib/services/catalog'
import { formatPrice } from '@/lib/utils'
import type { Category, Product } from '@/lib/types'

type Props = {
  open: boolean
  onClose: () => void
  onSelectCategory: (name: string) => void
  onSelectProduct: (product: Product) => void
}

export function SearchOverlay({ open, onClose, onSelectCategory, onSelectProduct }: Props) {
  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [results, setResults] = useState<Product[]>([])
  const [categoryResults, setCategoryResults] = useState<Category[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    let active = true
    const t = window.setTimeout(() => {
      setQuery('')
      setResults([])
      setCategoryResults([])
      inputRef.current?.focus()
    }, 0)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    getCategoryTree()
      .then((tree) => active && setCategories(flattenCategories(tree)))
      .catch(() => active && setCategories([]))
    return () => {
      active = false
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    let active = true
    const term = query.trim()
    if (!term) {
      return
    }
    const t = window.setTimeout(() => {
      Promise.all([searchProducts(term), getCategoryTree()])
        .then(([p, tree]) => {
          if (!active) return
          setResults(p)
          const flat = flattenCategories(tree)
          setCategoryResults(flat.filter((cat) => cat.name.includes(term)))
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

  const pickProduct = (p: Product) => {
    onClose()
    onSelectProduct(p)
  }

  const pickCategory = (name: string) => {
    onClose()
    onSelectCategory(name)
  }

  const popular = useMemo(() => categories.slice(0, 6), [categories])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
          <motion.div
            className="absolute inset-y-0 right-0 flex w-full flex-col bg-bg-surface shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.22 }}
          >
            <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث عن منتج..."
                  className="h-10 w-full rounded-lg border border-border-default bg-bg-input pr-10 pl-3 text-sm outline-none focus:border-brand-green"
                />
              </div>
              <button
                onClick={onClose}
                aria-label="إغلاق"
                className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-bg-nav-hover"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4">
              {query.trim() === '' ? (
                <div>
                  <p className="mb-3 text-sm font-bold text-text-secondary">الأقسام</p>
                  <div className="flex flex-col gap-1">
                    {popular.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => pickCategory(c.name)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-bg-nav-hover"
                      >
                        <span className="font-bold">{c.name}</span>
                        <Search className="size-4 text-text-muted" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : results.length === 0 && categoryResults.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <p className="text-lg font-black">مفيش نتائج</p>
                  <p className="text-sm text-text-secondary">
                    جرّب كلمة تانية أو تواصل معنا على واتساب.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {categoryResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => pickCategory(c.name)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-right text-sm font-bold transition-colors hover:bg-bg-nav-hover"
                    >
                      <span className="size-2 rounded-full bg-brand-green/50" />
                      قسم {c.name}
                    </button>
                  ))}
                  {results.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => pickProduct(p)}
                      className="flex w-full items-center gap-3 rounded-lg p-2 text-right transition-colors hover:bg-bg-nav-hover"
                    >
                      <img src={p.image} alt={p.name} className="size-12 shrink-0 rounded-md object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{p.name}</span>
                        <span className="block text-xs text-text-secondary">
                          {p.size && p.size.trim() ? p.size : 'حبة'} · {formatPrice(p.retail)} ج.م
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}