'use client'

import { useState } from 'react'
import { formatPHP } from '@/lib/utils/currency'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type Period = 'today' | 'week' | 'month'
type DayRaw = { date: string; total: number }
type MonthRaw = { month: string; total: number }

type Props = {
  daily: DayRaw[]
  monthly: MonthRaw[]
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function computeToday(raw: DayRaw[]): { total: number; sub: string } {
  const key = iso(new Date())
  const total = raw.find((r) => r.date === key)?.total ?? 0
  return { total, sub: total === 0 ? 'No spending today' : '' }
}

function computeWeek(raw: DayRaw[]): { total: number; sub: string } {
  const map = new Map(raw.map((r) => [r.date, r.total]))
  const now = new Date()
  const dow = now.getDay()
  const daysFromMon = dow === 0 ? 6 : dow - 1
  const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMon)
  const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6)

  let total = 0
  for (let d = 0; d < 7; d++) {
    const day = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + d)
    total += map.get(iso(day)) ?? 0
  }

  const fmt = (d: Date) => d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
  return { total, sub: `${fmt(mon)} – ${fmt(sun)}` }
}

function computeMonth(raw: MonthRaw[]): { total: number; sub: string } {
  const now = new Date()
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const total = raw.find((r) => r.month === key)?.total ?? 0
  const sub = now.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
  return { total, sub }
}

const TABS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
]

const PERIOD_LABEL: Record<Period, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
}

export function SpendingTracker({ daily, monthly }: Props) {
  const [period, setPeriod] = useState<Period>('today')

  const { total, sub } =
    period === 'today' ? computeToday(daily) :
    period === 'week'  ? computeWeek(daily) :
                         computeMonth(monthly)

  return (
    <div className="bg-card border border-border rounded-[14px] px-4 py-3.5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-semibold text-foreground tracking-tight">Spending</span>
        <Link
          href="/reports"
          className="text-[12px] font-medium text-primary hover:opacity-75 transition-opacity"
        >
          View reports →
        </Link>
      </div>

      {/* Period pills */}
      <div className="flex items-center gap-1.5 mb-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPeriod(tab.id)}
            className={cn(
              'px-3 py-1 rounded-full text-[12px] font-medium transition-all border leading-none whitespace-nowrap',
              period === tab.id
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-transparent text-muted-foreground border-border hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wide leading-none">
          {PERIOD_LABEL[period]}
        </p>
        <p className="text-[26px] font-bold tabular-nums tracking-tight text-foreground leading-tight mt-1">
          {formatPHP(total)}
        </p>
        {sub && (
          <p className="text-[12px] text-muted-foreground mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  )
}
