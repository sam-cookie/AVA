'use client'

import { FormModal } from '@/components/shared/form-modal'
import { ExpenseForm } from './expense-form'
import type { Category, FundWithBalance, Transaction } from '@/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction
  funds: FundWithBalance[]
  categories: Category[]
}

export function EditExpenseSheet({ open, onOpenChange, transaction, funds, categories }: Props) {
  return (
    <FormModal open={open} onOpenChange={onOpenChange} title="Edit Expense" subtitle="Update this expense">
      <ExpenseForm
        funds={funds}
        categories={categories}
        initialData={transaction}
        transactionId={transaction.id}
        onSuccess={() => onOpenChange(false)}
        onClose={() => onOpenChange(false)}
      />
    </FormModal>
  )
}
