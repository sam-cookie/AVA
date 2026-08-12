'use client'

import { useState } from 'react'
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
import { addMoneySchema, addMoneyDefaults, type AddMoneyFormValues } from '@/lib/validations/fund'
import { addMoneyAction } from '@/actions/funds'
import { updateAdditionAction } from '@/actions/expenses'
import { createSourceAction } from '@/actions/sources'
import { todayISO } from '@/lib/utils/date'
import { cn } from '@/lib/utils'
import { formatPHP, fromCentavos } from '@/lib/utils/currency'
import type { FundWithBalance, IncomeSource, Transaction, GoalWithProgress } from '@/types'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SaveToGoalForm } from './save-to-goal-form'

type Props = {
  fund?: FundWithBalance
  funds?: FundWithBalance[]
  sources: IncomeSource[]
  goals?: GoalWithProgress[]
  /** When provided, form runs in edit mode */
  initialData?: Transaction
  transactionId?: number
  onSuccess?: () => void
  onClose?: () => void
}

export function AddMoneyForm({ fund, funds, sources: initialSources, goals, initialData, transactionId, onSuccess, onClose }: Props) {
  const [mode, setMode] = useState<'income' | 'savings'>('income')
  const [localSources, setLocalSources] = useState(initialSources)
  const [newSourceInput, setNewSourceInput] = useState('')
  const [showNewSource, setShowNewSource] = useState(false)

  const isEdit = transactionId != null && initialData != null
  const defaultFundId = initialData?.fundId ?? fund?.id ?? (funds?.[0]?.id ?? 0)
  const allFunds = funds ?? (fund ? [fund] : [])

  const form = useForm<AddMoneyFormValues>({
    resolver: standardSchemaResolver(addMoneySchema),
    defaultValues: isEdit
      ? {
          fundId: initialData.fundId,
          amount: fromCentavos(initialData.amount).toFixed(2),
          source: initialData.source ?? '',
          date: initialData.date,
          note: initialData.note ?? '',
        }
      : { ...addMoneyDefaults, fundId: defaultFundId, date: todayISO() },
  })

  const selectedSource = form.watch('source')
  const selectedFundId = Number(form.watch('fundId'))
  const selectedFund = allFunds.find((f) => f.id === selectedFundId)

  async function onSubmit(values: AddMoneyFormValues) {
    const result = isEdit
      ? await updateAdditionAction(transactionId, values)
      : await addMoneyAction(values)

    if (result.success) {
      const fundName = fund?.name ?? allFunds.find((f) => f.id === values.fundId)?.name ?? 'fund'
      toast.success(isEdit ? 'Income entry updated' : `Added to ${fundName}`)
      if (!isEdit) {
        form.reset({ ...addMoneyDefaults, fundId: defaultFundId, date: todayISO() })
      }
      onSuccess?.()
    } else {
      toast.error(result.error)
    }
  }

  async function handleAddSource() {
    const name = newSourceInput.trim()
    if (!name) return
    const result = await createSourceAction(name)
    if (result.success) {
      setLocalSources((prev) => [...prev, { id: Date.now() * -1, name, createdAt: new Date() }])
      form.setValue('source', name)
      setNewSourceInput('')
      setShowNewSource(false)
    } else {
      toast.error(result.error)
    }
  }

  const showToggle = !initialData && !fund && goals && goals.length > 0
  const allFundsForSavings = funds ?? []

  if (showToggle && mode === 'savings') {
    return (
      <>
        <ModeToggle mode={mode} onChange={setMode} />
        <SaveToGoalForm goals={goals!} funds={allFundsForSavings} onSuccess={onSuccess} onClose={onClose} />
      </>
    )
  }

  return (
    <>
      {showToggle && <ModeToggle mode={mode} onChange={setMode} />}
      <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="px-5 md:px-6 py-5 space-y-5">
        {/* Destination account — only shown when not locked to a single fund */}
        {!fund && (
          <div className="space-y-1.5">
            <Label>Destination Account</Label>
            <Select
              value={selectedFundId > 0 ? String(selectedFundId) : ''}
              onValueChange={(v) => form.setValue('fundId', Number(v))}
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Which account receives this money?">
                  {selectedFund ? `${selectedFund.name}  ·  ${formatPHP(selectedFund.balance)}` : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {allFunds.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.name} · {formatPHP(f.balance)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.fundId && (
              <p className="text-xs text-destructive">{form.formState.errors.fundId.message}</p>
            )}
          </div>
        )}

        {fund && <input type="hidden" {...form.register('fundId', { valueAsNumber: true })} />}

        {/* Amount */}
        <div className="space-y-1.5">
          <Label>Amount</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground pointer-events-none select-none">
              ₱
            </span>
            <Input
              autoFocus
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

        {/* Source grid */}
        <div className="space-y-2">
          <Label>
            Source <span className="text-muted-foreground font-normal">(where did this come from?)</span>
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {localSources.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => form.setValue('source', s.name)}
                className={cn(
                  'flex items-center justify-center py-2.5 px-2 rounded-lg border text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selectedSource === s.name
                    ? 'border-primary bg-accent text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground hover:bg-muted/30'
                )}
              >
                <span className="truncate text-center leading-tight">{s.name}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowNewSource((v) => !v)}
              className="flex items-center justify-center gap-1 py-2.5 px-2 rounded-lg border border-dashed border-border/80 text-[12px] font-medium text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-accent/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              New
            </button>
          </div>
          {showNewSource && (
            <div className="flex gap-2 mt-1">
              <Input
                autoFocus
                placeholder="e.g. Scholarship"
                value={newSourceInput}
                onChange={(e) => setNewSourceInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSource())}
                className="h-9 text-sm"
              />
              <Button type="button" size="sm" variant="outline" onClick={handleAddSource}>
                Add
              </Button>
            </div>
          )}
          {form.formState.errors.source && (
            <p className="text-xs text-destructive">{form.formState.errors.source.message}</p>
          )}
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <Label htmlFor="add-date">Date</Label>
          <Input id="add-date" type="date" className="h-10" {...form.register('date')} />
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <Label htmlFor="add-note">
            Note <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="add-note"
            placeholder="e.g. Monthly allowance from mom"
            className="h-10"
            {...form.register('note')}
          />
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
          {form.formState.isSubmitting
            ? isEdit ? 'Saving…' : 'Adding…'
            : isEdit ? 'Save Changes' : 'Add Money'}
        </Button>
      </div>
    </form>
    </>
  )
}

function ModeToggle({ mode, onChange }: { mode: 'income' | 'savings'; onChange: (m: 'income' | 'savings') => void }) {
  return (
    <div className="flex gap-px mx-5 md:mx-6 mt-5 rounded-lg border border-border overflow-hidden">
      {(['income', 'savings'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={cn(
            'flex-1 py-2 text-[12px] font-semibold tracking-wide transition-colors',
            mode === m
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          )}
        >
          {m === 'income' ? 'Add income' : 'Save to goal'}
        </button>
      ))}
    </div>
  )
}
