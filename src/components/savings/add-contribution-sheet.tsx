'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { FormModal } from '@/components/shared/form-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { contributionSchema, type ContributionInput } from '@/lib/validations/savings-goal'
import { addContributionAction } from '@/actions/savings-goals'
import { todayISO } from '@/lib/utils/date'
import { formatPHP } from '@/lib/utils/currency'
import { useAppRefresh } from '@/lib/state/app-refresh'
import type { FundWithBalance, GoalWithProgress } from '@/types'

type Props = {
  goal: GoalWithProgress
  funds: FundWithBalance[]
  trigger: React.ReactNode
  onSuccess?: () => void
}

export function AddContributionSheet({ goal, funds, trigger, onSuccess }: Props) {
  const { refresh } = useAppRefresh()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContributionInput>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      goalId: goal.id,
      fundId: funds[0]?.id,
      amount: '',
      date: todayISO(),
    },
  })

  function onSubmit(data: ContributionInput) {
    startTransition(async () => {
      const result = await addContributionAction(data)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(`Added to ${goal.name}`)
      setOpen(false)
      reset({ goalId: goal.id, fundId: funds[0]?.id, amount: '', date: todayISO() })
      refresh({ type: 'savings-contribution', id: goal.id })
      onSuccess?.()
    })
  }

  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger}
      </span>
      <FormModal
        open={open}
        onOpenChange={setOpen}
        title={`Add money to ${goal.name}`}
        subtitle="This will deduct the amount from the selected account"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          <div className="px-5 py-5 md:px-6 space-y-4 flex-1">
            <input type="hidden" {...register('goalId', { valueAsNumber: true })} />

            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (₱)</Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="5,000"
                {...register('amount')}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fundId">From account</Label>
              <select
                id="fundId"
                {...register('fundId', { valueAsNumber: true })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {funds.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} — {formatPHP(f.balance)}
                  </option>
                ))}
              </select>
              {errors.fundId && <p className="text-xs text-destructive">{errors.fundId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register('date')} />
            </div>
          </div>

          <div className="px-5 pb-6 md:px-6 border-t border-border pt-4 shrink-0">
            <Button type="submit" className="w-full h-11" disabled={pending}>
              {pending ? 'Adding…' : '→ Add to goal'}
            </Button>
          </div>
        </form>
      </FormModal>
    </>
  )
}
