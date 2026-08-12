'use client'

import { useState, useMemo } from 'react'
import {
  getDayPills,
  getWeekPills,
  getMonthPills,
  getPills,
  getDefaultIndex,
  getMonday,
  shiftDays,
  type Granularity,
} from '@/lib/utils/period'
import { PeriodToggle } from '@/components/dashboard/period-toggle'
import { PillScroller } from '@/components/dashboard/pill-scroller'
import { ActivityList } from '@/components/transactions/activity-list'
import { formatPHP } from '@/lib/utils/currency'
import type { TransactionWithFund, FundWithBalance, Category, IncomeSource } from '@/types'
import { MONTH_NAMES } from '@/lib/utils/date'

type Props = {
  transactions: TransactionWithFund[]
  funds: FundWithBalance[]
  categories: Category[]
  sources: IncomeSource[]
}

export function ExpenseBrowser({ transactions, funds, categories, sources }: Props) {
  const today = useMemo(() => new Date(), [])

  const [granularity, setGranularity] = useState<Granularity>('month')
  const [dayWeekStart, setDayWeekStart] = useState(() => getMonday(today))
  const [weekMonth, setWeekMonth] = useState(today.getMonth())
  const [monthYear, setMonthYear] = useState(today.getFullYear())

  const pills = useMemo(() => {
    if (granularity === 'day') return getDayPills(dayWeekStart)
    if (granularity === 'week') return getWeekPills(new Date(today.getFullYear(), weekMonth, 1))
    return getMonthPills(new Date(monthYear, 0, 1))
  }, [granularity, dayWeekStart, weekMonth, monthYear, today])

  const [selectedIndex, setSelectedIndex] = useState(() =>
    getDefaultIndex(getPills('month', today), today)
  )

  const contextLabel = useMemo(() => {
    if (granularity === 'day') return `${MONTH_NAMES[dayWeekStart.getMonth()]} ${dayWeekStart.getFullYear()}`
    if (granularity === 'week') return `${MONTH_NAMES[weekMonth]} ${today.getFullYear()}`
    return MONTH_NAMES[selectedIndex]
  }, [granularity, dayWeekStart, weekMonth, selectedIndex, today])

  function handleGranularityChange(g: Granularity) {
    setGranularity(g)
    if (g === 'day') {
      const monday = getMonday(today)
      setDayWeekStart(monday)
      setSelectedIndex(getDefaultIndex(getDayPills(monday), today))
    } else if (g === 'week') {
      setWeekMonth(today.getMonth())
      const newPills = getWeekPills(new Date(today.getFullYear(), today.getMonth(), 1))
      setSelectedIndex(getDefaultIndex(newPills, today))
    } else {
      setMonthYear(today.getFullYear())
      setSelectedIndex(getDefaultIndex(getMonthPills(new Date(today.getFullYear(), 0, 1)), today))
    }
  }

  function handlePrev() {
    if (granularity === 'day') {
      const newStart = shiftDays(dayWeekStart, -7)
      setDayWeekStart(newStart)
      setSelectedIndex(getDefaultIndex(getDayPills(newStart), today))
    } else if (granularity === 'week') {
      const newMonth = weekMonth - 1
      if (newMonth < 0) return
      setWeekMonth(newMonth)
      const newPills = getWeekPills(new Date(today.getFullYear(), newMonth, 1))
      setSelectedIndex(newPills.length - 1)
    } else {
      const newYear = monthYear - 1
      setMonthYear(newYear)
      setSelectedIndex(11)
    }
  }

  function handleNext() {
    if (granularity === 'day') {
      const newStart = shiftDays(dayWeekStart, 7)
      setDayWeekStart(newStart)
      setSelectedIndex(0)
    } else if (granularity === 'week') {
      const newMonth = weekMonth + 1
      if (newMonth > 11) return
      setWeekMonth(newMonth)
      setSelectedIndex(0)
    } else {
      const newYear = monthYear + 1
      setMonthYear(newYear)
      setSelectedIndex(0)
    }
  }

  const todayMonday = useMemo(() => getMonday(today), [today])
  const disableNext =
    granularity === 'day'
      ? dayWeekStart >= todayMonday
      : granularity === 'week'
      ? weekMonth >= 11
      : monthYear >= today.getFullYear()

  const pill = pills[selectedIndex] ?? pills[0]
  const [from, to] = pill.dateRange

  const filtered = useMemo(
    () => transactions.filter((tx) => tx.date >= from && tx.date <= to),
    [transactions, from, to]
  )

  const totalSpent = useMemo(
    () => filtered.reduce((s, tx) => s + tx.amount, 0),
    [filtered]
  )

  return (
    <div className="space-y-5">
      {/* Period summary */}
      <div className="min-h-[52px]">
        {totalSpent > 0 ? (
          <>
            <p className="balance-number text-[38px] md:text-[44px] font-semibold leading-none text-foreground">
              {formatPHP(totalSpent)}
            </p>
            <p className="text-[12px] text-muted-foreground mt-2">
              {filtered.length} expense{filtered.length !== 1 ? 's' : ''}
            </p>
          </>
        ) : (
          <p className="text-[13px] text-muted-foreground mt-2">No expenses in this period.</p>
        )}
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="shrink-0 text-[10px] font-medium text-muted-foreground/65 uppercase tracking-[0.14em]">
            Expenses
          </p>
          <span className="shrink-0 text-muted-foreground/30 text-[10px]">·</span>
          <p className="text-[12px] font-medium text-foreground/65 truncate">{contextLabel}</p>
        </div>
        <PeriodToggle value={granularity} onChange={handleGranularityChange} />
      </div>

      <PillScroller
        pills={pills}
        selectedIndex={selectedIndex}
        onChange={setSelectedIndex}
        onPrev={handlePrev}
        onNext={handleNext}
        disablePrev={false}
        disableNext={disableNext}
      />

      <div className="border-t border-border/40 -mx-4 px-0 md:-mx-0">
        <ActivityList
          transactions={filtered}
          categories={categories}
          funds={funds}
          sources={sources}
          emptyMessage="No expenses in this period."
        />
      </div>
    </div>
  )
}
