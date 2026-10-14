'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatPHP } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { GoalProgressBar } from './goal-progress-bar'
import { GoalFormSheet } from './goal-form-sheet'
import { AddContributionSheet } from './add-contribution-sheet'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { deleteGoalAction } from '@/actions/savings-goals'
import { useAppRefresh } from '@/lib/state/app-refresh'
import type { GoalWithProgress, FundWithBalance } from '@/types'

type Props = {
  goal: GoalWithProgress
  funds: FundWithBalance[]
}

export function GoalCard({ goal, funds }: Props) {
  const { refresh } = useAppRefresh()
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, startDelete] = useTransition()

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteGoalAction(goal.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Goal deleted')
      refresh({ type: 'savings-goal', id: goal.id })
      setDeleteOpen(false)
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <Link href={`/savings/${goal.id}`} className="flex-1 min-w-0 group">
          <h3 className="text-[15px] font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {goal.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatPHP(goal.savedAmount)} saved of {formatPHP(goal.targetAmount)}
          </p>
        </Link>

        {/* More menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-36 rounded-md border border-border bg-card shadow-md py-1">
                <GoalFormSheet
                  goal={goal}
                  trigger={
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  }
                />
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                  onClick={() => { setMenuOpen(false); setDeleteOpen(true) }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Progress */}
      <GoalProgressBar percent={goal.percentComplete} className="mb-3" />

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
        <span>{goal.percentComplete}% complete</span>
        <span>{formatPHP(goal.remaining)} remaining</span>
      </div>

      {goal.targetDate && (
        <p className="text-xs text-muted-foreground mb-4">
          Target: {formatDate(goal.targetDate)}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/60">
        <AddContributionSheet
          goal={goal}
          funds={funds}
          trigger={
            <button className="text-xs font-medium text-primary hover:underline underline-offset-2 transition-colors py-1.5">
              Add money
            </button>
          }
        />
        <span className="text-border/80">·</span>
        <GoalFormSheet
          goal={goal}
          trigger={
            <button className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1.5">
              Edit
            </button>
          }
        />
        <span className="text-border/80">·</span>
        <Link
          href={`/savings/${goal.id}`}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1.5 ml-auto"
        >
          View →
        </Link>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete "${goal.name}"?`}
        description="All contributions will be deleted and fund balances restored."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
