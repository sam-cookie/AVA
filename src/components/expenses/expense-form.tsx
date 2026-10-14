'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { expenseSchema, expenseDefaults, type ExpenseFormValues } from '@/lib/validations/expense'
import { createExpenseAction, updateExpenseAction } from '@/actions/expenses'
import { formatPHP, fromCentavos } from '@/lib/utils/currency'
import { todayISO } from '@/lib/utils/date'
import { cn } from '@/lib/utils'
import type { Category, FundWithBalance, Transaction } from '@/types'
import { CategoryIcon } from '@/components/categories/category-icon'
import { AddCategorySheet } from '@/components/categories/add-category-sheet'
import { Button } from '@/components/ui/button'
import { useAppRefresh } from '@/lib/state/app-refresh'

type Props = {
  funds: FundWithBalance[]
  categories: Category[]
  /** When provided, form runs in edit mode */
  initialData?: Transaction
  transactionId?: number
  onSuccess?: () => void
  onClose?: () => void
}

function toFormAmount(centavos: number): string {
  return fromCentavos(centavos).toFixed(2)
}

export function ExpenseForm({ funds, categories, initialData, transactionId, onSuccess, onClose }: Props) {
  const router = useRouter()
  const { refresh } = useAppRefresh()
  const [localCategories, setLocalCategories] = useState(categories)
  const isEdit = transactionId != null && initialData != null

  const defaultFundId = initialData?.fundId ?? funds[0]?.id ?? 0

  const form = useForm<ExpenseFormValues>({
    resolver: standardSchemaResolver(expenseSchema),
    defaultValues: isEdit
      ? {
          title: initialData.title ?? '',
          amount: toFormAmount(initialData.amount),
          category: initialData.category ?? '',
          fundId: initialData.fundId,
          date: initialData.date,
          note: initialData.note ?? '',
        }
      : { ...expenseDefaults, fundId: defaultFundId, date: todayISO() },
  })

  const selectedCategory = form.watch('category')
  const selectedFundId = Number(form.watch('fundId'))
  const selectedFund = funds.find((f) => f.id === selectedFundId)

  async function onSubmit(values: ExpenseFormValues) {
    const result = isEdit
      ? await updateExpenseAction(transactionId, values)
      : await createExpenseAction(values)

    if (result.success) {
      toast.success(isEdit ? 'Expense updated' : 'Expense recorded')
      if (!isEdit) {
        form.reset({ ...expenseDefaults, fundId: values.fundId, category: values.category, date: todayISO() })
      }
      refresh({ type: 'expense', id: transactionId })
      onSuccess?.()
    } else {
      toast.error(result.error)
    }
  }

  function handleCategoryCreated(name: string) {
    setLocalCategories((prev) => [...prev, { id: Date.now() * -1, name, icon: 'Tag', createdAt: new Date() }])
    form.setValue('category', name)
    router.refresh()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="px-5 md:px-6 py-5 space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="exp-title">What did you spend on?</Label>
          <Input
            id="exp-title"
            autoFocus
            placeholder="e.g. McDonald's lunch, Grab ride"
            className="h-10"
            {...form.register('title')}
          />
          {form.formState.errors.title && (
            <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>

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

        {/* Category grid */}
        <div className="space-y-2">
          <Label>Category</Label>
          <div className="grid grid-cols-4 gap-2">
            {localCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => form.setValue('category', cat.name)}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-3 px-1 rounded-lg border text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selectedCategory === cat.name
                    ? 'border-primary bg-accent text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground hover:bg-muted/30'
                )}
              >
                <CategoryIcon
                  name={cat.icon}
                  className={cn('h-5 w-5', selectedCategory === cat.name ? 'text-primary' : 'text-muted-foreground')}
                />
                <span className="truncate w-full text-center leading-tight">{cat.name}</span>
              </button>
            ))}
            <AddCategorySheet onCreated={handleCategoryCreated} triggerVariant="tile" />
          </div>
          {form.formState.errors.category && (
            <p className="text-xs text-destructive">{form.formState.errors.category.message}</p>
          )}
        </div>

        {/* Account */}
        <div className="space-y-1.5">
          <Label>Account</Label>
          <Select value={String(selectedFundId)} onValueChange={(v) => form.setValue('fundId', Number(v))}>
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="Which account to deduct from?">
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
          {form.formState.errors.fundId && (
            <p className="text-xs text-destructive">{form.formState.errors.fundId.message}</p>
          )}
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <Label htmlFor="exp-date">Date</Label>
          <Input id="exp-date" type="date" className="h-10" {...form.register('date')} />
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <Label htmlFor="exp-note">
            Note <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input id="exp-note" placeholder="Any extra details?" className="h-10" {...form.register('note')} />
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
            ? isEdit ? 'Saving…' : 'Recording…'
            : isEdit ? 'Save Changes' : 'Record Expense'}
        </Button>
      </div>
    </form>
  )
}
