'use client'

import { useState } from 'react'
import { FormModal } from '@/components/shared/form-modal'
import { ExpenseForm } from './expense-form'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Category, FundWithBalance } from '@/types'

type Props = {
  funds: FundWithBalance[]
  categories: Category[]
}

export function ExpenseSheet({ funds, categories }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="inline-flex items-center gap-1">
        <Plus className="h-4 w-4" />
        Expense
      </Button>
      <FormModal
        open={open}
        onOpenChange={setOpen}
        title="Add Expense"
        subtitle="Record a new expense"
      >
        <ExpenseForm
          funds={funds}
          categories={categories}
          onSuccess={() => setOpen(false)}
          onClose={() => setOpen(false)}
        />
      </FormModal>
    </>
  )
}
