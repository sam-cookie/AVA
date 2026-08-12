import {
  getMonthlyExpenseTotals,
  getExpenseTotalForRange,
  getExpenseCountForRange,
  getExpensesByCategoryWithIcon,
  getExpensesByFund,
} from '@/services/transactions'
import { toISO } from '@/lib/utils/date'
import { PeriodSelector } from '@/components/reports/period-selector'
import { SummaryCards } from '@/components/reports/summary-cards'
import { SpendingChart } from '@/components/reports/spending-chart'
import { CategoryBreakdown } from '@/components/reports/category-breakdown'
import { FundBreakdown } from '@/components/reports/fund-breakdown'
import { InsightCard } from '@/components/reports/insight-card'
import type { ChartBar } from '@/components/reports/spending-chart'

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function parseMonth(raw: string | undefined): string {
  if (typeof raw !== 'string') return ''
  if (/^\d{4}-\d{2}$/.test(raw)) return raw
  return ''
}

function monthRange(yearMonth: string): { from: string; to: string } {
  const [y, m] = yearMonth.split('-').map(Number)
  const from = toISO(new Date(y, m - 1, 1))
  const to = toISO(new Date(y, m, 0))
  return { from, to }
}

export default async function ReportsPage({ searchParams }: Props) {
  const sp = await searchParams

  const now = new Date()
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const selectedMonth = parseMonth(sp.month as string) || currentYearMonth

  const { from, to } = monthRange(selectedMonth)
  const [selYear, selMonthNum] = selectedMonth.split('-').map(Number)

  const prevDate = new Date(selYear, selMonthNum - 2, 1)
  const prevFrom = toISO(new Date(prevDate.getFullYear(), prevDate.getMonth(), 1))
  const prevTo = toISO(new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 0))

  const [monthly, categoriesData, fundsData, txCount, prevTotal] = await Promise.all([
    getMonthlyExpenseTotals(12),
    getExpensesByCategoryWithIcon(from, to),
    getExpensesByFund(from, to),
    getExpenseCountForRange(from, to),
    getExpenseTotalForRange(prevFrom, prevTo),
  ])

  const totalSpent = categoriesData.reduce((sum, r) => sum + r.total, 0)
  const isCurrentMonth = selectedMonth === currentYearMonth
  const daysElapsed = isCurrentMonth ? now.getDate() : new Date(selYear, selMonthNum, 0).getDate()
  const dailyAverage = daysElapsed > 0 ? Math.round(totalSpent / daysElapsed) : 0

  const categoriesWithPct = categoriesData.map((r) => ({
    ...r,
    percentage: totalSpent > 0 ? Math.round((r.total / totalSpent) * 100) : 0,
  }))

  const fundTotal = fundsData.reduce((sum, r) => sum + r.total, 0)
  const fundsWithPct = fundsData.map((r) => ({
    ...r,
    percentage: fundTotal > 0 ? Math.round((r.total / fundTotal) * 100) : 0,
  }))

  const comparison =
    prevTotal > 0
      ? {
          delta: totalSpent - prevTotal,
          deltaPercent:
            Math.round(Math.abs((totalSpent - prevTotal) / prevTotal) * 100) *
            (totalSpent >= prevTotal ? 1 : -1),
        }
      : null

  const chartBars: ChartBar[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-PH', { month: 'short' })
    const found = monthly.find((m) => m.month === key)
    chartBars.push({ label, value: found?.total ?? 0, isCurrent: key === selectedMonth })
  }

  const periodLabel = new Date(selYear, selMonthNum - 1, 1).toLocaleDateString('en-PH', {
    month: 'long',
    year: 'numeric',
  })

  const topCategory = categoriesWithPct[0] ?? null
  const topFund = fundsWithPct[0] ?? null

  return (
    <div className="space-y-8 pb-24 md:pb-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium text-muted-foreground/65 uppercase tracking-[0.14em] mb-2.5">
            Reports
          </p>
          <p className="balance-number text-[40px] md:text-[48px] font-semibold tabular-nums leading-none text-foreground">
            {new Date(selYear, selMonthNum - 1, 1).toLocaleDateString('en-PH', { month: 'long' })}
          </p>
          <p className="text-[13px] text-muted-foreground mt-2">{selYear}</p>
        </div>
        <PeriodSelector value={selectedMonth} />
      </div>

      {/* Flat summary stats */}
      <SummaryCards
        totalSpent={totalSpent}
        dailyAverage={dailyAverage}
        transactionCount={txCount}
        topCategory={topCategory ? { name: topCategory.category, total: topCategory.total } : null}
      />

      {/* Spending trend chart — no card wrapper */}
      <div>
        <div className="mb-4">
          <p className="text-[10px] font-medium text-muted-foreground/65 uppercase tracking-[0.14em]">Spending trend</p>
          <p className="text-[12px] text-muted-foreground/50 mt-0.5">Last 6 months</p>
        </div>
        <SpendingChart data={chartBars} comparison={comparison} />
      </div>

      {/* Category + Fund breakdown — flat grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border/40">
        <div>
          <p className="text-[10px] font-medium text-muted-foreground/65 uppercase tracking-[0.14em] mb-4">Where money goes</p>
          <CategoryBreakdown data={categoriesWithPct} />
        </div>
        <div>
          <p className="text-[10px] font-medium text-muted-foreground/65 uppercase tracking-[0.14em] mb-4">Spent from</p>
          <FundBreakdown data={fundsWithPct} />
        </div>
      </div>

      {/* Insight */}
      <InsightCard
        totalSpent={totalSpent}
        topCategory={
          topCategory
            ? { name: topCategory.category, total: topCategory.total, percentage: topCategory.percentage }
            : null
        }
        topFund={topFund ?? null}
        transactionCount={txCount}
      />

    </div>
  )
}
