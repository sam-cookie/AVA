import { formatPHP } from '@/lib/utils/currency'

type Props = {
  totalSpent: number
  dailyAverage: number
  transactionCount: number
  topCategory: { name: string; total: number } | null
}

export function SummaryCards({ totalSpent, dailyAverage, transactionCount, topCategory }: Props) {
  return (
    <div className="flex flex-wrap items-start gap-x-8 gap-y-4 border-t border-b border-border/40 py-5">
      <div>
        <p className="text-[10px] font-medium text-muted-foreground/65 uppercase tracking-[0.14em]">Total spent</p>
        <p className="balance-number text-[20px] font-semibold tabular-nums mt-1.5 leading-none">{formatPHP(totalSpent)}</p>
      </div>

      <div className="w-px self-stretch bg-border/40" />

      <div>
        <p className="text-[10px] font-medium text-muted-foreground/65 uppercase tracking-[0.14em]">Daily average</p>
        <p className="balance-number text-[20px] font-semibold tabular-nums mt-1.5 leading-none">{formatPHP(dailyAverage)}</p>
      </div>

      <div className="w-px self-stretch bg-border/40" />

      <div>
        <p className="text-[10px] font-medium text-muted-foreground/65 uppercase tracking-[0.14em]">Transactions</p>
        <p className="balance-number text-[20px] font-semibold tabular-nums mt-1.5 leading-none">{transactionCount}</p>
      </div>

      {topCategory && (
        <>
          <div className="w-px self-stretch bg-border/40" />
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/65 uppercase tracking-[0.14em]">Top category</p>
            <p className="balance-number text-[20px] font-semibold tabular-nums mt-1.5 leading-none">{formatPHP(topCategory.total)}</p>
            <p className="text-[11px] text-muted-foreground/55 mt-0.5">{topCategory.name}</p>
          </div>
        </>
      )}
    </div>
  )
}
