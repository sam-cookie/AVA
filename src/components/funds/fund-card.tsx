import Link from 'next/link'
import { formatPHP } from '@/lib/utils/currency'
import type { FundWithBalance, IncomeSource } from '@/types'
import { AddMoneySheet } from './add-money-sheet'
import { FundContextMenu } from './fund-context-menu'
import { Smartphone, Building2, Leaf, Banknote, CreditCard } from 'lucide-react'

function getBrand(name: string): { bg: string; Icon: React.ElementType } {
  const n = name.toLowerCase()
  if (n.includes('gcash')) return { bg: '#003699', Icon: Smartphone }
  if (n.includes('maya') || n.includes('paymaya')) return { bg: '#004030', Icon: Smartphone }
  if (n.includes('bpi')) return { bg: '#620000', Icon: Building2 }
  if (n.includes('bdo')) return { bg: '#00103a', Icon: Building2 }
  if (n.includes('maribank') || n.includes('mari bank')) return { bg: '#003028', Icon: Leaf }
  if (n.includes('cash') || n.includes('wallet')) return { bg: '#1a1a1a', Icon: Banknote }
  return { bg: '#2D3142', Icon: CreditCard }
}

type Props = {
  fund: FundWithBalance
  sources: IncomeSource[]
}

export function FundCard({ fund, sources }: Props) {
  const { bg, Icon } = getBrand(fund.name)

  return (
    <div className="flex items-center gap-3.5 py-4 group">
      <div
        className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: bg }}
      >
        <Icon className="h-[14px] w-[14px] text-white" strokeWidth={1.75} />
      </div>

      <Link href={`/funds/${fund.id}`} className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[14px] font-medium text-foreground truncate">{fund.name}</p>
          <p className="balance-number text-[16px] font-semibold tabular-nums text-foreground shrink-0">
            {formatPHP(fund.balance)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-[11px] text-muted-foreground/55 truncate">
            {fund.totalAdded > 0 || fund.totalSpent > 0
              ? `↑ ${formatPHP(fund.totalAdded)} · ↓ ${formatPHP(fund.totalSpent)}`
              : 'No activity yet'}
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <AddMoneySheet fund={fund} sources={sources} />
        <FundContextMenu fund={fund} />
      </div>
    </div>
  )
}
