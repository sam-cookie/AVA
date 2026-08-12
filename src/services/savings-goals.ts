import { db } from '@/lib/db/client'
import { ensureInitialized } from '@/lib/db/init'
ensureInitialized()
import { savingsGoals, goalContributions, transactions, funds } from '@/lib/db/schema'
import { eq, desc, sql, inArray } from 'drizzle-orm'
import type { ServiceResult, GoalWithProgress, GoalWithContributions } from '@/types'
import { toCentavos, formatPHP } from '@/lib/utils/currency'
import { getFundBalance } from './funds'

function computeProgress(savedAmount: number, targetAmount: number) {
  const pct = targetAmount > 0 ? Math.min(100, Math.round((savedAmount / targetAmount) * 100)) : 0
  return { percentComplete: pct, remaining: Math.max(0, targetAmount - savedAmount) }
}

export async function getAllGoals(): Promise<GoalWithProgress[]> {
  const rows = await db.select().from(savingsGoals).orderBy(desc(savingsGoals.createdAt))
  if (rows.length === 0) return []

  const goalIds = rows.map((g) => g.id)
  const totals = await db
    .select({
      goalId: goalContributions.goalId,
      total: sql<number>`COALESCE(SUM(${goalContributions.amount}), 0)`,
    })
    .from(goalContributions)
    .where(inArray(goalContributions.goalId, goalIds))
    .groupBy(goalContributions.goalId)

  const totalMap = new Map(totals.map((t) => [t.goalId, t.total]))

  return rows.map((g) => {
    const saved = totalMap.get(g.id) ?? 0
    return { ...g, savedAmount: saved, ...computeProgress(saved, g.targetAmount) }
  })
}

export async function getGoalById(goalId: number): Promise<GoalWithContributions | null> {
  const goal = await db
    .select()
    .from(savingsGoals)
    .where(eq(savingsGoals.id, goalId))
    .get()
  if (!goal) return null

  const [{ total }] = await db
    .select({ total: sql<number>`COALESCE(SUM(${goalContributions.amount}), 0)` })
    .from(goalContributions)
    .where(eq(goalContributions.goalId, goalId))
  const saved = total ?? 0

  const contributions = await db
    .select({
      id: goalContributions.id,
      goalId: goalContributions.goalId,
      fundId: goalContributions.fundId,
      transactionId: goalContributions.transactionId,
      amount: goalContributions.amount,
      date: goalContributions.date,
      note: goalContributions.note,
      createdAt: goalContributions.createdAt,
      fundName: funds.name,
    })
    .from(goalContributions)
    .leftJoin(funds, eq(goalContributions.fundId, funds.id))
    .where(eq(goalContributions.goalId, goalId))
    .orderBy(desc(goalContributions.date), desc(goalContributions.createdAt))

  return {
    ...goal,
    savedAmount: saved,
    ...computeProgress(saved, goal.targetAmount),
    contributions,
  }
}

export async function createSavingsGoal(input: {
  name: string
  targetAmountRaw: string
  targetDate?: string
  note?: string
}): Promise<ServiceResult<{ goalId: number }>> {
  const targetAmount = toCentavos(input.targetAmountRaw)
  if (targetAmount <= 0) {
    return { success: false, error: 'Target amount must be greater than zero' }
  }

  const [row] = await db
    .insert(savingsGoals)
    .values({
      name: input.name.trim(),
      targetAmount,
      targetDate: input.targetDate || null,
      note: input.note?.trim() || null,
      createdAt: new Date(),
    })
    .returning({ id: savingsGoals.id })

  return { success: true, data: { goalId: row.id } }
}

export async function updateSavingsGoal(
  goalId: number,
  input: {
    name?: string
    targetAmountRaw?: string
    targetDate?: string | null
    note?: string | null
  }
): Promise<ServiceResult<void>> {
  const goal = await db.select().from(savingsGoals).where(eq(savingsGoals.id, goalId)).get()
  if (!goal) return { success: false, error: 'Goal not found' }

  const updates: Partial<typeof savingsGoals.$inferInsert> = {}
  if (input.name !== undefined) updates.name = input.name.trim()
  if (input.targetAmountRaw !== undefined) {
    const amt = toCentavos(input.targetAmountRaw)
    if (amt <= 0) return { success: false, error: 'Target amount must be greater than zero' }
    updates.targetAmount = amt
  }
  if (input.targetDate !== undefined) updates.targetDate = input.targetDate
  if (input.note !== undefined) updates.note = input.note?.trim() || null

  await db.update(savingsGoals).set(updates).where(eq(savingsGoals.id, goalId))
  return { success: true, data: undefined }
}

export async function deleteSavingsGoal(goalId: number): Promise<ServiceResult<void>> {
  const goal = await db.select().from(savingsGoals).where(eq(savingsGoals.id, goalId)).get()
  if (!goal) return { success: false, error: 'Goal not found' }

  const contribs = await db
    .select({ transactionId: goalContributions.transactionId })
    .from(goalContributions)
    .where(eq(goalContributions.goalId, goalId))

  const txIds = contribs
    .filter((c) => c.transactionId !== null)
    .map((c) => c.transactionId as number)

  await db.transaction(async (tx) => {
    await tx.delete(savingsGoals).where(eq(savingsGoals.id, goalId))
    if (txIds.length > 0) {
      await tx.delete(transactions).where(inArray(transactions.id, txIds))
    }
  })

  return { success: true, data: undefined }
}

export async function addContribution(input: {
  goalId: number
  fundId: number
  amountRaw: string
  date: string
  note?: string
}): Promise<ServiceResult<{ contributionId: number }>> {
  const amount = toCentavos(input.amountRaw)
  if (amount <= 0) return { success: false, error: 'Amount must be greater than zero' }

  const goal = await db.select().from(savingsGoals).where(eq(savingsGoals.id, input.goalId)).get()
  if (!goal) return { success: false, error: 'Goal not found' }

  const fund = await db.select().from(funds).where(eq(funds.id, input.fundId)).get()
  if (!fund) return { success: false, error: 'Account not found' }

  const balance = await getFundBalance(input.fundId)
  if (balance < amount) {
    return {
      success: false,
      error: `Insufficient balance in ${fund.name}. Available: ${formatPHP(balance)}`,
    }
  }

  const now = new Date()

  const contributionId = await db.transaction(async (tx) => {
    const [txRow] = await tx
      .insert(transactions)
      .values({
        fundId: input.fundId,
        type: 'expense',
        amount,
        title: goal.name,
        category: 'Savings',
        date: input.date,
        note: input.note || null,
        createdAt: now,
      })
      .returning({ id: transactions.id })

    const [contribRow] = await tx
      .insert(goalContributions)
      .values({
        goalId: input.goalId,
        fundId: input.fundId,
        transactionId: txRow.id,
        amount,
        date: input.date,
        note: input.note || null,
        createdAt: now,
      })
      .returning({ id: goalContributions.id })

    return contribRow.id
  })

  return { success: true, data: { contributionId } }
}

export async function deleteContribution(contributionId: number): Promise<ServiceResult<void>> {
  const contrib = await db
    .select()
    .from(goalContributions)
    .where(eq(goalContributions.id, contributionId))
    .get()
  if (!contrib) return { success: false, error: 'Contribution not found' }

  await db.transaction(async (tx) => {
    await tx.delete(goalContributions).where(eq(goalContributions.id, contributionId))
    if (contrib.transactionId) {
      await tx.delete(transactions).where(eq(transactions.id, contrib.transactionId))
    }
  })
  return { success: true, data: undefined }
}
