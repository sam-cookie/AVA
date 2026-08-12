'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatPHP } from '@/lib/utils/currency'
import { cn } from '@/lib/utils'

export type ChartBar = {
  label: string
  value: number
  isCurrent: boolean
}

type Comparison = {
  delta: number
  deltaPercent: number
}

type Props = {
  data: ChartBar[]
  comparison: Comparison | null
}

function ComparisonBadge({ comparison }: { comparison: Comparison }) {
  const { delta, deltaPercent } = comparison
  if (delta > 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <TrendingUp className="h-3.5 w-3.5 text-rose-500" />
        <span className="text-rose-500 font-medium">+{deltaPercent}%</span>
        <span className="text-muted-foreground">vs last month</span>
      </div>
    )
  }
  if (delta < 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
        <span className="text-emerald-600 font-medium">{deltaPercent}%</span>
        <span className="text-muted-foreground">vs last month</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Minus className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">Same as last month</span>
    </div>
  )
}

const CHART_H = 148

export function SpendingChart({ data, comparison }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="space-y-3">
      {comparison && <ComparisonBadge comparison={comparison} />}

      <div className="flex items-end gap-1.5 sm:gap-2.5" style={{ height: CHART_H + 36 }}>
        {data.map((bar, i) => {
          const pct = bar.value / max
          const barH = bar.value > 0 ? Math.max(pct * CHART_H, 8) : 3

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <span
                className={cn(
                  'text-[10px] tabular-nums truncate w-full text-center leading-tight',
                  bar.isCurrent ? 'text-primary font-semibold' : 'invisible'
                )}
              >
                {bar.value > 0 ? formatPHP(bar.value) : ''}
              </span>

              <div className="w-full flex flex-col justify-end" style={{ height: CHART_H }}>
                <div
                  className={cn(
                    'w-full rounded-t-md transition-all duration-700',
                    bar.isCurrent
                      ? 'bg-primary'
                      : bar.value > 0
                        ? 'bg-primary/20'
                        : 'bg-border'
                  )}
                  style={{ height: barH }}
                />
              </div>

              <span
                className={cn(
                  'text-[11px] text-center truncate w-full leading-tight',
                  bar.isCurrent
                    ? 'font-semibold text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {bar.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
