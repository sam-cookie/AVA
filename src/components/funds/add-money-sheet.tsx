'use client'

import { useState } from 'react'
import { FormModal } from '@/components/shared/form-modal'
import { AddMoneyForm } from './add-money-form'
import { Button } from '@/components/ui/button'
import type { FundWithBalance, IncomeSource } from '@/types'
import { Plus } from 'lucide-react'

type Props = {
  fund: FundWithBalance
  sources: IncomeSource[]
}

export function AddMoneySheet({ fund, sources }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 h-8 px-3 text-xs"
      >
        <Plus className="h-3.5 w-3.5" />
        Add
      </Button>
      <FormModal
        open={open}
        onOpenChange={setOpen}
        title="Add Money"
        subtitle={`Adding to ${fund.name}`}
      >
        <AddMoneyForm
          fund={fund}
          sources={sources}
          onSuccess={() => setOpen(false)}
          onClose={() => setOpen(false)}
        />
      </FormModal>
    </>
  )
}
