'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { contributionSchema, type ContributionInput } from '@/lib/validations/savings-goal'
import { addContributionAction } from '@/actions/savings-goals'
import { numericInputProps } from '@/lib/utils/input'
import { todayISO } from '@/lib/utils/date'
import { formatPHP } from '@/lib/utils/currency'
import { useAppRefresh } from '@/lib/state/app-refresh'
import type { FundWithBalance, GoalWithProgress } from '@/types'

type Props = {
  goals: GoalWithProgress[]
  funds: FundWithBalance[]
  onSuccess?: () => void
  onClose?: () => void
}

export function SaveToGoalForm({ goals, funds, onSuccess, onClose }: Props) {
  const { refresh } = useAppRefresh()
  const activeGoals = goals.filter((g) => g.percentComplete < 100)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContributionInput>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      goalId: activeGoals[0]?.id,
      fundId: funds[0]?.id,
      amount: '',
      date: todayISO(),
    },
  })

  async function onSubmit(data: ContributionInput) {
    const result = await addContributionAction(data)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    const goal = goals.find((g) => g.id === data.goalId)
    toast.success(`Added to ${goal?.name ?? 'goal'}`)
    refresh({ type: 'savings-goal', id: data.goalId })
    onSuccess?.()
  }

  if (activeGoals.length === 0) {
    return (
      <div className="px-5 md:px-6 py-8 text-center">
        <p className="text-sm text-muted-foreground">No active savings goals yet.</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Create a goal from the Savings tab first.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="px-5 md:px-6 py-5 space-y-5">

        {/* Goal selector */}
        <div className="space-y-1.5">
          <Label htmlFor="sg-goal">Savings goal</Label>
          <select
            id="sg-goal"
            {...register('goalId', { valueAsNumber: true })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {activeGoals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} — {g.percentComplete}% · {formatPHP(g.remaining)} left
              </option>
            ))}
          </select>
          {errors.goalId && <p className="text-xs text-destructive">{errors.goalId.message}</p>}
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <Label htmlFor="sg-amount">Amount</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground pointer-events-none select-none">
              ₱
            </span>
            <Input
              id="sg-amount"
              autoFocus
              inputMode="decimal"
              placeholder="0.00"
              className="pl-10 h-14 text-3xl font-bold border-border focus-visible:ring-primary/30"
              {...numericInputProps()}
              {...register('amount')}
            />
          </div>
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>

        {/* From account */}
        <div className="space-y-1.5">
          <Label htmlFor="sg-fund">From account</Label>
          <select
            id="sg-fund"
            {...register('fundId', { valueAsNumber: true })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {funds.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} · {formatPHP(f.balance)}
              </option>
            ))}
          </select>
          {errors.fundId && <p className="text-xs text-destructive">{errors.fundId.message}</p>}
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <Label htmlFor="sg-date">Date</Label>
          <Input id="sg-date" type="date" className="h-10" {...register('date')} />
        </div>
      </div>

      <div className="sticky bottom-0 bg-card border-t border-border px-5 md:px-6 py-4 flex gap-3">
        {onClose && (
          <Button type="button" variant="outline" className="flex-1 h-11" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1 h-11" disabled={isSubmitting}>
          {isSubmitting ? 'Adding…' : 'Add to goal'}
        </Button>
      </div>
    </form>
  )
}
