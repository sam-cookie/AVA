'use client'

import { useState } from 'react'
import { FormModal } from '@/components/shared/form-modal'
import { ExpenseForm } from '@/components/expenses/expense-form'
import { AddMoneyForm } from '@/components/funds/add-money-form'
import { TransferForm } from '@/components/transfers/transfer-form'
import { cn } from '@/lib/utils'
import type { FundWithBalance, Category, IncomeSource, GoalWithProgress } from '@/types'

type Props = {
  funds: FundWithBalance[]
  categories: Category[]
  sources: IncomeSource[]
  goals?: GoalWithProgress[]
}

export function QuickActions({ funds, categories, sources, goals }: Props) {
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [addMoneyOpen, setAddMoneyOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setExpenseOpen(true)}
          className="h-9 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 active:scale-[0.98] transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          + Expense
        </button>

        <button
          onClick={() => setAddMoneyOpen(true)}
          className="h-9 rounded-md border border-border text-foreground text-[13px] font-medium hover:bg-muted/50 active:scale-[0.98] transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          + Add money
        </button>

        <button
          onClick={() => setTransferOpen(true)}
          disabled={funds.length < 2}
          className={cn(
            'h-9 rounded-md border border-border text-foreground text-[13px] font-medium hover:bg-muted/50 active:scale-[0.98] transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent'
          )}
        >
          ↔ Transfer
        </button>
      </div>

      <FormModal open={expenseOpen} onOpenChange={setExpenseOpen} title="Add Expense" subtitle="Record a new expense">
        <ExpenseForm funds={funds} categories={categories} onSuccess={() => setExpenseOpen(false)} onClose={() => setExpenseOpen(false)} />
      </FormModal>

      <FormModal open={addMoneyOpen} onOpenChange={setAddMoneyOpen} title="Add Money" subtitle="Add money to any account">
        <AddMoneyForm funds={funds} sources={sources} goals={goals} onSuccess={() => setAddMoneyOpen(false)} onClose={() => setAddMoneyOpen(false)} />
      </FormModal>

      <FormModal open={transferOpen} onOpenChange={setTransferOpen} title="Transfer" subtitle="Move money between accounts">
        <TransferForm funds={funds} onSuccess={() => setTransferOpen(false)} onClose={() => setTransferOpen(false)} />
      </FormModal>
    </>
  )
}
