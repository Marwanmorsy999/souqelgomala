/**
 * Formatting utilities for Arabic (RTL) display
 */

import { APP_CURRENCY, APP_LOCALE } from './constants'

// ============================================
// NUMBERS & CURRENCY
// ============================================

const numberFormatter = new Intl.NumberFormat(APP_LOCALE)

const currencyFormatter = new Intl.NumberFormat(APP_LOCALE, {
  style: 'currency',
  currency: 'EGP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

export function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000) return `${formatNumber(value / 1_000_000)}M`
  if (value >= 1_000) return `${formatNumber(value / 1_000)}K`
  return formatNumber(value)
}

export function formatPercent(value: number): string {
  return `${formatNumber(value)}%`
}

// ============================================
// DATES & TIMES
// ============================================

const dateFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

const timeFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  hour: 'numeric',
  minute: '2-digit',
})

export function formatDate(value: string | Date): string {
  return dateFormatter.format(new Date(value))
}

export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(new Date(value))
}

export function formatTime(value: string | Date): string {
  return timeFormatter.format(new Date(value))
}

/** Relative time in Arabic (e.g., "قبل 5 دقائق") */
export function formatRelativeTime(value: string | Date): string {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.round(diffMs / 60_000)
  const diffHour = Math.round(diffMs / 3_600_000)
  const diffDay = Math.round(diffMs / 86_400_000)

  if (diffMin < 1) return 'الآن'
  if (diffMin < 60) return `قبل ${formatNumber(diffMin)} دقيقة`
  if (diffHour < 24) return `قبل ${formatNumber(diffHour)} ساعة`
  if (diffDay < 7) return `قبل ${formatNumber(diffDay)} يوم`
  return formatDate(date)
}

// ============================================
// PHONE
// ============================================

/** Normalize an Egyptian phone number */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+2')) return cleaned.slice(2)
  if (cleaned.startsWith('002')) return cleaned.slice(3)
  return cleaned
}

// ============================================
// ORDER NUMBER
// ============================================

export function formatOrderNumber(orderNumber: string): string {
  return orderNumber.toUpperCase()
}

