import { getAllUtang } from '@/services/utang'
import { getFundsWithBalances } from '@/services/funds'
import { formatPHP } from '@/lib/utils/currency'
import { UtangSection } from '@/components/utang/utang-section'
import { UtangFormModal } from '@/components/utang/utang-form-modal'
import { Plus } from 'lucide-react'

export default async function UtangPage() {
  const [allUtang, funds] = await Promise.all([getAllUtang(), getFundsWithBalances()])

  const active = allUtang.filter((u) => u.status !== 'paid')
  const settled = allUtang.filter((u) => u.status === 'paid')

  const iOwe = active.filter((u) => u.type === 'i_owe')
  const theyOwe = active.filter((u) => u.type === 'they_owe')

  const totalIOwe = allUtang
    .filter((u) => u.type === 'i_owe' && u.status !== 'paid')
    .reduce((sum, u) => sum + u.remaining, 0)

  const totalOwedToMe = allUtang
    .filter((u) => u.type === 'they_owe' && u.status !== 'paid')
    .reduce((sum, u) => sum + u.remaining, 0)

  const net = totalOwedToMe - totalIOwe

  return (
    <div className="space-y-8 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Utang</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track debts and collections.</p>
        </div>
        <UtangFormModal
          trigger={
            <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors shrink-0">
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          }
        />
      </div>

      {/* Summary cards */}
      {allUtang.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card px-4 py-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1.5">
              I Owe
            </p>
            <p className="text-lg font-bold text-foreground balance-number">{formatPHP(totalIOwe)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1.5">
              Owed to Me
            </p>
            <p className="text-lg font-bold text-foreground balance-number">{formatPHP(totalOwedToMe)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1.5">
              Net
            </p>
            <p className={`text-lg font-bold balance-number ${net >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {net >= 0 ? '' : '-'}{formatPHP(Math.abs(net))}
            </p>
          </div>
        </div>
      )}

      {iOwe.length > 0 && (
        <UtangSection title="I Owe" items={iOwe} funds={funds} />
      )}

      {theyOwe.length > 0 && (
        <UtangSection title="Owes Me" items={theyOwe} funds={funds} />
      )}

      {settled.length > 0 && (
        <UtangSection title="Settled" items={settled} funds={funds} />
      )}

      {/* Empty state */}
      {allUtang.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/80 px-6 py-16 text-center">
          <p className="text-base font-semibold text-foreground">No utang tracked yet</p>
          <p className="text-sm text-muted-foreground mt-1.5 mb-6">
            Record money you owe or money owed to you.
          </p>
          <UtangFormModal
            trigger={
              <button className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" />
                Add first utang
              </button>
            }
          />
        </div>
      )}
    </div>
  )
}
