'use client'

import { FormModal } from '@/components/shared/form-modal'
import { AddMoneyForm } from './add-money-form'
import type { FundWithBalance, IncomeSource, Transaction } from '@/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction
  funds: FundWithBalance[]
  sources: IncomeSource[]
}

export function EditAdditionSheet({ open, onOpenChange, transaction, funds, sources }: Props) {
  return (
    <FormModal open={open} onOpenChange={onOpenChange} title="Edit Income Entry" subtitle="Update this income entry">
      <AddMoneyForm
        funds={funds}
        sources={sources}
        initialData={transaction}
        transactionId={transaction.id}
        onSuccess={() => onOpenChange(false)}
        onClose={() => onOpenChange(false)}
      />
    </FormModal>
  )
}
