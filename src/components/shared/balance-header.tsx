'use client'

import { useState, useEffect } from 'react'
import { formatPHP } from '@/lib/utils/currency'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export type StatPeriod = 'all' | 'month' | 'week' | 'today'

export type PeriodStats = {
  received: number
  spent: number
}

type Props = {
  label: string
  total: number
  received?: number
  spent?: number
  subtext?: string
  periodStats?: Record<StatPeriod, PeriodStats>
  initialPeriod?: StatPeriod
}

const STORAGE_KEY = 'ava-balance-header-period'

const PERIOD_CONFIG: { id: StatPeriod; label: string; shortLabel: string; descriptor: string }[] = [
  { id: 'all', label: 'All time', shortLabel: 'All', descriptor: 'all time' },
  { id: 'month', label: 'This month', shortLabel: 'Month', descriptor: 'this month' },
  { id: 'week', label: 'This week', shortLabel: 'Week', descriptor: 'this week' },
  { id: 'today', label: 'Just today', shortLabel: 'Today', descriptor: 'today' },
]

export function BalanceHeader({
  label,
  total,
  received = 0,
  spent = 0,
  subtext,
  periodStats,
  initialPeriod = 'all',
}: Props) {
  const [period, setPeriod] = useState<StatPeriod>(initialPeriod)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as StatPeriod | null
      if (saved && (saved === 'all' || saved === 'month' || saved === 'week' || saved === 'today')) {
        setPeriod(saved)
      }
    } catch { /* ignore */ }
  }, [])

  function handlePeriodChange(p: StatPeriod) {
    setPeriod(p)
    try {
      localStorage.setItem(STORAGE_KEY, p)
    } catch { /* ignore */ }
  }

  const currentReceived = periodStats ? periodStats[period].received : received
  const currentSpent = periodStats ? periodStats[period].spent : spent
  const hasPeriods = Boolean(periodStats)

  return (
    <div className="space-y-2.5">
      {/* Top row: Label/descriptor + period switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.14em]">
            {label}
          </p>
          {hasPeriods && (
            <span className="text-[10px] text-muted-foreground/45 hidden sm:inline">
              · {PERIOD_CONFIG.find((p) => p.id === period)?.label}
            </span>
          )}
        </div>

        {hasPeriods && (
          <div className="flex items-center gap-1 p-0.5 bg-muted/60 dark:bg-muted/40 rounded-lg w-fit">
            {PERIOD_CONFIG.map(({ id, label, shortLabel }) => (
              <button
                key={id}
                type="button"
                onClick={() => handlePeriodChange(id)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap',
                  period === id
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="sm:hidden">{shortLabel}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main stats row: Total Balance, Received, and Spent ALL BESIDE EACH OTHER */}
      <div className="flex flex-wrap sm:flex-nowrap items-baseline sm:items-end gap-x-6 sm:gap-x-8 gap-y-3">
        {/* Total Balance */}
        <div className="min-w-0">
          <p className="balance-number text-[38px] sm:text-[44px] lg:text-[48px] font-bold leading-none text-foreground tracking-tight">
            {formatPHP(total)}
          </p>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-9 bg-border/40 self-end mb-1 shrink-0" />

        {/* Received (beside total balance) */}
        <div className="min-w-0">
          <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-[0.14em] mb-1 sm:mb-2">
            Received
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={`rec-${period}-${currentReceived}`}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="balance-number text-[22px] sm:text-[28px] lg:text-[34px] font-bold leading-none text-emerald-600 tabular-nums whitespace-nowrap"
            >
              +{formatPHP(currentReceived)}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-9 bg-border/40 self-end mb-1 shrink-0" />

        {/* Spent (beside received and total balance) */}
        <div className="min-w-0">
          <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-[0.14em] mb-1 sm:mb-2">
            Spent
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={`sp-${period}-${currentSpent}`}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="balance-number text-[22px] sm:text-[28px] lg:text-[34px] font-bold leading-none text-foreground/75 tabular-nums whitespace-nowrap"
            >
              −{formatPHP(currentSpent)}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {subtext && (
        <p className="text-[11px] text-muted-foreground/60 mt-1">
          {subtext}
        </p>
      )}
    </div>
  )
}
