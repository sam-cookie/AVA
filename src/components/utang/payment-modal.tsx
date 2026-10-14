'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { FormModal } from '@/components/shared/form-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { utangPaymentSchema, type UtangPaymentInput } from '@/lib/validations/utang'
import { recordPaymentAction } from '@/actions/utang'
import { formatPHP, fromCentavos } from '@/lib/utils/currency'
import { todayISO } from '@/lib/utils/date'
import { useAppRefresh } from '@/lib/state/app-refresh'
import type { FundWithBalance, UtangWithProgress } from '@/types'

type Props = {
  trigger: React.ReactNode
  utang: UtangWithProgress
  funds: FundWithBalance[]
  onSuccess?: () => void
}

export function PaymentModal({ trigger, utang, funds, onSuccess }: Props) {
  const { refresh } = useAppRefresh()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<UtangPaymentInput>({
    resolver: zodResolver(utangPaymentSchema),
    defaultValues: {
      utangId: utang.id,
      fundId: funds[0]?.id ?? 0,
      amount: fromCentavos(utang.remaining) > 0 ? String(fromCentavos(utang.remaining).toFixed(2)) : '',
      date: todayISO(),
      note: '',
    },
  })

  const selectedFundId = Number(watch('fundId'))
  const selectedFund = funds.find((f) => f.id === selectedFundId)

  function onSubmit(data: UtangPaymentInput) {
    startTransition(async () => {
      const result = await recordPaymentAction(data)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Payment recorded')
      setOpen(false)
      reset()
      refresh({ type: 'utang-payment', id: utang.id })
      onSuccess?.()
    })
  }

  const direction = utang.type === 'i_owe'
    ? 'Which account to pay from?'
    : 'Which account to receive into?'

  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger}
      </span>
      <FormModal
        open={open}
        onOpenChange={setOpen}
        title="Record Payment"
        subtitle={`${utang.type === 'i_owe' ? 'Paying' : 'Receiving from'} ${utang.person} · ${formatPHP(utang.remaining)} remaining`}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          <div className="px-5 py-5 md:px-6 space-y-5 flex-1">
            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="pay-amount">Amount (₱)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground pointer-events-none select-none">
                  ₱
                </span>
                <Input
                  id="pay-amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="pl-10 h-14 text-3xl font-bold border-border focus-visible:ring-primary/30"
                  {...register('amount')}
                />
              </div>
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>

            {/* Fund */}
            <div className="space-y-1.5">
              <Label>{direction}</Label>
              <Select
                value={String(selectedFundId)}
                onValueChange={(v) => setValue('fundId', Number(v))}
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select account">
                    {selectedFund ? `${selectedFund.name}  ·  ${formatPHP(selectedFund.balance)}` : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {funds.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.name} · {formatPHP(f.balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.fundId && <p className="text-xs text-destructive">{errors.fundId.message}</p>}
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <Label htmlFor="pay-date">Date</Label>
              <Input id="pay-date" type="date" className="h-10" {...register('date')} />
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <Label htmlFor="pay-note">
                Note <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input id="pay-note" placeholder="Any details?" className="h-10" {...register('note')} />
            </div>
          </div>

          <div className="px-5 pb-6 md:px-6 border-t border-border pt-4 shrink-0 flex gap-3">
            <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-11" disabled={pending}>
              {pending ? 'Recording…' : 'Record payment'}
            </Button>
          </div>
        </form>
      </FormModal>
    </>
  )
}
