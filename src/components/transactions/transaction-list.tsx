import type { Category, FundWithBalance, IncomeSource, TransactionWithFund } from '@/types'
import { TransactionRow } from './transaction-row'
import { EmptyState } from '@/components/shared/empty-state'

type Props = {
  transactions: TransactionWithFund[]
  showFund?: boolean
  groupByDate?: boolean
  categories?: Category[]
  funds?: FundWithBalance[]
  sources?: IncomeSource[]
  emptyMessage?: string
}

function todayISO(): string {
  return new Date().toLocaleDateString('en-CA')
}

function yesterdayISO(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toLocaleDateString('en-CA')
}

function dateGroupLabel(iso: string): string {
  if (iso === todayISO()) return 'Today'
  if (iso === yesterdayISO()) return 'Yesterday'
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-PH', { weekday: 'long', month: 'short', day: 'numeric' })
}

export function TransactionList({
  transactions,
  showFund,
  groupByDate = true,
  categories = [],
  funds = [],
  sources = [],
  emptyMessage,
}: Props) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions yet"
        description={emptyMessage ?? 'Transactions will appear here.'}
      />
    )
  }

  if (!groupByDate) {
    return (
      <div className="divide-y divide-border/25 px-4">
        {transactions.map((tx) => (
          <TransactionRow
            key={tx.id}
            tx={tx}
            showFund={showFund}
            categories={categories}
            funds={funds}
            sources={sources}
          />
        ))}
      </div>
    )
  }

  const groups: { date: string; txs: TransactionWithFund[] }[] = []
  for (const tx of transactions) {
    const last = groups[groups.length - 1]
    if (last && last.date === tx.date) {
      last.txs.push(tx)
    } else {
      groups.push({ date: tx.date, txs: [tx] })
    }
  }

  return (
    <div>
      {groups.map((group) => (
        <div key={group.date}>
          <div className="pt-5 pb-2 px-4">
            <p className="text-[10px] font-medium text-muted-foreground/55 uppercase tracking-[0.12em]">
              {dateGroupLabel(group.date)}
            </p>
          </div>
          <div className="divide-y divide-border/25 px-4">
            {group.txs.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                showFund={showFund}
                hideDate
                categories={categories}
                funds={funds}
                sources={sources}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
