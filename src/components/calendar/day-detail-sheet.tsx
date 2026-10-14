'use client'
import { useState, useEffect, useCallback } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { formatPHP } from '@/lib/utils/currency'
import { getDayTransactionsAction } from '@/actions/calendar'
import { useAppMutationListener } from '@/lib/state/app-refresh'
import { cn } from '@/lib/utils'
import type { TransactionWithFund, UtangType } from '@/types'

type UtangDue = {
  id: number
  person: string
  type: UtangType
  amount: number
  remaining: number
  deadline: string
}

type Props = {
  date: string
  expenseTotal?: number
  expenseCount?: number
  utangDues: UtangDue[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const day = new Date(y, m - 1, d)
  return `${WEEKDAYS[day.getDay()]}, ${MONTHS[m - 1]} ${d}, ${y}`
}

export function DayDetailSheet({ date, expenseTotal, expenseCount, utangDues, open, onOpenChange }: Props) {
  const [transactions, setTransactions] = useState<TransactionWithFund[]>([])
  const [loading, setLoading] = useState(false)

  const fetchDayTransactions = useCallback(() => {
    if (!open) return
    setLoading(true)
    getDayTransactionsAction(date).then((txs) => {
      setTransactions(txs)
      setLoading(false)
    })
  }, [open, date])

  useEffect(() => {
    fetchDayTransactions()
  }, [fetchDayTransactions])

  // Re-fetch transactions whenever any mutation occurs in the app while sheet is open
  useAppMutationListener(
    useCallback(() => {
      if (open) {
        fetchDayTransactions()
      }
    }, [open, fetchDayTransactions])
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto px-5 pb-8">
        <SheetHeader className="mb-5">
          <SheetTitle className="text-left text-[15px]">{formatDate(date)}</SheetTitle>
          {expenseTotal != null && expenseTotal > 0 && (
            <p className="text-left text-[13px] text-muted-foreground">
              {expenseCount} expense{expenseCount !== 1 ? 's' : ''} · {formatPHP(expenseTotal)} total
            </p>
          )}
        </SheetHeader>

        {utangDues.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-semibold text-muted-foreground/55 uppercase tracking-[0.12em] mb-3">
              Utang Due
            </p>
            <div className="space-y-2">
              {utangDues.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-3 px-4 rounded-lg border border-destructive/15 bg-destructive/5">
                  <div>
                    <p className="text-[13px] font-medium">{u.person}</p>
                    <p className="text-[11px] text-muted-foreground/55 mt-0.5">
                      {u.type === 'i_owe' ? 'I owe' : 'They owe'} · {formatPHP(u.remaining)} remaining
                    </p>
                  </div>
                  <span className={cn('text-[13px] font-semibold tabular-nums ml-4 shrink-0', u.type === 'i_owe' ? 'text-destructive' : 'text-emerald-600')}>
                    {u.type === 'i_owe' ? '−' : '+'}{formatPHP(u.remaining)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-[10px] font-semibold text-muted-foreground/55 uppercase tracking-[0.12em] mb-3">
            Transactions
          </p>
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-muted rounded-lg" />)}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-6 text-center">No transactions on this day</p>
          ) : (
            <div>
              {transactions.map((tx) => {
                const isIncome = tx.type === 'addition' || tx.type === 'transfer_in'
                return (
                  <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">
                        {tx.title ?? tx.category ?? tx.source ?? 'Transaction'}
                      </p>
                      <p className="text-[11px] text-muted-foreground/55 mt-0.5">{tx.fundName}</p>
                    </div>
                    <p className={cn('text-[13px] font-semibold tabular-nums ml-4 shrink-0', isIncome ? 'text-emerald-600' : 'text-foreground')}>
                      {isIncome ? '+' : '−'}{formatPHP(tx.amount)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
