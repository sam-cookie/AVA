
import { getAllGoals } from '@/services/savings-goals'
import { getFundsWithBalances } from '@/services/funds'
import { formatPHP } from '@/lib/utils/currency'
import { GoalCard } from '@/components/savings/goal-card'
import { GoalFormSheet } from '@/components/savings/goal-form-sheet'
import { Plus } from 'lucide-react'

export default async function SavingsPage() {
  const [goals, funds] = await Promise.all([getAllGoals(), getFundsWithBalances()])

  const active = goals.filter((g) => g.percentComplete < 100)
  const completed = goals.filter((g) => g.percentComplete >= 100)

  const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0)
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)

  return (
    <div className="space-y-8 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Savings Goals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Build toward the things that matter.
          </p>
        </div>
        <GoalFormSheet
          trigger={
            <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors shrink-0">
              <Plus className="h-3.5 w-3.5" />
              New goal
            </button>
          }
        />
      </div>

      {/* Overview stats */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card px-4 py-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1.5">
              Total saved
            </p>
            <p className="text-lg font-bold text-foreground balance-number">{formatPHP(totalSaved)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1.5">
              Total target
            </p>
            <p className="text-lg font-bold text-foreground balance-number">{formatPHP(totalTarget)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1.5">
              Active goals
            </p>
            <p className="text-lg font-bold text-foreground">{active.length}</p>
          </div>
        </div>
      )}

      {/* Active goals */}
      {active.length > 0 && (
        <section className="space-y-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">
            Active
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((goal) => (
              <GoalCard key={goal.id} goal={goal} funds={funds} />
            ))}
          </div>
        </section>
      )}

      {/* Completed goals */}
      {completed.length > 0 && (
        <section className="space-y-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">
            Completed
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {completed.map((goal) => (
              <GoalCard key={goal.id} goal={goal} funds={funds} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {goals.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/80 px-6 py-16 text-center">
          <p className="text-base font-semibold text-foreground">No savings goals yet</p>
          <p className="text-sm text-muted-foreground mt-1.5 mb-6">
            Set a target and track your progress toward it.
          </p>
          <GoalFormSheet
            trigger={
              <button className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" />
                Create your first goal
              </button>
            }
          />
        </div>
      )}
    </div>
  )
}
