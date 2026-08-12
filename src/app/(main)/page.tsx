import { getFundsWithBalances, getTotalBalance } from '@/services/funds'
import { getTransactions } from '@/services/transactions'
import { getCategories } from '@/services/categories'
import { getAllSources } from '@/services/sources'
import { getAllGoals } from '@/services/savings-goals'
import { BalanceHeader } from '@/components/shared/balance-header'
import { FundCardDeck } from '@/components/funds/fund-card-deck'
import { FundCardStack } from '@/components/funds/fund-card-stack'
import { FundCardMini } from '@/components/funds/fund-card-mini'
import { SpendingHeader } from '@/components/dashboard/spending-header'
import { QuickActions } from '@/components/shared/quick-actions'
import { SavingsPreview } from '@/components/savings/savings-preview'
import { FadeIn } from '@/components/shared/fade-in'
import { Suspense } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'

export default async function DashboardPage() {
  const year = new Date().getFullYear()
  const [funds, totalBalance, categories, sources, txs, goals] = await Promise.all([
    getFundsWithBalances(),
    getTotalBalance(),
    getCategories(),
    getAllSources(),
    getTransactions({ dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` }, 1000, 0),
    getAllGoals(),
  ])

  const totalReceived = funds.reduce((s, f) => s + f.totalAdded, 0)
  const totalSpent = funds.reduce((s, f) => s + f.totalSpent, 0)

  return (
    <div className="space-y-8 pb-6">

      {/* ── Balance hero + fund cards ── */}
      <FadeIn>
        <div className="space-y-5">

          {/* Mobile header */}
          <div className="flex items-center justify-between md:hidden">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
              <span className="text-xs font-bold text-primary">A</span>
            </div>
            <span className="text-[15px] font-bold tracking-tight select-none">
              ava<span className="text-primary">.</span>
            </span>
            <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <BalanceHeader
            label="Total Balance"
            total={totalBalance}
            received={totalReceived}
            spent={totalSpent}
            subtext={funds.length > 0 ? `${funds.length} account${funds.length !== 1 ? 's' : ''} · Updated just now` : 'Updated just now'}
          />

          {/* Fund cards — mobile: always scrollable row */}
          {funds.length > 0 && (
            <div className="md:hidden">
              <FundCardStack funds={funds} />
            </div>
          )}

          {/* Fund cards — desktop: row when <5, stacked deck when >=5 */}
          {funds.length > 0 && (
            <div className="hidden md:block">
              {funds.length >= 5 ? (
                <div className="overflow-x-auto pb-2 scrollbar-none">
                  <FundCardDeck funds={funds} />
                </div>
              ) : (
                <div className="flex gap-3.5">
                  {funds.map((fund, i) => (
                    <div key={fund.id} className="flex-1" style={{ height: 130 }}>
                      <FundCardMini fund={fund} index={i} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {funds.length === 0 && (
            <p className="text-sm text-muted-foreground text-center md:text-left">
              No accounts yet.{' '}
              <Link href="/funds" className="text-primary font-medium underline underline-offset-2">
                Add your first account
              </Link>{' '}
              to get started.
            </p>
          )}
        </div>
      </FadeIn>

      {/* ── Quick actions ── */}
      <FadeIn delay={0.09}>
        <Suspense>
          <QuickActions funds={funds} categories={categories} sources={sources} goals={goals} />
        </Suspense>
      </FadeIn>

      {/* ── Savings Goals preview ── */}
      <FadeIn delay={0.16}>
        <SavingsPreview goals={goals} />
      </FadeIn>

      {/* ── Period-aware activity ── */}
      <FadeIn delay={0.23}>
        <SpendingHeader
          transactions={txs}
          funds={funds}
          categories={categories}
          sources={sources}
        />
      </FadeIn>

    </div>
  )
}
