'use client'

import { useEffect, useState } from 'react'
import { Clock3, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { products, bestSellingIds } from '@/lib/data'

function getRemainingSeconds() {
  const now = new Date()
  const nextMidnight = new Date(now)
  nextMidnight.setHours(24, 0, 0, 0)
  return Math.max(0, Math.floor((nextMidnight.getTime() - now.getTime()) / 1000))
}

function Countdown({ onUrgentChange }: { onUrgentChange: (urgent: boolean) => void }) {
  const [remaining, setRemaining] = useState(getRemainingSeconds)

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(getRemainingSeconds()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const hours = String(Math.floor(remaining / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0')
  const seconds = String(remaining % 60).padStart(2, '0')
  const urgent = remaining < 3600

  useEffect(() => { onUrgentChange(urgent) }, [onUrgentChange, urgent])

  return (
    <div className={`flex items-center gap-2 text-sm font-bold ${urgent ? 'animate-pulse' : ''}`}>
      <Clock3 className="size-4" />
      <span dir="ltr">{hours}:{minutes}:{seconds}</span>
    </div>
  )
}

type Props = { onUrgentChange: (urgent: boolean) => void }

export function FlashSaleBanner({ onUrgentChange }: Props) {
  const flashProducts = bestSellingIds.map((id) => products.find((p) => p.id === id)).filter(Boolean)

  return (
    <section className="relative overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/10">
      <Badge className="absolute right-4 top-4 border-0 bg-accent text-accent-foreground">
        الأكثر طلباً اليوم 🔥
      </Badge>

      <div className="flex items-start justify-between gap-4 pt-8">
        <div>
          <h1 className="text-2xl font-black leading-tight md:text-4xl">
            عرض الـ 100 جنيه
            <br />
            <span className="text-primary-foreground/80">اختار أكتر، وفّر أكتر</span>
          </h1>
          <p className="mt-2 text-sm text-primary-foreground/75">
            عروض الجملة والقطاعي لحد باب بيتك
          </p>
        </div>
        <Sparkles className="size-10 shrink-0 text-accent" />
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        {flashProducts.map((product) =>
          product ? (
            <div key={product.id} className="size-12 overflow-hidden rounded-full border-2 border-white/90 shadow-sm">
              <img src={product.image} alt={product.name} className="size-full object-cover" />
            </div>
          ) : null
        )}
      </div>
      <p className="mt-2 text-center text-sm font-bold text-primary-foreground/90">
        اختار أي منتج بـ 100 ج.م
      </p>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-background/10 px-4 py-3">
        <span className="text-sm font-semibold">ينتهي العرض خلال</span>
        <Countdown onUrgentChange={onUrgentChange} />
      </div>
    </section>
  )
}
