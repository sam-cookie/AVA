import Link from 'next/link'
import { formatPHP } from '@/lib/utils/currency'
import { GoalProgressBar } from './goal-progress-bar'
import type { GoalWithProgress } from '@/types'

type Props = {
  goal: GoalWithProgress
}

export function GoalCardMini({ goal }: Props) {
  return (
    <Link
      href={`/savings/${goal.id}`}
      className="block rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:bg-accent/20 transition-all duration-150"
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[13px] font-semibold text-foreground truncate pr-2">{goal.name}</span>
        <span className="text-[11px] font-semibold text-primary shrink-0">{goal.percentComplete}%</span>
      </div>
      <GoalProgressBar percent={goal.percentComplete} className="mb-2.5" />
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{formatPHP(goal.savedAmount)}</span>
        <span>{formatPHP(goal.targetAmount)}</span>
      </div>
    </Link>
  )
}
