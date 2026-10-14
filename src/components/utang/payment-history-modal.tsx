'use client'

import { useState } from 'react'
import { History, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { FormModal } from '@/components/shared/form-modal'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { formatPHP } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { deletePaymentAction } from '@/actions/utang'
import { useAppRefresh } from '@/lib/state/app-refresh'
import { cn } from '@/lib/utils'
import type { UtangWithProgress } from '@/types'

type Props = {
  utang: UtangWithProgress
}

type PaymentItem = UtangWithProgress['payments'][number]

function PaymentRow({ payment, onDelete }: { payment: PaymentItem; onDelete: (id: number) => void }) {
  const { refresh } = useAppRefresh()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function handleDelete() {
    setDeleting(true)
    deletePaymentAction(payment.id).then((result) => {
      setDeleting(false)
      if (!result.success) {
        toast.error(result.error)
      } else {
        toast.success('Payment removed')
        refresh({ type: 'utang-payment', id: payment.id })
        setDeleteOpen(false)
        onDelete(payment.id)
      }
    })
  }

  return (
    <>
      <div className="flex items-start gap-3 py-3">
        {/* Timeline dot */}
        <div className="flex flex-col items-center shrink-0 mt-1">
          <div className="h-2 w-2 rounded-full bg-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{formatPHP(payment.amount)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(payment.date)} · via {payment.fundName ?? 'Unknown'}
              </p>
              {payment.note && (
                <p className="text-xs text-muted-foreground/70 mt-0.5 italic">{payment.note}</p>
              )}
            </div>
            <button
              onClick={() => setDeleteOpen(true)}
              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
              aria-label="Remove payment"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Remove this payment?"
        description="This will restore the fund balance."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}

export function PaymentHistoryModal({ utang }: Props) {
  const [open, setOpen] = useState(false)
  const [payments, setPayments] = useState(utang.payments)

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = Math.max(0, utang.amount - totalPaid)
  const progressPct = utang.amount > 0 ? Math.min(100, Math.round((totalPaid / utang.amount) * 100)) : 0

  function handlePaymentDeleted(paymentId: number) {
    setPayments((prev) => prev.filter((p) => p.id !== paymentId))
  }

  // Sync when utang prop updates (page revalidation)
  const displayPayments = payments.length > 0 ? payments : utang.payments

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto flex items-center justify-center gap-1.5 h-8 px-3 rounded-md border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
      >
        <History className="h-3.5 w-3.5" />
        History
      </button>

      <FormModal
        open={open}
        onOpenChange={setOpen}
        title="Payment History"
        subtitle={`${utang.person} · ${utang.type === 'i_owe' ? 'I owe' : 'Owes me'}`}
      >
        <div className="px-5 md:px-6 pt-5 pb-6 space-y-5">
          {/* Receipt summary */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Original amount</span>
              <span className="font-semibold">{formatPHP(utang.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total paid</span>
              <span className="font-semibold text-primary">{formatPHP(totalPaid)}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Remaining</span>
              <span className={cn('font-bold', remaining === 0 ? 'text-green-600' : 'text-foreground')}>
                {remaining === 0 ? 'Fully paid ✓' : formatPHP(remaining)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn('h-full rounded-full', remaining === 0 ? 'bg-green-500' : 'bg-primary')}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-right">{progressPct}% paid</p>
            </div>
          </div>

          {/* Payment timeline */}
          {displayPayments.length > 0 ? (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1">
                Payments
              </p>
              <div className="relative pl-3.5">
                {/* Vertical line */}
                <div className="absolute left-[3px] top-4 bottom-4 w-px bg-border/60" />

                {displayPayments.map((p) => (
                  <PaymentRow
                    key={p.id}
                    payment={p}
                    onDelete={handlePaymentDeleted}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
            </div>
          )}

          {utang.deadline && (
            <div className="flex justify-between text-xs text-muted-foreground border-t border-border/40 pt-4">
              <span>Deadline</span>
              <span className="font-medium">{formatDate(utang.deadline)}</span>
            </div>
          )}

          {utang.note && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Note</span>
              <span className="font-medium text-right max-w-[60%]">{utang.note}</span>
            </div>
          )}
        </div>
      </FormModal>
    </>
  )
}
