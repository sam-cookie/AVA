'use client'

import { formatPHP } from '@/lib/utils/currency'

type Bar = {
  label: string
  value: number
}

type Props = {
  data: Bar[]
  height?: number
}

export function BarChart({ data, height = 120 }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No data</p>
  }

  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((bar) => {
        const pct = bar.value / max
        const barHeight = Math.max(pct * (height - 32), 4)
        return (
          <div key={bar.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span className="text-[10px] text-muted-foreground tabular-nums text-center truncate w-full">
              {bar.value > 0 ? formatPHP(bar.value).replace('₱', '') : ''}
            </span>
            <div
              className="w-full rounded-t-md bg-primary/70 transition-all"
              style={{ height: barHeight }}
            />
            <span className="text-[10px] text-muted-foreground text-center truncate w-full">
              {bar.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
