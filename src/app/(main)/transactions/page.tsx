export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { getFundsWithBalances } from '@/services/funds'
import { getTransactions } from '@/services/transactions'
import { getCategories } from '@/services/categories'
import { getAllSources } from '@/services/sources'
import { ExpenseBrowser } from '@/components/expenses/expense-browser'
import { ExpenseSheet } from '@/components/expenses/expense-sheet'
import { FadeIn } from '@/components/shared/fade-in'

export default async function ExpensesPage() {
  const year = new Date().getFullYear()

  const [funds, categories, sources, expenses] = await Promise.all([
    getFundsWithBalances(),
    getCategories(),
    getAllSources(),
    getTransactions(
      { type: 'expense', dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` },
      1000,
      0,
    ),
  ])

  return (
    <div className="space-y-7 pb-24 md:pb-8">
      <FadeIn>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/65 uppercase tracking-[0.14em] mb-2.5">
              Expenses
            </p>
            <p className="text-[22px] font-semibold leading-none text-foreground">
              {year}
            </p>
          </div>
          <ExpenseSheet funds={funds} categories={categories} />
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Suspense>
          <ExpenseBrowser
            transactions={expenses}
            funds={funds}
            categories={categories}
            sources={sources}
          />
        </Suspense>
      </FadeIn>
    </div>
  )
}
