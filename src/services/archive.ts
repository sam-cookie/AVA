import { db } from '@/lib/db/client'
import { ensureInitialized } from '@/lib/db/init'
ensureInitialized()
import { funds, transactions, transfers, categories, sources, savingsGoals, utang } from '@/lib/db/schema'
import { lte, isNotNull } from 'drizzle-orm'
import type { ArchiveItem, ArchiveItemType, ServiceResult } from '@/types'
import {
  getFundWithBalanceById,
  restoreFund,
  deleteFundForever,
} from './funds'
import {
  restoreTransaction,
  deleteTransactionForever,
} from './expenses'
import {
  deleteTransferForever,
} from './transfers'
import {
  getArchivedCategories,
  restoreCategory,
  deleteCategoryForever,
} from './categories'
import {
  getArchivedSources,
  restoreSource,
  deleteSourceForever,
} from './sources'
import {
  getArchivedGoals,
  restoreSavingsGoal,
  deleteSavingsGoalForever,
} from './savings-goals'
import {
  getArchivedUtang,
  restoreUtang,
  deleteUtangForever,
} from './utang'
import { getArchivedTransactions } from './transactions'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Automatically and permanently delete items older than 30 days.
 * Executes reliable backend/database queries cascading relationships safely.
 */
export async function purgeExpiredArchiveItems(): Promise<void> {
  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS)

  // 1. Expired funds
  const expiredFunds = await db
    .select({ id: funds.id })
    .from(funds)
    .where(lte(funds.archivedAt, cutoff))
  for (const f of expiredFunds) {
    await deleteFundForever(f.id)
  }

  // 2. Expired transfers
  const expiredTransfers = await db
    .select({ id: transfers.id })
    .from(transfers)
    .where(lte(transfers.archivedAt, cutoff))
  for (const t of expiredTransfers) {
    await deleteTransferForever(t.id)
  }

  // 3. Expired individual transactions
  const expiredTransactions = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(lte(transactions.archivedAt, cutoff))
  for (const tx of expiredTransactions) {
    await deleteTransactionForever(tx.id)
  }

  // 4. Expired savings goals
  const expiredGoals = await db
    .select({ id: savingsGoals.id })
    .from(savingsGoals)
    .where(lte(savingsGoals.archivedAt, cutoff))
  for (const g of expiredGoals) {
    await deleteSavingsGoalForever(g.id)
  }

  // 5. Expired categories
  const expiredCategories = await db
    .select({ id: categories.id })
    .from(categories)
    .where(lte(categories.archivedAt, cutoff))
  for (const c of expiredCategories) {
    await deleteCategoryForever(c.id)
  }

  // 6. Expired sources
  const expiredSources = await db
    .select({ id: sources.id })
    .from(sources)
    .where(lte(sources.archivedAt, cutoff))
  for (const s of expiredSources) {
    await deleteSourceForever(s.id)
  }

  // 7. Expired utang
  const expiredUtang = await db
    .select({ id: utang.id })
    .from(utang)
    .where(lte(utang.archivedAt, cutoff))
  for (const u of expiredUtang) {
    await deleteUtangForever(u.id)
  }
}

/**
 * Get all archived items across all domains with remaining time countdown.
 * Automatically triggers 30-day purge before returning.
 */
