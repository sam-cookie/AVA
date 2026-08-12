import { formatPHP } from '@/lib/utils/currency'

type Row = {
  label: string
  value: number
}

type Props = {
  data: Row[]
}

export function HorizontalBars({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No data for this period.</p>
  }

  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="space-y-3">
      {data.map((row) => {
        const pct = Math.round((row.value / max) * 100)
        return (
          <div key={row.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium truncate">{row.label}</span>
              <span className="tabular-nums text-muted-foreground ml-2 shrink-0">{formatPHP(row.value)}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary/60 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
