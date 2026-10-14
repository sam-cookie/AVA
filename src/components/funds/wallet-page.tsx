'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { WalletStack } from './wallet-stack'
import { AccountPanel } from './account-panel'
import { AddFundSheet } from './add-fund-sheet'
import { BalanceHeader } from '@/components/shared/balance-header'
import { formatPHP } from '@/lib/utils/currency'
import { cn } from '@/lib/utils'
import type { FundWithBalance, IncomeSource, TransactionWithFund, Category } from '@/types'

const ease = [0.16, 1, 0.3, 1] as const
function section(delay: number) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease, delay },
  }
}

type Props = {
  funds: FundWithBalance[]
  sources: IncomeSource[]
  transactions: TransactionWithFund[]
  categories: Category[]
}

export function WalletPage({ funds, sources, transactions, categories }: Props) {
  const [activeId, setActiveId] = useState<number | null>(funds[0]?.id ?? null)

  useEffect(() => {
    if (activeId !== null && !funds.some((f) => f.id === activeId)) {
      setActiveId(funds[0]?.id ?? null)
    } else if (activeId === null && funds.length > 0) {
      setActiveId(funds[0].id)
    }
  }, [funds, activeId])

  const activeFund = funds.find((f) => f.id === activeId) ?? funds[0] ?? null
  const totalBalance = funds.reduce((s, f) => s + f.balance, 0)
  const totalReceived = funds.reduce((s, f) => s + f.totalAdded, 0)
  const totalSpent = funds.reduce((s, f) => s + f.totalSpent, 0)

  if (funds.length === 0) {
    return (
      <div className="space-y-8 pb-24 md:pb-8">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground/65 uppercase tracking-[0.14em] mb-2.5">
            My Accounts
          </p>
          <h1 className="text-2xl font-bold text-foreground">No accounts yet</h1>
        </div>
        <div className="flex flex-col items-center justify-center border border-dashed border-border/60 rounded-2xl py-20 gap-4">
          <p className="text-sm text-muted-foreground text-center max-w-[280px]">
            Add your first account — GCash, BPI, BDO, Cash, or any wallet.
          </p>
          <AddFundSheet />
        </div>
      </div>
    )
  }

  return (
    <div className="pb-24 md:pb-8 space-y-6">

      {/* ── Header ── */}
      <motion.div {...section(0)} className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <BalanceHeader
            label="My Accounts"
            total={totalBalance}
            received={totalReceived}
            spent={totalSpent}
            subtext={`Total across ${funds.length} account${funds.length !== 1 ? 's' : ''}`}
          />
        </div>
        <div className="pt-0.5">
          <AddFundSheet />
        </div>
      </motion.div>

      {/* ── Two-column layout on desktop (lg+), stacked on mobile/tablet ── */}
      <motion.div
        {...section(0.1)}
        className="flex flex-col lg:flex-row items-stretch lg:items-start gap-8"
      >
        {/* Left: wallet stack (stable width, shrink-0, sticky on desktop) */}
        <div className="w-full lg:w-[350px] xl:w-[380px] shrink-0 lg:sticky lg:top-8 self-start space-y-3">
          {funds.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none lg:hidden">
              {funds.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveId(f.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5',
                    f.id === activeFund?.id
                      ? 'bg-foreground text-background font-semibold shadow-xs'
                      : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <span>{f.name}</span>
                  <span className={cn(
                    'tabular-nums text-[11px] font-semibold',
                    f.id === activeFund?.id ? 'text-background/80' : 'text-foreground/75'
                  )}>
                    {formatPHP(f.balance)}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div style={{ perspective: '1000px' }} className="w-full max-w-[400px] mx-auto lg:mx-0">
            <WalletStack
              funds={funds}
              activeId={activeId}
              onSelect={setActiveId}
            />
          </div>

          {funds.length > 1 && (
            <p className="text-[10.5px] text-muted-foreground/45 text-center lg:text-left">
              <span className="lg:hidden">Tap any card or swipe to switch accounts</span>
              <span className="hidden lg:inline">Click any card behind to view its details</span>
            </p>
          )}
        </div>

        {/* Right: receipt panel (flex-1 with min-w-0 to prevent layout blowout) */}
        {activeFund && (
          <div className="flex-1 min-w-0 max-w-2xl w-full">
            <AccountPanel
              fund={activeFund}
              sources={sources}
              transactions={transactions}
              categories={categories}
              allFunds={funds}
            />
          </div>
        )}
      </motion.div>

    </div>
  )
}
