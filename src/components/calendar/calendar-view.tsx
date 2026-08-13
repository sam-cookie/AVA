'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPHP } from '@/lib/utils/currency'
import { DayDetailSheet } from './day-detail-sheet'
import type { UtangType } from '@/types'

type DayExpense = { date: string; total: number; count: number }
type UtangDue = { id: number; person: string; type: UtangType; amount: number; remaining: number; deadline: string }

type Props = {
  year: number
  month: number
  dailyExpenses: DayExpense[]
  utangDues: UtangDue[]
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function buildDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month - 1, 1)
  const totalDays = new Date(year, month, 0).getDate()
  const offset = (firstDay.getDay() + 6) % 7 // Monday-first
  const days: (number | null)[] = Array(offset).fill(null)
  for (let d = 1; d <= totalDays; d++) days.push(d)
  return days
}

function compactAmount(centavos: number): string {
  const p = centavos / 100
  if (p >= 1000) return `₱${(p / 1000).toFixed(1)}k`
  return `₱${Math.round(p)}`
}

export function CalendarView({ year, month, dailyExpenses, utangDues }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const pendingNav = useRef<{ year: number; month: number } | null>(null)

  const expenseMap = new Map(dailyExpenses.map((d) => [d.date, d]))
  const utangByDate = new Map<string, UtangDue[]>()
  for (const u of utangDues) {
    const list = utangByDate.get(u.deadline) ?? []
    list.push(u)
    utangByDate.set(u.deadline, list)
  }

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month
  const days = buildDays(year, month)
  const monthTotal = dailyExpenses.reduce((s, d) => s + d.total, 0)

  // Show the target month in the header while loading, not the stale one
  const displayYear = isPending && pendingNav.current ? pendingNav.current.year : year
  const displayMonth = isPending && pendingNav.current ? pendingNav.current.month : month

  function navigate(delta: number) {
    let m = month + delta
    let y = year
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    pendingNav.current = { year: y, month: m }
    startTransition(() => router.push(`/calendar?year=${y}&month=${m}`))
  }

  function dateStr(day: number) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const selected = selectedDate
    ? { date: selectedDate, expense: expenseMap.get(selectedDate), dues: utangByDate.get(selectedDate) ?? [] }
    : null

  return (
    <>
      <div className="space-y-5">
        {/* Month header — always live so you see the target month while loading */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            disabled={isPending}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="text-center">
            <p className="text-[15px] font-semibold">{MONTH_NAMES[displayMonth - 1]} {displayYear}</p>
            {!isPending && monthTotal > 0 && (
              <p className="text-[11.5px] text-muted-foreground/60 mt-0.5">
                {formatPHP(monthTotal)} spent this month
              </p>
            )}
            {isPending && <p className="text-[11.5px] text-muted-foreground/40 mt-0.5">Loading…</p>}
          </div>
          <button
            onClick={() => navigate(1)}
            disabled={isPending}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Weekday row */}
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-muted-foreground/45 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Skeleton grid while loading */}
        {isPending ? (
          <div className="grid grid-cols-7 gap-y-1 animate-pulse">
            {Array.from({ length: 35 }, (_, i) => (
              <div key={i} className="flex flex-col items-center py-1.5 min-h-[52px] gap-2">
                <div className="h-3 w-5 rounded bg-muted" />
                {i % 4 === 1 && <div className="h-2 w-7 rounded bg-muted/60" />}
                {i % 7 === 3 && <div className="h-1.5 w-1.5 rounded-full bg-muted/60" />}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-y-1">
            {days.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />

              const ds = dateStr(day)
              const expense = expenseMap.get(ds)
              const dues = utangByDate.get(ds) ?? []
              const isToday = isCurrentMonth && today.getDate() === day
              const isPast = new Date(year, month - 1, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())
              const hasDues = dues.length > 0

              return (
                <button
                  key={ds}
                  onClick={() => setSelectedDate(ds)}
                  className={cn(
                    'flex flex-col items-center py-1.5 rounded-lg min-h-[52px] transition-colors relative',
                    isToday
                      ? 'bg-primary/8 ring-1 ring-inset ring-primary/20'
                      : 'hover:bg-muted/60',
                    !isPast && !isToday && !hasDues && 'opacity-35'
                  )}
                >
                  <span className={cn(
                    'text-[12.5px] font-medium leading-none',
                    isToday ? 'text-primary font-bold' : 'text-foreground'
                  )}>
                    {day}
                  </span>
                  {expense && (
                    <span className="text-[9px] text-muted-foreground/65 mt-1.5 leading-none tabular-nums">
                      {compactAmount(expense.total)}
                    </span>
                  )}
                  {hasDues && (
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 pt-1 border-t border-border/40">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
            <span className="text-[11px] text-muted-foreground/55">Utang due</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-muted-foreground/65">₱—</span>
            <span className="text-[11px] text-muted-foreground/55">Daily spend</span>
          </div>
        </div>
      </div>

      {selected && (
        <DayDetailSheet
          date={selected.date}
          expenseTotal={selected.expense?.total}
          expenseCount={selected.expense?.count}
          utangDues={selected.dues}
          open={!!selectedDate}
          onOpenChange={(o) => { if (!o) setSelectedDate(null) }}
        />
      )}
    </>
  )
}
