import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Pencil } from 'lucide-react'
import { getGoalById } from '@/services/savings-goals'
import { getFundsWithBalances } from '@/services/funds'
import { GoalDetailClient } from '@/components/savings/goal-detail-client'
import { GoalFormSheet } from '@/components/savings/goal-form-sheet'

type Props = {
  params: Promise<{ id: string }>
}

export default async function GoalDetailPage({ params }: Props) {
  const { id } = await params
  const goalId = Number(id)
  if (isNaN(goalId)) notFound()

  const [goal, funds] = await Promise.all([getGoalById(goalId), getFundsWithBalances()])
  if (!goal) notFound()

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-6">
      {/* Back + edit header */}
      <div className="flex items-center justify-between">
        <Link
          href="/savings"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Savings Goals
        </Link>
        <GoalFormSheet
          goal={goal}
          trigger={
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors">
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          }
        />
      </div>

      {/* Goal name */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{goal.name}</h1>
        {goal.note && (
          <p className="text-sm text-muted-foreground mt-1">{goal.note}</p>
        )}
      </div>

      {/* Detail client component (ring + history) */}
      <GoalDetailClient goal={goal} funds={funds} />
    </div>
  )
}
