'use client'

import { useState } from 'react'
import { MoreHorizontal, Trash2, Pencil, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { formatPHP } from '@/lib/utils/currency'
import { formatShortDate } from '@/lib/utils/date'
import { cn } from '@/lib/utils'
import type { Category, FundWithBalance, IncomeSource, TransactionWithFund } from '@/types'
import { CategoryIcon } from '@/components/categories/category-icon'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EditExpenseSheet } from '@/components/expenses/edit-expense-sheet'
import { EditAdditionSheet } from '@/components/funds/edit-addition-sheet'
import { EditTransferSheet } from '@/components/transfers/edit-transfer-sheet'
import { deleteExpenseAction, deleteAdditionAction } from '@/actions/expenses'
import { deleteTransferAction } from '@/actions/transfers'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Props = {
  tx: TransactionWithFund
  categories?: Category[]
  funds?: FundWithBalance[]
  sources?: IncomeSource[]
}

function typeSign(type: string) {
  return type === 'addition' || type === 'transfer_in' ? 1 : -1
}


export function ActivityRow({ tx, categories = [], funds = [], sources = [] }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const sign = typeSign(tx.type)
  const isTransfer = tx.type === 'transfer_in' || tx.type === 'transfer_out'
  const canDelete = !isTransfer || tx.type === 'transfer_out'
  const canEdit = tx.type === 'expense' || tx.type === 'addition' || tx.type === 'transfer_out'
  const catDef = categories.find((c) => c.name === tx.category)

  const primaryLabel =
    tx.type === 'expense'
      ? (tx.title ?? tx.category ?? 'Expense')
      : tx.type === 'addition'
      ? (tx.source ?? `Added to ${tx.fundName}`)
      : tx.type === 'transfer_out'
      ? (tx.relatedFundName ? `${tx.fundName} → ${tx.relatedFundName}` : 'Transfer')
      : (tx.relatedFundName ? `From ${tx.relatedFundName}` : 'Transfer')

  const secondaryLabel =
    tx.type === 'expense'
      ? (tx.category ? `${tx.category} · ${tx.fundName}` : tx.fundName)
      : tx.type === 'addition'
      ? tx.fundName
      : isTransfer
      ? 'Transfer'
      : ''

  async function handleDelete() {
    setDeleting(true)
    let result
    if (tx.type === 'expense') result = await deleteExpenseAction(tx.id)
    else if (tx.type === 'addition') result = await deleteAdditionAction(tx.id)
    else if (tx.type === 'transfer_out' && tx.transferId) result = await deleteTransferAction(tx.transferId)
    else { setDeleting(false); return }
    if (result.success) toast.success('Deleted')
    else toast.error(result.error)
    setDeleting(false)
    setConfirmOpen(false)
  }

  return (
    <>
      <div className={cn('group flex items-center gap-3 py-3', deleting && 'opacity-40 pointer-events-none')}>
        {/* Icon */}
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          {isTransfer ? (
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
          ) : catDef ? (
            <CategoryIcon name={catDef.icon} className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <CategoryIcon name="circle" className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>

        {/* Label + secondary */}
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-medium text-foreground leading-tight truncate">{primaryLabel}</p>
          {secondaryLabel && (
            <p className="text-[11px] text-muted-foreground/55 mt-0.5 truncate">{secondaryLabel}</p>
          )}
        </div>

        {/* Date + amount (right-aligned stack) */}
        <div className="shrink-0 text-right">
          <p className={cn(
            'text-[13.5px] font-semibold tabular-nums',
            sign > 0 ? 'text-emerald-600' : 'text-foreground'
          )}>
            {sign > 0 ? '+' : '−'}{formatPHP(tx.amount)}
          </p>
          <p className="text-[11px] text-muted-foreground/50 mt-0.5">{formatShortDate(tx.date)}</p>
        </div>

        {(canEdit || canDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground/35 hover:text-foreground hover:bg-muted transition-colors shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onClick={() => setTimeout(() => setEditOpen(true), 0)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setTimeout(() => setConfirmOpen(true), 0)}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isTransfer ? 'Delete' : tx.type === 'addition' ? 'Delete' : 'Delete'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Are you sure?"
        description="This action cannot be undone."
        onConfirm={handleDelete}
        loading={deleting}
      />
      {editOpen && tx.type === 'expense' && (
        <EditExpenseSheet open={editOpen} onOpenChange={setEditOpen} transaction={tx} funds={funds} categories={categories} />
      )}
      {editOpen && tx.type === 'addition' && (
        <EditAdditionSheet open={editOpen} onOpenChange={setEditOpen} transaction={tx} funds={funds} sources={sources} />
      )}
      {editOpen && tx.type === 'transfer_out' && (
        <EditTransferSheet open={editOpen} onOpenChange={setEditOpen} transaction={tx} />
      )}
    </>
  )
}
