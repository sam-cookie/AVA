import Link from 'next/link'
import { Plus, ChevronRight } from 'lucide-react'
import type { GoalWithProgress } from '@/types'
import { GoalsCarousel } from './goals-carousel'
import { GoalFormSheet } from './goal-form-sheet'

type Props = { goals: GoalWithProgress[] }

export function SavingsPreview({ goals }: Props) {
  const active = goals.filter((g) => g.percentComplete < 100)

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">
            Savings Goals
          </p>
        </div>
        <div className="flex items-center gap-3">
          <GoalFormSheet
            trigger={
              <button className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors">
                <Plus className="h-3 w-3" />
                Add goal
              </button>
            }
          />
          {goals.length > 0 && (
            <Link
              href="/savings"
              className="flex items-center gap-0.5 text-[11px] font-medium text-primary hover:underline underline-offset-2"
            >
              View all
              <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>

      {active.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">No active goals yet.</p>
          <GoalFormSheet
            trigger={
              <button className="mt-2 text-sm font-medium text-primary hover:underline underline-offset-2">
                Create your first goal
              </button>
            }
          />
        </div>
      ) : (
        <GoalsCarousel goals={active} />
      )}
    </section>
  )
}
