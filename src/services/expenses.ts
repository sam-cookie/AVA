import { db } from '@/lib/db/client'
import { ensureInitialized } from '@/lib/db/init'
ensureInitialized()
import { funds, transactions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { ServiceResult } from '@/types'
import { toCentavos, formatPHP } from '@/lib/utils/currency'
import { getFundBalance, invalidateFundsCache } from './funds'

/** Create a new expense transaction */
export async function createExpense(input: {
  fundId: number
  amountRaw: string
  title: string
  category: string
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
    return { success: false, error: 'Cannot create expense in an archived account' }
  }

  const balance = await getFundBalance(input.fundId)
  if (balance < amount) {
    return {
      success: false,
      error: `Insufficient balance in ${fund.name}. Available: ${formatPHP(balance)}`,
    }
  }

  invalidateFundsCache()
  const result = await db
    .insert(transactions)
    .values({
      fundId: input.fundId,
      type: 'expense',
      amount,
      title: input.title || null,
      category: input.category,
      date: input.date,
      note: input.note || null,
      createdAt: new Date(),
    })
    .returning({ id: transactions.id })

  return { success: true, data: { transactionId: result[0].id } }
}

/** Update an existing expense (amount, category, date, note) */
export async function updateExpense(
  transactionId: number,
  input: {
    fundId: number
    amountRaw: string
    title: string
    category: string
    date: string
    note?: string
  }
): Promise<ServiceResult<void>> {
  const amount = toCentavos(input.amountRaw)
  if (amount <= 0) {
    return { success: false, error: 'Amount must be greater than zero' }
  }

  const existing = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .get()

  if (!existing || existing.type !== 'expense') {
    return { success: false, error: 'Expense not found' }
  }

  const isSameFund = existing.fundId === input.fundId
  if (isSameFund) {
    const balance = await getFundBalance(input.fundId)
    const effectiveBalance = balance + existing.amount
    if (effectiveBalance < amount) {
      return {
        success: false,
        error: `Insufficient balance after edit. Available: ${formatPHP(effectiveBalance)}`,
      }
    }
  } else {
    const newBalance = await getFundBalance(input.fundId)
    if (newBalance < amount) {
      return {
        success: false,
        error: `Insufficient balance in new account. Available: ${formatPHP(newBalance)}`,
      }
    }
  }

  invalidateFundsCache()
  await db
    .update(transactions)
    .set({
      fundId: input.fundId,
      amount,
      title: input.title || null,
      category: input.category,
      date: input.date,
      note: input.note || null,
    })
    .where(eq(transactions.id, transactionId))

  return { success: true, data: undefined }
}

/** Soft-delete (archive) an expense */
export async function deleteExpense(transactionId: number): Promise<ServiceResult<void>> {
  const existing = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .get()

  if (!existing || existing.type !== 'expense') {
    return { success: false, error: 'Expense not found' }
  }

  invalidateFundsCache()
  await db
    .update(transactions)
    .set({ archivedAt: new Date() })
    .where(eq(transactions.id, transactionId))

  return { success: true, data: undefined }
}

/** Soft-delete (archive) a fund addition */
export async function deleteAddition(transactionId: number): Promise<ServiceResult<void>> {
  const existing = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .get()

  if (!existing || existing.type !== 'addition') {
    return { success: false, error: 'Addition not found' }
  }

  const balance = await getFundBalance(existing.fundId)
  if (balance - existing.amount < 0) {
    return {
      success: false,
      error: 'Cannot delete: fund would be overdrawn',
    }
  }

  invalidateFundsCache()
  await db
    .update(transactions)
    .set({ archivedAt: new Date() })
    .where(eq(transactions.id, transactionId))

  return { success: true, data: undefined }
}

/** Restore a previously soft-deleted transaction */
export async function restoreTransaction(transactionId: number): Promise<ServiceResult<void>> {
  const existing = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .get()

  if (!existing) {
    return { success: false, error: 'Transaction not found' }
  }

  // If restoring an expense, verify the fund has enough balance
  if (existing.type === 'expense') {
    const balance = await getFundBalance(existing.fundId)
    if (balance < existing.amount) {
      return {
        success: false,
        error: 'Cannot restore: account balance is insufficient',
      }
    }
  }

  invalidateFundsCache()
  await db
    .update(transactions)
    .set({ archivedAt: null })
    .where(eq(transactions.id, transactionId))

  return { success: true, data: undefined }
}

/** Permanently delete a transaction (irreversible) */
export async function deleteTransactionForever(transactionId: number): Promise<ServiceResult<void>> {
  const existing = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .get()

  if (!existing) {
    return { success: false, error: 'Transaction not found' }
  }

  invalidateFundsCache()
  await db.delete(transactions).where(eq(transactions.id, transactionId))
  return { success: true, data: undefined }
}

/** Update an existing income addition */
export async function updateAddition(
  transactionId: number,
  input: {
    fundId: number
    amountRaw: string
    source: string
    date: string
    note?: string
  }
): Promise<ServiceResult<void>> {
  const amount = toCentavos(input.amountRaw)
  if (amount <= 0) {
    return { success: false, error: 'Amount must be greater than zero' }
  }

  const existing = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .get()

  if (!existing || existing.type !== 'addition') {
    return { success: false, error: 'Income entry not found' }
  }

  // If reducing the amount, ensure the fund won't go negative
  if (amount < existing.amount) {
    const balance = await getFundBalance(existing.fundId)
    if (balance - (existing.amount - amount) < 0) {
      return { success: false, error: 'Cannot reduce amount: fund would be overdrawn' }
    }
  }

  invalidateFundsCache()
  await db
    .update(transactions)
    .set({
      fundId: input.fundId,
      amount,
      source: input.source,
      date: input.date,
      note: input.note || null,
    })
    .where(eq(transactions.id, transactionId))

  return { success: true, data: undefined }
}
