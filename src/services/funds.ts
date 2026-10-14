import { db } from '@/lib/db/client'
import { ensureInitialized } from '@/lib/db/init'
ensureInitialized()
import { funds, transactions, transfers, goalContributions, utangPayments, utang } from '@/lib/db/schema'
import { and, eq, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm'
import type { Fund, FundWithBalance, ServiceResult } from '@/types'
import { toCentavos } from '@/lib/utils/currency'

let fundsCache: { data: FundWithBalance[]; expiresAt: number } | null = null

export function invalidateFundsCache() {
  fundsCache = null
}

/** Get all active funds with their computed balances and summaries */
export async function getFundsWithBalances(): Promise<FundWithBalance[]> {
  const now = Date.now()
  if (fundsCache && fundsCache.expiresAt > now) {
    return fundsCache.data
  }

  const rows = await db
    .select({
      id: funds.id,
      name: funds.name,
      color: funds.color,
      archivedAt: funds.archivedAt,
      createdAt: funds.createdAt,
      balance: sql<number>`
        COALESCE(SUM(CASE
          WHEN ${transactions.archivedAt} IS NULL AND ${transactions.type} IN ('addition', 'transfer_in') THEN ${transactions.amount}
          WHEN ${transactions.archivedAt} IS NULL THEN -${transactions.amount}
          ELSE 0
        END), 0)
      `,
      totalAdded: sql<number>`
        COALESCE(SUM(CASE WHEN ${transactions.archivedAt} IS NULL AND ${transactions.type} = 'addition' THEN ${transactions.amount} ELSE 0 END), 0)
      `,
      totalSpent: sql<number>`
        COALESCE(SUM(CASE WHEN ${transactions.archivedAt} IS NULL AND ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)
      `,
      totalTransferIn: sql<number>`
        COALESCE(SUM(CASE WHEN ${transactions.archivedAt} IS NULL AND ${transactions.type} = 'transfer_in' THEN ${transactions.amount} ELSE 0 END), 0)
      `,
      totalTransferOut: sql<number>`
        COALESCE(SUM(CASE WHEN ${transactions.archivedAt} IS NULL AND ${transactions.type} = 'transfer_out' THEN ${transactions.amount} ELSE 0 END), 0)
      `,
    })
    .from(funds)
    .leftJoin(transactions, eq(transactions.fundId, funds.id))
    .where(isNull(funds.archivedAt))
    .groupBy(funds.id)

  fundsCache = { data: rows, expiresAt: now + 30000 }
  return rows
}

/** Get a single fund with its balance — efficient single-fund query */
export async function getFundWithBalance(fundId: number): Promise<FundWithBalance | null> {
  return getFundWithBalanceById(fundId)
}

export async function getFundWithBalanceById(fundId: number): Promise<FundWithBalance | null> {
  const rows = await db
    .select({
      id: funds.id,
      name: funds.name,
      color: funds.color,
      archivedAt: funds.archivedAt,
      createdAt: funds.createdAt,
      balance: sql<number>`
        COALESCE(SUM(CASE
          WHEN ${transactions.archivedAt} IS NULL AND ${transactions.type} IN ('addition', 'transfer_in') THEN ${transactions.amount}
          WHEN ${transactions.archivedAt} IS NULL THEN -${transactions.amount}
          ELSE 0
        END), 0)
      `,
      totalAdded: sql<number>`
        COALESCE(SUM(CASE WHEN ${transactions.archivedAt} IS NULL AND ${transactions.type} = 'addition' THEN ${transactions.amount} ELSE 0 END), 0)
      `,
      totalSpent: sql<number>`
        COALESCE(SUM(CASE WHEN ${transactions.archivedAt} IS NULL AND ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)
      `,
      totalTransferIn: sql<number>`
        COALESCE(SUM(CASE WHEN ${transactions.archivedAt} IS NULL AND ${transactions.type} = 'transfer_in' THEN ${transactions.amount} ELSE 0 END), 0)
      `,
      totalTransferOut: sql<number>`
        COALESCE(SUM(CASE WHEN ${transactions.archivedAt} IS NULL AND ${transactions.type} = 'transfer_out' THEN ${transactions.amount} ELSE 0 END), 0)
      `,
    })
    .from(funds)
    .leftJoin(transactions, eq(transactions.fundId, funds.id))
    .where(eq(funds.id, fundId))
    .groupBy(funds.id)

  return rows[0] ?? null
}

/** Get total balance across all active funds */
export async function getTotalBalance(): Promise<number> {
  const result = await db
    .select({
      total: sql<number>`
        COALESCE(SUM(CASE
          WHEN ${transactions.type} IN ('addition', 'transfer_in') THEN ${transactions.amount}
          ELSE -${transactions.amount}
        END), 0)
      `,
    })
    .from(transactions)
    .innerJoin(funds, eq(funds.id, transactions.fundId))
    .where(and(isNull(funds.archivedAt), isNull(transactions.archivedAt)))

  return result[0]?.total ?? 0
}

/** Get fund balance as a centavo integer */
export async function getFundBalance(fundId: number): Promise<number> {
  const result = await db
    .select({
      balance: sql<number>`
        COALESCE(SUM(CASE
          WHEN ${transactions.type} IN ('addition', 'transfer_in') THEN ${transactions.amount}
          ELSE -${transactions.amount}
        END), 0)
      `,
    })
    .from(transactions)
    .where(and(eq(transactions.fundId, fundId), isNull(transactions.archivedAt)))

  return result[0]?.balance ?? 0
}

/** Add money to a fund */
export async function addMoneyToFund(input: {
  fundId: number
  amountRaw: string
  source: string
  date: string
  note?: string
}): Promise<ServiceResult<{ transactionId: number }>> {
  const amount = toCentavos(input.amountRaw)
  if (amount <= 0) {
    return { success: false, error: 'Amount must be greater than zero' }
  }

  const fund = await db.select().from(funds).where(eq(funds.id, input.fundId)).get()
  if (!fund) {
    return { success: false, error: 'Account not found' }
  }
  if (fund.archivedAt) {
    return { success: false, error: 'Cannot add money to an archived account' }
  }

  invalidateFundsCache()
  const result = await db
    .insert(transactions)
    .values({
      fundId: input.fundId,
      type: 'addition',
      amount,
      source: input.source,
      date: input.date,
      note: input.note || null,
      createdAt: new Date(),
    })
    .returning({ id: transactions.id })

  return { success: true, data: { transactionId: result[0].id } }
}

/** Create a new user-defined wallet fund */
export async function createFund(name: string, color?: string | null): Promise<ServiceResult<Fund>> {
  invalidateFundsCache()
  const result = await db
    .insert(funds)
    .values({ name, color: color ?? null, createdAt: new Date() })
    .returning()

  const f = result[0]
  return {
    success: true,
    data: {
      id: f.id,
      name: f.name,
      color: f.color,
      archivedAt: f.archivedAt,
      createdAt: f.createdAt,
    },
  }
}

/** Rename an existing fund */
export async function renameFund(fundId: number, name: string): Promise<ServiceResult<void>> {
  invalidateFundsCache()
  const fund = await db.select().from(funds).where(eq(funds.id, fundId)).get()
  if (!fund) return { success: false, error: 'Account not found' }

  await db.update(funds).set({ name }).where(eq(funds.id, fundId))
  return { success: true, data: undefined }
}

/** Soft-delete (archive) a fund — preserves transactions and history */
export async function deleteFund(fundId: number): Promise<ServiceResult<void>> {
  invalidateFundsCache()
  const fund = await db.select().from(funds).where(eq(funds.id, fundId)).get()
  if (!fund) return { success: false, error: 'Account not found' }

  await db.update(funds).set({ archivedAt: new Date() }).where(eq(funds.id, fundId))
  return { success: true, data: undefined }
}

/** Restore a previously archived fund */
export async function restoreFund(fundId: number): Promise<ServiceResult<void>> {
  invalidateFundsCache()
  const fund = await db.select().from(funds).where(eq(funds.id, fundId)).get()
  if (!fund) return { success: false, error: 'Account not found' }

  await db.update(funds).set({ archivedAt: null }).where(eq(funds.id, fundId))
  return { success: true, data: undefined }
}

/** Permanently delete a fund and its related records (irreversible) */
export async function deleteFundForever(fundId: number): Promise<ServiceResult<void>> {
  invalidateFundsCache()
  const fund = await db.select().from(funds).where(eq(funds.id, fundId)).get()
  if (!fund) return { success: false, error: 'Account not found' }

  await db.transaction(async (tx) => {
    // 1. Delete goal contributions associated with this fund
    await tx.delete(goalContributions).where(eq(goalContributions.fundId, fundId))

    // 2. Delete utang payments linked to this fund
    await tx.delete(utangPayments).where(eq(utangPayments.fundId, fundId))

    // 3. Clear fund references in utang records
    await tx.update(utang).set({ fundId: null }).where(eq(utang.fundId, fundId))

    // 4. Find transfers where this fund is source or destination
    const relatedTransfers = await tx
      .select({ id: transfers.id })
      .from(transfers)
      .where(or(eq(transfers.fromFundId, fundId), eq(transfers.toFundId, fundId)))

    if (relatedTransfers.length > 0) {
      const transferIds = relatedTransfers.map((t) => t.id)
      // Delete transfer transactions
      await tx.delete(transactions).where(inArray(transactions.transferId, transferIds))
      // Delete transfers
      await tx.delete(transfers).where(inArray(transfers.id, transferIds))
    }

    // 5. Delete all remaining transactions of this fund
    await tx.delete(transactions).where(eq(transactions.fundId, fundId))

    // 6. Delete the fund itself
    await tx.delete(funds).where(eq(funds.id, fundId))
  })

  return { success: true, data: undefined }
}

/** Get all active funds (no balance computation) */
export async function getAllFunds() {
  return db.select().from(funds).where(isNull(funds.archivedAt))
}

/** Get all archived funds */
export async function getArchivedFunds() {
  return db.select().from(funds).where(isNotNull(funds.archivedAt))
}
