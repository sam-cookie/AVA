import { db } from '@/lib/db/client'
import { ensureInitialized } from '@/lib/db/init'
ensureInitialized()
import { funds, transactions, transfers, goalContributions, utangPayments } from '@/lib/db/schema'
import { eq, or, sql } from 'drizzle-orm'
import type { Fund, FundWithBalance, ServiceResult } from '@/types'
import { toCentavos } from '@/lib/utils/currency'

/** Get all funds with their computed balances and summaries */
export async function getFundsWithBalances(): Promise<FundWithBalance[]> {
  const rows = await db
    .select({
      id: funds.id,
      name: funds.name,
      color: funds.color,
      createdAt: funds.createdAt,
      balance: sql<number>`
        COALESCE(SUM(CASE
          WHEN ${transactions.type} IN ('addition', 'transfer_in') THEN ${transactions.amount}
          ELSE -${transactions.amount}
        END), 0)
      `,
      totalAdded: sql<number>`
        COALESCE(SUM(CASE WHEN ${transactions.type} = 'addition' THEN ${transactions.amount} ELSE 0 END), 0)
      `,
      totalSpent: sql<number>`
        COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)
      `,
      totalTransferIn: sql<number>`
        COALESCE(SUM(CASE WHEN ${transactions.type} = 'transfer_in' THEN ${transactions.amount} ELSE 0 END), 0)
      `,
      totalTransferOut: sql<number>`
        COALESCE(SUM(CASE WHEN ${transactions.type} = 'transfer_out' THEN ${transactions.amount} ELSE 0 END), 0)
      `,
    })
    .from(funds)
    .leftJoin(transactions, eq(transactions.fundId, funds.id))
    .groupBy(funds.id)

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
      createdAt: funds.createdAt,
      balance: sql<number>`
        COALESCE(SUM(CASE
          WHEN ${transactions.type} IN ('addition', 'transfer_in') THEN ${transactions.amount}
          ELSE -${transactions.amount}
        END), 0)
      `,
      totalAdded: sql<number>`
        COALESCE(SUM(CASE WHEN ${transactions.type} = 'addition' THEN ${transactions.amount} ELSE 0 END), 0)
      `,
      totalSpent: sql<number>`
        COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)
      `,
      totalTransferIn: sql<number>`
        COALESCE(SUM(CASE WHEN ${transactions.type} = 'transfer_in' THEN ${transactions.amount} ELSE 0 END), 0)
      `,
      totalTransferOut: sql<number>`
        COALESCE(SUM(CASE WHEN ${transactions.type} = 'transfer_out' THEN ${transactions.amount} ELSE 0 END), 0)
      `,
    })
    .from(funds)
    .leftJoin(transactions, eq(transactions.fundId, funds.id))
    .where(eq(funds.id, fundId))
    .groupBy(funds.id)

  return rows[0] ?? null
}

/** Get total balance across all funds */
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
    .where(eq(transactions.fundId, fundId))

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
    return { success: false, error: 'Fund not found' }
  }

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
  const result = await db
    .insert(funds)
    .values({ name, color: color ?? null, createdAt: new Date() })
    .returning()

  const f = result[0]
  return { success: true, data: { id: f.id, name: f.name, color: f.color, createdAt: f.createdAt } }
}

/** Rename an existing fund */
export async function renameFund(fundId: number, name: string): Promise<ServiceResult<void>> {
  const fund = await db.select().from(funds).where(eq(funds.id, fundId)).get()
  if (!fund) return { success: false, error: 'Fund not found' }

  await db.update(funds).set({ name }).where(eq(funds.id, fundId))
  return { success: true, data: undefined }
}

/** Delete a fund — only allowed if it has no linked history */
export async function deleteFund(fundId: number): Promise<ServiceResult<void>> {
  const fund = await db.select().from(funds).where(eq(funds.id, fundId)).get()
  if (!fund) return { success: false, error: 'Fund not found' }

  const [txCount, transferCount, goalCount, utangCount] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(transactions).where(eq(transactions.fundId, fundId)).get(),
    db.select({ count: sql<number>`COUNT(*)` }).from(transfers).where(or(eq(transfers.fromFundId, fundId), eq(transfers.toFundId, fundId))).get(),
    db.select({ count: sql<number>`COUNT(*)` }).from(goalContributions).where(eq(goalContributions.fundId, fundId)).get(),
    db.select({ count: sql<number>`COUNT(*)` }).from(utangPayments).where(eq(utangPayments.fundId, fundId)).get(),
  ])

  if (
    (txCount?.count ?? 0) > 0 ||
    (transferCount?.count ?? 0) > 0 ||
    (goalCount?.count ?? 0) > 0 ||
    (utangCount?.count ?? 0) > 0
  ) {
    return { success: false, error: 'Cannot delete a fund that has transactions' }
  }

  await db.delete(funds).where(eq(funds.id, fundId))
  return { success: true, data: undefined }
}

/** Get all funds (no balance computation) */
export async function getAllFunds() {
  return db.select().from(funds)
}
