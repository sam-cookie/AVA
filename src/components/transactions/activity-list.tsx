import type { Category, FundWithBalance, IncomeSource, TransactionWithFund } from '@/types'
import { ActivityRow } from './activity-row'
import { EmptyState } from '@/components/shared/empty-state'

type Props = {
  transactions: TransactionWithFund[]
  categories?: Category[]
  funds?: FundWithBalance[]
  sources?: IncomeSource[]
  emptyMessage?: string
}

function formatGroupDate(dateStr: string): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayStr = today.toLocaleDateString('en-CA')
  const yesterdayStr = yesterday.toLocaleDateString('en-CA')

  if (dateStr === todayStr) return 'Today'
  if (dateStr === yesterdayStr) return 'Yesterday'

  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-PH', { weekday: 'long', month: 'short', day: 'numeric' })
}

export function ActivityList({ transactions, categories = [], funds = [], sources = [], emptyMessage }: Props) {
  const rows = transactions.filter((tx) => tx.type !== 'transfer_in')

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No transactions yet"
        description={emptyMessage ?? 'Transactions will appear here.'}
      />
    )
  }

  const groups = new Map<string, typeof rows>()
  for (const tx of rows) {
    const existing = groups.get(tx.date) ?? []
    existing.push(tx)
    groups.set(tx.date, existing)
  }
  const sortedDates = [...groups.keys()].sort((a, b) => b.localeCompare(a))

  return (
    <div>
      {sortedDates.map((date) => (
        <div key={date}>
          <div className="px-4 pt-5 pb-2">
            <p className="text-[10px] font-medium text-muted-foreground/55 uppercase tracking-[0.12em]">
              {formatGroupDate(date)}
            </p>
          </div>
          <div className="divide-y divide-border/25 px-4">
            {groups.get(date)!.map((tx) => (
              <ActivityRow key={tx.id} tx={tx} categories={categories} funds={funds} sources={sources} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
