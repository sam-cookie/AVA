import { getFundsWithBalances } from '@/services/funds'
import { getTransactions } from '@/services/transactions'
import { getCategories } from '@/services/categories'
import { getAllSources } from '@/services/sources'
import { WalletPage } from '@/components/funds/wallet-page'

export default async function FundsPage() {
  const [funds, sources, categories, transactions] = await Promise.all([
    getFundsWithBalances(),
    getAllSources(),
    getCategories(),
    getTransactions({}, 500),
  ])

  return (
    <WalletPage
      funds={funds}
      sources={sources}
      categories={categories}
      transactions={transactions}
    />
  )
}
