'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2, Pencil, CreditCard, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPHP } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { deleteUtangAction } from '@/actions/utang'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { UtangFormModal } from './utang-form-modal'
import { PaymentModal } from './payment-modal'
import { PaymentHistoryModal } from './payment-history-modal'
import { useAppRefresh } from '@/lib/state/app-refresh'
import type { UtangWithProgress, FundWithBalance } from '@/types'

type Props = {
  utang: UtangWithProgress
  funds: FundWithBalance[]
}

function DeadlineChip({ deadline }: { deadline: string }) {
  const today = new Date().toISOString().slice(0, 10)
  const sevenDaysLater = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  const overdue = deadline < today
  const soon = !overdue && deadline <= sevenDaysLater

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold',
        overdue
          ? 'bg-destructive/10 text-destructive'
          : soon
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-muted text-muted-foreground'
      )}
    >
      {overdue ? 'Overdue · ' : 'Due '}{formatDate(deadline)}
    </span>
  )
}

function StatusBadge({ status }: { status: UtangWithProgress['status'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide',
        status === 'paid'
          ? 'bg-green-100 text-green-700'
          : status === 'partial'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-muted text-muted-foreground'
      )}
    >
      {status === 'paid' ? 'Settled' : status === 'partial' ? 'Partial' : 'Unpaid'}
    </span>
  )
}

export function UtangCard({ utang, funds }: Props) {
  const { refresh } = useAppRefresh()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, startDelete] = useTransition()

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteUtangAction(utang.id)
      if (!result.success) {
        toast.error(result.error)
      } else {
        toast.success('Deleted')
        refresh({ type: 'utang', id: utang.id })
        setDeleteOpen(false)
      }
    })
  }

  const isPaid = utang.status === 'paid'
  const progressPct = utang.amount > 0
    ? Math.min(100, Math.round((utang.totalPaid / utang.amount) * 100))
    : 0

  return (
    <>
      <div className={cn('rounded-xl border border-border bg-card p-4 space-y-3 overflow-hidden', isPaid && 'opacity-60')}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                {utang.type === 'i_owe' ? 'I owe' : 'Owes me'}
              </span>
              <StatusBadge status={utang.status} />
            </div>
            <p className="text-base font-bold text-foreground mt-0.5 truncate">{utang.person}</p>
          </div>
          <div className="text-right shrink-0">
            <p className={cn("text-base font-bold", isPaid ? "text-green-600 line-through opacity-70" : "text-foreground")}>
              {formatPHP(utang.remaining)}
            </p>
            {utang.totalPaid > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                of {formatPHP(utang.amount)}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar — only shown once there's been at least one payment */}
        {utang.totalPaid > 0 && (
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', isPaid ? 'bg-green-500' : 'bg-primary')}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}

        {/* Deadline + note */}
        {(utang.deadline || utang.note) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {utang.deadline && <DeadlineChip deadline={utang.deadline} />}
            {utang.note && (
              <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">{utang.note}</span>
            )}
          </div>
        )}

        {/* Latest payment preview */}
        {utang.payments.length > 0 && (
          <div className="border-t border-border/40 pt-2.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Last payment · {formatDate(utang.payments[0].date)}</span>
              <span className="font-medium text-foreground">{formatPHP(utang.payments[0].amount)}</span>
            </div>
            {utang.payments.length > 1 && (
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                +{utang.payments.length - 1} more payment{utang.payments.length > 2 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className={cn(
          'flex flex-col sm:flex-row items-stretch sm:items-center gap-2',
          (utang.totalPaid > 0 || utang.deadline || utang.note) ? 'pt-2.5 border-t border-border/40' : 'pt-0'
        )}>
          {!isPaid && (
            <div className="w-full sm:flex-1">
              <PaymentModal
                utang={utang}
                funds={funds}
                trigger={
                  <button className="w-full flex items-center justify-center gap-1.5 h-8 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
                    {utang.type === 'i_owe'
                      ? <CreditCard className="h-3.5 w-3.5" />
                      : <Plus className="h-3.5 w-3.5" />}
                    {utang.type === 'i_owe' ? 'Pay' : 'Add money'}
                  </button>
                }
              />
            </div>
          )}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial">
              <PaymentHistoryModal utang={utang} />
            </div>
            <div className="flex-1 sm:flex-initial">
              <UtangFormModal
                utang={utang}
                funds={funds}
                trigger={
                  <button className="w-full flex items-center justify-center gap-1.5 h-8 px-3 rounded-md border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                }
              />
            </div>
            <button
              onClick={() => setDeleteOpen(true)}
              className="flex items-center justify-center h-8 px-3 rounded-md border border-border text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors shrink-0"
              aria-label="Delete utang"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete utang with ${utang.person}?`}
        description="All payments linked to this entry will also be deleted."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}
