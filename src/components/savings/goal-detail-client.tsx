'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { GoalProgressRing } from './goal-progress-ring'
import { AddContributionSheet } from './add-contribution-sheet'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { deleteContributionAction } from '@/actions/savings-goals'
import { formatPHP } from '@/lib/utils/currency'
import { formatDate, formatShortDate } from '@/lib/utils/date'
import { useAppRefresh } from '@/lib/state/app-refresh'
import type { GoalWithContributions, FundWithBalance } from '@/types'

type Props = {
  goal: GoalWithContributions
  funds: FundWithBalance[]
}

type ContribRow = GoalWithContributions['contributions'][number]

function ContributionItem({ contrib, goalId }: { contrib: ContribRow; goalId: number }) {
  const { refresh } = useAppRefresh()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, startDelete] = useTransition()

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteContributionAction(contrib.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Contribution removed')
      refresh({ type: 'savings-contribution', id: contrib.id })
      setDeleteOpen(false)
    })
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0 group">
      {/* Timeline dot */}
      <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary/60 mt-0.5" />

      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-foreground font-medium">
          {formatPHP(contrib.amount)}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {formatShortDate(contrib.date)}
          {contrib.fundName && ` · from ${contrib.fundName}`}
          {contrib.note && ` · ${contrib.note}`}
        </p>
      </div>

      <button
        onClick={() => setDeleteOpen(true)}
        className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 shrink-0"
        aria-label="Remove contribution"
      >
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Remove contribution?"
        description="This will restore the amount to the original account."
        confirmLabel="Remove"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}

export function GoalDetailClient({ goal, funds }: Props) {
  return (
    <div className="space-y-8">
      {/* Progress hero */}
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="relative">
          <GoalProgressRing percent={goal.percentComplete} size={200} strokeWidth={12} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground balance-number">
              {goal.percentComplete}%
            </span>
            <span className="text-[11px] text-muted-foreground font-medium mt-0.5">complete</span>
          </div>
        </div>

        <div className="text-center space-y-1">
          <p className="text-2xl font-bold text-foreground balance-number">
            {formatPHP(goal.savedAmount)}
            <span className="text-base font-normal text-muted-foreground">
              {' '}/ {formatPHP(goal.targetAmount)}
            </span>
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 text-center">
          <div>
            <p className="text-[13px] font-semibold text-foreground">{formatPHP(goal.remaining)}</p>
            <p className="text-[11px] text-muted-foreground">remaining</p>
          </div>
          {goal.targetDate && (
            <>
              <div className="w-px h-8 bg-border" />
              <div>
                <p className="text-[13px] font-semibold text-foreground">{formatDate(goal.targetDate)}</p>
                <p className="text-[11px] text-muted-foreground">target date</p>
              </div>
            </>
          )}
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-[13px] font-semibold text-foreground">{goal.contributions.length}</p>
            <p className="text-[11px] text-muted-foreground">contributions</p>
          </div>
        </div>

        {/* Add money CTA */}
        <AddContributionSheet
          goal={goal}
          funds={funds}
          trigger={
            <button className="flex items-center gap-2 h-11 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              + Add money
            </button>
          }
        />
      </div>

      {/* Contribution history */}
      <div>
        <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-4">
          Contribution History
        </h2>
        {goal.contributions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No contributions yet. Add money to get started.
          </p>
        ) : (
          <div>
            {goal.contributions.map((c) => (
              <ContributionItem key={c.id} contrib={c} goalId={goal.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
