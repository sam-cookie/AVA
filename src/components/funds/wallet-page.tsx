'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { WalletStack } from './wallet-stack'
import { AccountPanel } from './account-panel'
import { AddFundSheet } from './add-fund-sheet'
import { BalanceHeader } from '@/components/shared/balance-header'
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

      {/* ── Two-column layout on desktop ── */}
      <motion.div {...section(0.1)} className="md:grid md:grid-cols-[minmax(0,380px)_1fr] md:items-start md:gap-8 space-y-8 md:space-y-0">

        {/* Left: wallet stack */}
        <div className="space-y-3">
          <div style={{ perspective: '1000px' }}>
            <WalletStack
              funds={funds}
              activeId={activeId}
              onSelect={setActiveId}
            />
          </div>
          {funds.length > 1 && (
            <p className="text-[10px] text-muted-foreground/35 md:hidden">
              Swipe the card to switch accounts
            </p>
          )}
        </div>

        {/* Right: receipt panel */}
        {activeFund && (
          <AccountPanel
            fund={activeFund}
            sources={sources}
            transactions={transactions}
            categories={categories}
            allFunds={funds}
          />
        )}
      </motion.div>

    </div>
  )
}
