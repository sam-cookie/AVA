'use client'

import Link from 'next/link'
import { formatPHP } from '@/lib/utils/currency'
import { AddMoneySheet } from './add-money-sheet'
import { FundContextMenu } from './fund-context-menu'
import type { FundWithBalance, IncomeSource, TransactionWithFund, Category } from '@/types'
import { ActivityRow } from '@/components/transactions/activity-row'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

function groupByDate(txs: TransactionWithFund[]) {
  const groups = new Map<string, TransactionWithFund[]>()
  for (const tx of txs) {
    const existing = groups.get(tx.date) ?? []
    existing.push(tx)
    groups.set(tx.date, existing)
  }
  return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a))
}

function formatGroupDate(dateStr: string): string {
  const today = new Date().toLocaleDateString('en-CA')
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA')
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-PH', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function Tear() {
  return <div className="border-t border-dashed border-border/40" />
}

type Props = {
  fund: FundWithBalance
  sources: IncomeSource[]
  transactions: TransactionWithFund[]
  categories: Category[]
  allFunds: FundWithBalance[]
}

export function AccountPanel({ fund, sources, transactions, categories, allFunds }: Props) {
  const fundTxs = transactions
    .filter((tx) => tx.fundId === fund.id && tx.type !== 'transfer_in')
    .slice(0, 30)

  const groups = groupByDate(fundTxs)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={fund.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full min-w-0"
      >
        <div className="bg-[#F9F8F5] dark:bg-[#111110] border border-border/30 rounded-xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.05)] w-full">

          {/* ── Merchant header ── */}
          <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[8px] font-bold tracking-[0.3em] uppercase text-muted-foreground/45">
                Account
              </p>
              <p
                title={fund.name}
                className="text-[19px] font-bold text-foreground mt-0.5 leading-tight tracking-tight truncate"
              >
                {fund.name}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0 pt-0.5">
              <AddMoneySheet fund={fund} sources={sources} />
              <FundContextMenu fund={fund} />
            </div>
          </div>

          <Tear />

          {/* ── Balance ── */}
          <div className="px-5 py-4 flex items-baseline justify-between gap-4">
            <p className="text-[8px] font-bold tracking-[0.26em] uppercase text-muted-foreground/45 shrink-0">
              Balance
            </p>
            <p className="balance-number text-[26px] sm:text-[28px] font-bold text-foreground tabular-nums leading-none truncate">
              {formatPHP(fund.balance)}
            </p>
          </div>

          {/* ── Stats ── */}
          {(fund.totalAdded > 0 || fund.totalSpent > 0) && (
            <>
              <Tear />
              <div className="px-5 py-3.5 space-y-2.5">
                {fund.totalAdded > 0 && (
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[8px] font-bold tracking-[0.26em] uppercase text-muted-foreground/45 shrink-0">
                      Received
                    </p>
                    <p className="balance-number text-[13px] font-semibold text-emerald-600 tabular-nums truncate">
                      +{formatPHP(fund.totalAdded)}
                    </p>
                  </div>
                )}
                {fund.totalSpent > 0 && (
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[8px] font-bold tracking-[0.26em] uppercase text-muted-foreground/45 shrink-0">
                      Spent
                    </p>
                    <p className="balance-number text-[13px] font-semibold text-muted-foreground tabular-nums truncate">
                      −{formatPHP(fund.totalSpent)}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          <Tear />

          {/* ── Activity ── */}
          <div className="px-5 pt-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[8px] font-bold tracking-[0.3em] uppercase text-muted-foreground/45">
                Recent Activity
              </p>
              {fundTxs.length > 0 && (
                <span className="text-[9px] font-medium text-muted-foreground/40 tabular-nums">
                  {fundTxs.length} transaction{fundTxs.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {fundTxs.length === 0 ? (
              <p className="text-[11px] text-muted-foreground/40 text-center py-8 tracking-wide">
                — no transactions yet —
              </p>
            ) : (
              <div className="max-h-[480px] overflow-y-auto overscroll-contain pr-1 scrollbar-thin">
                {groups.map(([date, txs]) => (
                  <div key={date} className="mb-2 last:mb-0">
                    <p className="text-[7.5px] font-bold tracking-[0.24em] uppercase text-muted-foreground/35 pt-2 pb-1 border-b border-dashed border-border/25 mb-0.5">
                      {formatGroupDate(date)}
                    </p>
                    {txs.map((tx) => (
                      <ActivityRow
                        key={tx.id}
                        tx={tx}
                        categories={categories}
                        funds={allFunds}
                        sources={sources}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {fundTxs.length > 0 && (
              <div className="pt-3 mt-1 border-t border-dashed border-border/25 flex justify-end">
                <Link
                  href={`/funds/${fund.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  View full history
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>

          {/* ── Bottom tear ── */}
          <div className="border-t-2 border-dashed border-border/25 h-4 bg-[#F0EFEb] dark:bg-[#0C0C0B]" />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
