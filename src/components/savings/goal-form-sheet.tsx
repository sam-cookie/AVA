'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { FormModal } from '@/components/shared/form-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { savingsGoalSchema, type SavingsGoalInput } from '@/lib/validations/savings-goal'
import { createGoalAction, updateGoalAction } from '@/actions/savings-goals'
import { fromCentavos } from '@/lib/utils/currency'
import { useAppRefresh } from '@/lib/state/app-refresh'
import type { GoalWithProgress } from '@/types'

type Props = {
  trigger: React.ReactNode
  goal?: GoalWithProgress
  onSuccess?: () => void
}

export function GoalFormSheet({ trigger, goal, onSuccess }: Props) {
  const { refresh } = useAppRefresh()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const isEdit = !!goal
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SavingsGoalInput>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: {
      name: goal?.name ?? '',
      targetAmount: goal ? String(fromCentavos(goal.targetAmount)) : '',
      targetDate: goal?.targetDate ?? '',
      note: goal?.note ?? '',
    },
  })

  function onSubmit(data: SavingsGoalInput) {
    startTransition(async () => {
      const result = isEdit
        ? await updateGoalAction(goal.id, data)
        : await createGoalAction(data)

      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(isEdit ? 'Goal updated' : 'Goal created')
      setOpen(false)
      reset()
      refresh({ type: 'savings-goal', id: goal?.id })
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
        title={isEdit ? 'Edit Goal' : 'New Savings Goal'}
        subtitle={isEdit ? goal.name : 'Set a target to work toward'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          <div className="px-5 py-5 md:px-6 space-y-4 flex-1">
            <div className="space-y-1.5">
              <Label htmlFor="name">Goal name</Label>
              <Input
                id="name"
                placeholder="New Laptop, Emergency Fund…"
                {...register('name')}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="targetAmount">Target amount (₱)</Label>
              <Input
                id="targetAmount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="60,000"
                {...register('targetAmount')}
              />
              {errors.targetAmount && (
                <p className="text-xs text-destructive">{errors.targetAmount.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="targetDate">Target date <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="targetDate" type="date" {...register('targetDate')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note">Note <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea
                id="note"
                placeholder="What is this goal for?"
                rows={2}
                {...register('note')}
              />
            </div>
          </div>

          <div className="px-5 pb-6 md:px-6 border-t border-border pt-4 shrink-0">
            <Button type="submit" className="w-full h-11" disabled={pending}>
              {pending ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save changes' : 'Create goal'}
            </Button>
          </div>
        </form>
      </FormModal>
    </>
  )
}