export async function getArchivedItems(): Promise<ArchiveItem[]> {
  await purgeExpiredArchiveItems()

  const now = Date.now()

  function buildArchiveItem(
    id: number,
    type: ArchiveItemType,
    title: string,
    archivedAt: Date | null | undefined,
    subtitle?: string | null,
    amount?: number | null,
    metadata?: Record<string, unknown>
  ): ArchiveItem | null {
    if (!archivedAt) return null
    const archivedDate = new Date(archivedAt)
    const expiresAt = new Date(archivedDate.getTime() + THIRTY_DAYS_MS)
    const diffMs = expiresAt.getTime() - now
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)))

    return {
      id,
      type,
      title,
      subtitle: subtitle || null,
      amount: amount ?? null,
      archivedAt: archivedDate,
      daysRemaining,
      expiresAt,
      metadata,
    }
  }

  const items: ArchiveItem[] = []

  // 1. Archived Accounts (Funds)
  const archivedFundsRows = await db
    .select()
    .from(funds)
    .where(isNotNull(funds.archivedAt))

  for (const f of archivedFundsRows) {
    const withBal = await getFundWithBalanceById(f.id)
    const item = buildArchiveItem(
      f.id,
      'account',
      f.name,
      f.archivedAt,
      'Account / Wallet',
      withBal?.balance ?? 0,
      { color: f.color }
    )
    if (item) items.push(item)
  }

  // 2. Archived Transactions
  const archivedTx = await getArchivedTransactions()
  for (const tx of archivedTx) {
    const item = buildArchiveItem(
      tx.id,
      'transaction',
      tx.title || (tx.type === 'expense' ? 'Expense' : 'Income'),
      tx.archivedAt,
      `${tx.type === 'expense' ? 'Expense' : 'Income'} • ${tx.fundName}${tx.category ? ` • ${tx.category}` : ''}`,
      tx.amount,
      { type: tx.type, fundId: tx.fundId, date: tx.date }
    )
    if (item) items.push(item)
  }

  // 3. Archived Savings Goals
  const archivedGoals = await getArchivedGoals()
  for (const g of archivedGoals) {
    const item = buildArchiveItem(
      g.id,
      'savings_goal',
      g.name,
      g.archivedAt,
      `Savings Goal • ${Math.round((g.savedAmount / (g.targetAmount || 1)) * 100)}% saved`,
      g.savedAmount,
      { targetAmount: g.targetAmount }
    )
    if (item) items.push(item)
  }

  // 4. Archived Categories
  const archivedCats = await getArchivedCategories()
  for (const c of archivedCats) {
    const item = buildArchiveItem(
      c.id,
      'category',
      c.name,
      c.archivedAt,
      'Expense Category',
      null,
      { icon: c.icon }
    )
    if (item) items.push(item)
  }

  // 5. Archived Income Sources
  const archivedSrcs = await getArchivedSources()
  for (const s of archivedSrcs) {
    const item = buildArchiveItem(
      s.id,
      'source',
      s.name,
      s.archivedAt,
      'Income Source',
      null
    )
    if (item) items.push(item)
  }

  // 6. Archived Utang
  const archivedUtangList = await getArchivedUtang()
  for (const u of archivedUtangList) {
    const item = buildArchiveItem(
      u.id,
      'utang',
      `${u.type === 'i_owe' ? 'I owe' : 'Owed by'} ${u.person}`,
      u.archivedAt,
      `Utang • ${u.status.toUpperCase()} • Remaining`,
      u.remaining,
      { type: u.type, person: u.person, amount: u.amount }
    )
    if (item) items.push(item)
  }

  // Sort by newest archivedAt
  return items.sort((a, b) => b.archivedAt.getTime() - a.archivedAt.getTime())
}

/**
 * Restore an archived item back to its active state.
 * Cancels pending permanent deletion.
 */
export async function restoreArchiveItem(
  type: ArchiveItemType,
  id: number
): Promise<ServiceResult<void>> {
  switch (type) {
    case 'account':
      return restoreFund(id)
    case 'transaction':
      return restoreTransaction(id)
    case 'savings_goal':
      return restoreSavingsGoal(id)
    case 'category':
      return restoreCategory(id)
    case 'source':
      return restoreSource(id)
    case 'utang':
      return restoreUtang(id)
    default:
      return { success: false, error: 'Unknown item type' }
  }
}

/**
 * Permanently and irreversibly delete an archived item.
 */
export async function deleteArchiveItemForever(
  type: ArchiveItemType,
  id: number
): Promise<ServiceResult<void>> {
  switch (type) {
    case 'account':
      return deleteFundForever(id)
    case 'transaction':
      return deleteTransactionForever(id)
    case 'savings_goal':
      return deleteSavingsGoalForever(id)
    case 'category':
      return deleteCategoryForever(id)
    case 'source':
      return deleteSourceForever(id)
    case 'utang':
      return deleteUtangForever(id)
    default:
      return { success: false, error: 'Unknown item type' }
  }
}
