import { formatPHP } from '@/lib/utils/currency'

export type FundRow = {
  fundName: string
  total: number
  percentage: number
}

type Props = {
  data: FundRow[]
}

function FundAvatar({ name }: { name: string }) {
  return (
    <div className="h-8 w-8 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0">
      <span className="text-xs font-bold text-foreground">{name[0]?.toUpperCase() ?? '?'}</span>
    </div>
  )
}

export function FundBreakdown({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No spending this period.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {data.map((row) => (
        <div key={row.fundName} className="flex items-center gap-3">
          <FundAvatar name={row.fundName} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-sm font-medium truncate">{row.fundName}</span>
              <span className="text-sm tabular-nums text-muted-foreground shrink-0">
                {formatPHP(row.total)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-foreground/25 rounded-full transition-all duration-500"
                  style={{ width: `${row.percentage}%` }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground w-7 text-right shrink-0">
                {row.percentage}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
