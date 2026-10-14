'use client'

import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { numericInputProps } from '@/lib/utils/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { transferSchema, transferDefaults, type TransferFormValues } from '@/lib/validations/transfer'
import { createTransferAction } from '@/actions/transfers'
import { formatPHP, toCentavos } from '@/lib/utils/currency'
import { todayISO } from '@/lib/utils/date'
import type { FundWithBalance } from '@/types'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppRefresh } from '@/lib/state/app-refresh'

type Props = {
  funds: FundWithBalance[]
  onSuccess?: () => void
  onClose?: () => void
}

export function TransferForm({ funds, onSuccess, onClose }: Props) {
  const { refresh } = useAppRefresh()
  const form = useForm<TransferFormValues>({
    resolver: standardSchemaResolver(transferSchema),
    defaultValues: {
      ...transferDefaults,
      fromFundId: funds[0]?.id ?? 0,
      toFundId: funds[1]?.id ?? 0,
      date: todayISO(),
    },
  })

  const fromId = Number(form.watch('fromFundId'))
  const toId = Number(form.watch('toFundId'))
  const amountRaw = form.watch('amount')
  const feeRaw = form.watch('fee')

  const fromFund = funds.find((f) => f.id === fromId)
  const toFund = funds.find((f) => f.id === toId)

  const amountCents = amountRaw ? Math.round(parseFloat(amountRaw.replace(/,/g, '')) * 100) : 0
  const feeCents = feeRaw ? Math.round(parseFloat(feeRaw.replace(/,/g, '')) * 100) : 0
  const showSummary = amountCents > 0 && fromFund && toFund && fromId !== toId

  async function onSubmit(values: TransferFormValues) {
    const result = await createTransferAction(values)
    if (result.success) {
      toast.success(`Transferred ${formatPHP(toCentavos(values.amount))} from ${fromFund?.name} → ${toFund?.name}`)
      form.reset({ ...transferDefaults, fromFundId: values.fromFundId, date: todayISO() })
      refresh({ type: 'transfer' })
      onSuccess?.()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="px-5 md:px-6 py-5 space-y-5">
        {/* From / To accounts */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>From</Label>
            <Select value={String(fromId)} onValueChange={(v) => form.setValue('fromFundId', Number(v))}>
              <SelectTrigger className="w-full h-10">
                <SelectValue>
                  {fromFund ? fromFund.name : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {funds.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fromFund && (
              <p className="text-xs text-muted-foreground">{formatPHP(fromFund.balance)} available</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>To</Label>
            <Select value={String(toId)} onValueChange={(v) => form.setValue('toFundId', Number(v))}>
              <SelectTrigger className="w-full h-10">
                <SelectValue>
                  {toFund ? toFund.name : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {funds.filter((f) => f.id !== fromId).map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.toFundId && (
              <p className="text-xs text-destructive">{form.formState.errors.toFundId.message}</p>
            )}
          </div>
        </div>

        {/* Transfer route preview */}
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
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground pointer-events-none select-none">
              ₱
            </span>
            <Input
              inputMode="decimal"
              placeholder="0.00"
              className="pl-10 h-14 text-3xl font-bold border-border focus-visible:ring-primary/30"
              {...numericInputProps()}
              {...form.register('amount')}
            />
          </div>
          {form.formState.errors.amount && (
            <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
          )}
        </div>

        {/* Fee */}
        <div className="space-y-1.5">
          <Label>Transaction Fee <span className="text-muted-foreground font-normal">(optional, default ₱0)</span></Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none select-none">₱</span>
            <Input
              inputMode="decimal"
              placeholder="0.00"
              className="pl-8 h-10"
              {...numericInputProps()}
              {...form.register('fee')}
            />
          </div>
          {form.formState.errors.fee && (
            <p className="text-xs text-destructive">{form.formState.errors.fee.message}</p>
          )}
        </div>

        {/* Summary */}
        {showSummary && (
          <div className="rounded-xl bg-muted px-4 py-3 text-sm space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Summary</p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{toFund!.name} receives</span>
              <span className="tabular-nums font-semibold">+{formatPHP(amountCents)}</span>
            </div>
            {feeCents > 0 && (
              <div className="flex justify-between text-destructive/80">
                <span>Transaction fee</span>
                <span className="tabular-nums">−{formatPHP(feeCents)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2 mt-1">
              <span className="text-muted-foreground">Total from {fromFund!.name}</span>
              <span className="tabular-nums font-semibold">−{formatPHP(amountCents + feeCents)}</span>
            </div>
          </div>
        )}

        {/* Date */}
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" className="h-10" {...form.register('date')} />
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <Label>Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input placeholder="What's this transfer for?" className="h-10" {...form.register('note')} />
        </div>
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 bg-card border-t border-border px-5 md:px-6 py-4 flex gap-3 shrink-0">
        {onClose && (
          <Button type="button" variant="outline" className="flex-1 h-11" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1 h-11" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Transferring…' : 'Transfer'}
        </Button>
      </div>
    </form>
  )
}
