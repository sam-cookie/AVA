'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormModal } from '@/components/shared/form-modal'
import { getTransferByIdAction, updateTransferAction } from '@/actions/transfers'
import { getFundsWithBalancesAction } from '@/actions/funds'
import { editTransferSchema, type EditTransferValues } from '@/lib/validations/transfer'
import { fromCentavos } from '@/lib/utils/currency'
import type { FundWithBalance, TransactionWithFund } from '@/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: TransactionWithFund
}

export function EditTransferSheet({ open, onOpenChange, transaction }: Props) {
  const [loadingTransfer, setLoadingTransfer] = useState(false)
  const [funds, setFunds] = useState<FundWithBalance[]>([])

  const form = useForm<EditTransferValues>({
    resolver: zodResolver(editTransferSchema),
    defaultValues: {
      fromFundId: 0,
      toFundId: 0,
      amount: '',
      fee: '',
      date: transaction.date,
      note: transaction.note ?? '',
    },
  })

  const fromId = Number(form.watch('fromFundId'))
  const toId = Number(form.watch('toFundId'))
  const fromFund = funds.find((f) => f.id === fromId)
  const toFund = funds.find((f) => f.id === toId)

  useEffect(() => {
    if (!open || !transaction.transferId) return
    setLoadingTransfer(true)
    Promise.all([
      getTransferByIdAction(transaction.transferId),
      getFundsWithBalancesAction(),
    ]).then(([t, allFunds]) => {
      setFunds(allFunds)
      if (t) {
        form.reset({
          fromFundId: t.fromFundId,
          toFundId: t.toFundId,
          amount: fromCentavos(t.amount).toFixed(2),
          fee: t.fee > 0 ? fromCentavos(t.fee).toFixed(2) : '',
          date: t.date,
          note: t.note ?? '',
        })
      }
      setLoadingTransfer(false)
    })
  }, [open, transaction.transferId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: EditTransferValues) {
    if (!transaction.transferId) return
    const result = await updateTransferAction(transaction.transferId, values)
    if (result.success) {
      toast.success('Transfer updated')
      onOpenChange(false)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <FormModal open={open} onOpenChange={onOpenChange} title="Edit Transfer">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="px-5 md:px-6 py-5 space-y-4">
          {loadingTransfer ? (
            <div className="h-32 flex items-center justify-center text-[13px] text-muted-foreground">
              Loading…
            </div>
          ) : (
            <>
              {/* From / To accounts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>From</Label>
                  <Select
                    value={String(fromId)}
                    onValueChange={(v) => form.setValue('fromFundId', Number(v), { shouldValidate: true })}
                  >
                    <SelectTrigger className="w-full h-10">
                      <SelectValue>{fromFund?.name ?? 'Select fund'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {funds.map((f) => (
                        <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.fromFundId && (
                    <p className="text-[12px] text-destructive">{form.formState.errors.fromFundId.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>To</Label>
                  <Select
                    value={String(toId)}
                    onValueChange={(v) => form.setValue('toFundId', Number(v), { shouldValidate: true })}
                  >
                    <SelectTrigger className="w-full h-10">
                      <SelectValue>{toFund?.name ?? 'Select fund'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {funds.filter((f) => f.id !== fromId).map((f) => (
                        <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.toFundId && (
                    <p className="text-[12px] text-destructive">{form.formState.errors.toFundId.message}</p>
                  )}
                </div>
              </div>

              {/* Route preview */}
              {fromFund && toFund && fromId !== toId && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted text-sm">
                  <span className="font-medium">{fromFund.name}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">{toFund.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">not an expense</span>
                </div>
              )}

              {/* Amount */}
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[13px]">₱</span>
                  <Input inputMode="decimal" placeholder="0.00" className="h-10 pl-7" {...form.register('amount')} />
                </div>
                {form.formState.errors.amount && (
                  <p className="text-[12px] text-destructive">{form.formState.errors.amount.message}</p>
                )}
              </div>

              {/* Fee */}
              <div className="space-y-1.5">
                <Label>Transfer fee <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[13px]">₱</span>
                  <Input inputMode="decimal" placeholder="0.00" className="h-10 pl-7" {...form.register('fee')} />
                </div>
                {form.formState.errors.fee && (
                  <p className="text-[12px] text-destructive">{form.formState.errors.fee.message}</p>
                )}
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" className="h-10" {...form.register('date')} />
                {form.formState.errors.date && (
                  <p className="text-[12px] text-destructive">{form.formState.errors.date.message}</p>
                )}
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <Label>Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input placeholder="What's this transfer for?" className="h-10" {...form.register('note')} />
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border px-5 md:px-6 py-4 flex gap-3 shrink-0">
          <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1 h-11" disabled={form.formState.isSubmitting || loadingTransfer}>
            {form.formState.isSubmitting ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </FormModal>
  )
}
