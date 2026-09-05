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
import { cn } from '@/lib/utils'
import { utangSchema, type UtangInput } from '@/lib/validations/utang'
import { createUtangAction, updateUtangAction } from '@/actions/utang'
import { fromCentavos, formatPHP } from '@/lib/utils/currency'
import type { UtangWithProgress, FundWithBalance } from '@/types'

type Props = {
  trigger: React.ReactNode
  utang?: UtangWithProgress
  funds?: FundWithBalance[]
  onSuccess?: () => void
}

export function UtangFormModal({ trigger, utang: record, funds = [], onSuccess }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const isEdit = !!record

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<UtangInput>({
    resolver: zodResolver(utangSchema),
    defaultValues: {
      type: record?.type ?? 'i_owe',
      person: record?.person ?? '',
      amount: record ? String(fromCentavos(record.amount)) : '',
      deadline: record?.deadline ?? '',
      note: record?.note ?? '',
      fundId: record?.fundId ?? undefined,
    },
  })

  const selectedType = watch('type')
  const selectedFundId = watch('fundId')

  function onSubmit(data: UtangInput) {
    startTransition(async () => {
      const result = isEdit
        ? await updateUtangAction(record.id, data)
        : await createUtangAction(data)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(isEdit ? 'Utang updated' : 'Utang recorded')
      setOpen(false)
      if (!isEdit) reset()
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
        title={isEdit ? 'Edit Utang' : 'New Utang'}
        subtitle={isEdit ? record.person : 'Track money owed or lent'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          <div className="px-5 py-5 md:px-6 space-y-5 flex-1">
            {/* Type toggle */}
            {!isEdit && (
              <div className="space-y-1.5">
                <Label>Direction</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['i_owe', 'they_owe'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setValue('type', t)}
                      className={cn(
                        'h-11 rounded-lg border text-sm font-medium transition-colors',
                        selectedType === t
                          ? 'border-primary bg-accent text-primary'
                          : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/40'
                      )}
                    >
                      {t === 'i_owe' ? 'I owe someone' : 'Someone owes me'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Person */}
            <div className="space-y-1.5">
              <Label htmlFor="ut-person">
                {selectedType === 'i_owe' ? 'Who do you owe?' : 'Who owes you?'}
              </Label>
              <Input
                id="ut-person"
                autoFocus
                placeholder="Name or nickname"
                className="h-10"
                {...register('person')}
              />
              {errors.person && <p className="text-xs text-destructive">{errors.person.message}</p>}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="ut-amount">Amount (₱)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground pointer-events-none select-none">
                  ₱
                </span>
                <Input
                  id="ut-amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="pl-10 h-14 text-3xl font-bold border-border focus-visible:ring-primary/30"
                  {...register('amount')}
                />
              </div>
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>

            {/* Fund Selector for they_owe (Lent from Account) */}
            {selectedType === 'they_owe' && funds.length > 0 && (!isEdit || !!record?.fundId) && (
              <div className="space-y-1.5">
                <Label htmlFor="ut-fund">Lent from Account</Label>
                <Select
                  value={selectedFundId ? String(selectedFundId) : ''}
                  onValueChange={(v) => setValue('fundId', Number(v), { shouldValidate: true })}
                >
                  <SelectTrigger id="ut-fund" className="w-full h-10">
                    <SelectValue placeholder="Select account" />
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
            )}

            {/* Deadline */}
            <div className="space-y-1.5">
              <Label htmlFor="ut-deadline">
                Deadline <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input id="ut-deadline" type="date" className="h-10" {...register('deadline')} />
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <Label htmlFor="ut-note">
                Note <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input id="ut-note" placeholder="Any details?" className="h-10" {...register('note')} />
            </div>
          </div>

          <div className="px-5 pb-6 md:px-6 border-t border-border pt-4 shrink-0 flex gap-3">
            <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-11" disabled={pending}>
              {pending ? (isEdit ? 'Saving…' : 'Adding…') : isEdit ? 'Save changes' : 'Add utang'}
            </Button>
          </div>
        </form>
      </FormModal>
    </>
  )
}
