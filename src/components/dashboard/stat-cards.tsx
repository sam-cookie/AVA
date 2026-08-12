import { formatPHP } from '@/lib/utils/currency'

type Props = {
  spent: number
  received: number
  periodLabel: string
}

export function StatCards({ spent, received, periodLabel }: Props) {
  return (
    <div className="flex items-start gap-8">
      <div>
        <p className="text-[10px] font-medium text-muted-foreground/65 uppercase tracking-[0.14em]">Spent</p>
        <p className="balance-number text-[20px] font-semibold tabular-nums text-foreground mt-1.5 leading-none">
          {formatPHP(spent)}
        </p>
      </div>

      <div className="w-px self-stretch bg-border/50 my-0.5" />

      <div>
        <p className="text-[10px] font-medium text-muted-foreground/65 uppercase tracking-[0.14em]">Received</p>
        <p className="balance-number text-[20px] font-semibold tabular-nums text-emerald-600 mt-1.5 leading-none">
          +{formatPHP(received)}
        </p>
      </div>
    </div>
  )
}
