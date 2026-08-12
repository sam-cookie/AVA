'use client'

import { useState } from 'react'
import { FormModal } from '@/components/shared/form-modal'
import { TransferForm } from './transfer-form'
import { Button } from '@/components/ui/button'
import type { FundWithBalance } from '@/types'
import { ArrowLeftRight } from 'lucide-react'

type Props = {
  funds: FundWithBalance[]
}

export function TransferSheet({ funds }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 w-full"
      >
        <ArrowLeftRight className="h-4 w-4" />
        Transfer between accounts
      </Button>
      <FormModal
        open={open}
        onOpenChange={setOpen}
        title="Transfer"
        subtitle="Move money between accounts"
      >
        <TransferForm
          funds={funds}
          onSuccess={() => setOpen(false)}
          onClose={() => setOpen(false)}
        />
      </FormModal>
    </>
  )
}
