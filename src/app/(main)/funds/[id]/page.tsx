import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getFundWithBalanceById, getFundsWithBalances } from '@/services/funds'
import { getFundTransactionsWithBalance } from '@/services/transactions'
import { getCategories } from '@/services/categories'
import { getAllSources } from '@/services/sources'
import { formatPHP } from '@/lib/utils/currency'
import { AddMoneySheet } from '@/components/funds/add-money-sheet'
import { ArchivedFundBanner } from '@/components/funds/archived-fund-banner'
import { TransactionList } from '@/components/transactions/transaction-list'
import { ChevronLeft, Smartphone, Building2, Leaf, Banknote, CreditCard } from 'lucide-react'

function getBrand(name: string): { bg: string; Icon: React.ElementType } {
  const n = name.toLowerCase()
  if (n.includes('gcash')) return { bg: '#003699', Icon: Smartphone }
  if (n.includes('maya') || n.includes('paymaya')) return { bg: '#004030', Icon: Smartphone }
  if (n.includes('bpi')) return { bg: '#620000', Icon: Building2 }
  if (n.includes('bdo')) return { bg: '#00103a', Icon: Building2 }
  if (n.includes('maribank') || n.includes('mari bank')) return { bg: '#003028', Icon: Leaf }
  if (n.includes('cash') || n.includes('wallet')) return { bg: '#1a1a1a', Icon: Banknote }
  return { bg: '#2D3142', Icon: CreditCard }
}

type Props = { params: Promise<{ id: string }> }

export default async function FundDetailPage({ params }: Props) {
  const { id } = await params
  const fundId = Number(id)

  const [fund, transactions, categories, sources, allFunds] = await Promise.all([
    getFundWithBalanceById(fundId),
    getFundTransactionsWithBalance(fundId),
    getCategories(),
    getAllSources(),
    getFundsWithBalances(),
  ])

  if (!fund) notFound()

  const { bg, Icon } = getBrand(fund.name)
  const isArchived = Boolean(fund.archivedAt)

  return (
    <div className="space-y-8 pb-24 md:pb-8">

      {/* Back link */}
      <Link
        href={isArchived ? '/archive' : '/funds'}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/60 hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {isArchived ? 'Archive' : 'Accounts'}
      </Link>

      {/* Archived banner if account is archived */}
      {isArchived && (
        <ArchivedFundBanner fundId={fund.id} fundName={fund.name} />
      )}

      {/* Fund hero */}
      <div className="flex items-start gap-4">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: bg }}
        >
          <Icon className="h-[16px] w-[16px] text-white" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium text-muted-foreground/65 uppercase tracking-[0.14em]">
            {fund.name} {isArchived && '(Archived)'}
          </p>
          <p className="balance-number text-[38px] md:text-[46px] font-semibold tabular-nums leading-tight mt-1 text-foreground">
            {formatPHP(fund.balance)}
          </p>
        </div>
        {!isArchived && <AddMoneySheet fund={fund} sources={sources} />}
      </div>

      {/* Flat stats */}
      <div className="flex items-start gap-8 border-t border-b border-border/40 py-4">
        <div>
          <p className="text-[10px] font-medium text-muted-foreground/65 uppercase tracking-[0.14em]">Added</p>
          <p className="balance-number text-[18px] font-semibold tabular-nums text-emerald-600 mt-1.5 leading-none">
            +{formatPHP(fund.totalAdded)}
          </p>
        </div>
        <div className="w-px self-stretch bg-border/40" />
        <div>
          <p className="text-[10px] font-medium text-muted-foreground/65 uppercase tracking-[0.14em]">Spent</p>
          <p className="balance-number text-[18px] font-semibold tabular-nums mt-1.5 leading-none text-foreground">
            −{formatPHP(fund.totalSpent)}
          </p>
        </div>
        {(fund.totalTransferIn > 0 || fund.totalTransferOut > 0) && (
          <>
            <div className="w-px self-stretch bg-border/40" />
            <div>
              <p className="text-[10px] font-medium text-muted-foreground/65 uppercase tracking-[0.14em]">Transfers</p>
              <p className="balance-number text-[18px] font-semibold tabular-nums mt-1.5 leading-none text-muted-foreground">
                {fund.totalTransferIn > 0 && `+${formatPHP(fund.totalTransferIn)}`}
                {fund.totalTransferOut > 0 && ` −${formatPHP(fund.totalTransferOut)}`}
              </p>
            </div>
          </>
        )}
      </div>

      {/* History — flat, no card wrapper */}
      <div>
        <p className="text-[10px] font-medium text-muted-foreground/65 uppercase tracking-[0.14em] mb-2">
          History
        </p>
        <div className="border-t border-border/40 -mx-4 px-0 md:-mx-0">
          <TransactionList
            transactions={transactions}
            categories={categories}
            funds={allFunds}
            sources={sources}
            emptyMessage={isArchived ? 'No transactions recorded for this archived account.' : 'No activity yet. Add money to get started.'}
          />
        </div>
      </div>
    </div>
  )
}
