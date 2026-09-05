import { db } from '@/lib/db/client'
import { ensureInitialized } from '@/lib/db/init'
ensureInitialized()
import { utang, utangPayments, funds, transactions } from '@/lib/db/schema'
import { eq, desc, sql, inArray } from 'drizzle-orm'
import type { ServiceResult, UtangWithProgress, UtangStatus, UtangType } from '@/types'
import { toCentavos, formatPHP } from '@/lib/utils/currency'
import { getFundBalance } from './funds'

function deriveStatus(totalPaid: number, amount: number): UtangStatus {
  if (totalPaid <= 0) return 'unpaid'
  if (totalPaid >= amount) return 'paid'
  return 'partial'
}

export async function getUtangDeadlinesForMonth(
  year: number,
  month: number
): Promise<{ id: number; person: string; type: UtangType; amount: number; remaining: number; deadline: string }[]> {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  const rows = await db
    .select()
    .from(utang)
    .where(sql`strftime('%Y-%m', ${utang.deadline}) = ${monthStr}`)

  if (rows.length === 0) return []

  const utangIds = rows.map((u) => u.id)
  const totals = await db
    .select({
      utangId: utangPayments.utangId,
      total: sql<number>`COALESCE(SUM(${utangPayments.amount}), 0)`,
    })
    .from(utangPayments)
    .where(inArray(utangPayments.utangId, utangIds))
    .groupBy(utangPayments.utangId)

  const totalMap = new Map(totals.map((t) => [t.utangId, t.total]))

  return rows
    .map((u) => ({
      id: u.id,
      person: u.person,
      type: u.type,
      amount: u.amount,
      remaining: Math.max(0, u.amount - (totalMap.get(u.id) ?? 0)),
      deadline: u.deadline!,
    }))
    .filter((u) => u.remaining > 0)
}

export async function getAllUtang(): Promise<UtangWithProgress[]> {
  const rows = await db.select().from(utang).orderBy(desc(utang.createdAt))
  if (rows.length === 0) return []

  const utangIds = rows.map((u) => u.id)

  const totals = await db
    .select({
      utangId: utangPayments.utangId,
      total: sql<number>`COALESCE(SUM(${utangPayments.amount}), 0)`,
    })
    .from(utangPayments)
    .where(inArray(utangPayments.utangId, utangIds))
    .groupBy(utangPayments.utangId)

  const totalMap = new Map(totals.map((t) => [t.utangId, t.total]))

  const allPayments = await db
    .select({
      id: utangPayments.id,
      utangId: utangPayments.utangId,
      fundId: utangPayments.fundId,
      transactionId: utangPayments.transactionId,
      amount: utangPayments.amount,
      date: utangPayments.date,
      note: utangPayments.note,
      createdAt: utangPayments.createdAt,
      fundName: funds.name,
    })
    .from(utangPayments)
    .leftJoin(funds, eq(utangPayments.fundId, funds.id))
    .where(inArray(utangPayments.utangId, utangIds))
    .orderBy(desc(utangPayments.date), desc(utangPayments.createdAt))

  const paymentsMap = new Map<number, typeof allPayments>()
  for (const p of allPayments) {
    const list = paymentsMap.get(p.utangId) ?? []
    list.push(p)
    paymentsMap.set(p.utangId, list)
  }

  return rows.map((u) => {
    const totalPaid = totalMap.get(u.id) ?? 0
    const remaining = Math.max(0, u.amount - totalPaid)
    return {
      ...u,
      totalPaid,
      remaining,
      status: deriveStatus(totalPaid, u.amount),
      payments: paymentsMap.get(u.id) ?? [],
    }
  })
}

export async function createUtang(input: {
  type: 'i_owe' | 'they_owe'
  person: string
  amountRaw: string
  fundId?: number
  deadline?: string
  note?: string
}): Promise<ServiceResult<{ utangId: number }>> {
  const amount = toCentavos(input.amountRaw)
  if (amount <= 0) return { success: false, error: 'Amount must be greater than zero' }

  if (input.type === 'they_owe') {
    if (!input.fundId) {
      return { success: false, error: 'Account is required when lending money' }
    }
    const fund = await db.select().from(funds).where(eq(funds.id, input.fundId)).get()
    if (!fund) {
      return { success: false, error: 'Account not found' }
    }
    const balance = await getFundBalance(input.fundId)
    if (balance < amount) {
      return {
        success: false,
        error: `Insufficient balance in ${fund.name}. Available: ${formatPHP(balance)}`,
      }
    }
  }

  const now = new Date()
  const rowId = await db.transaction(async (tx) => {
    let txId: number | null = null
    if (input.type === 'they_owe' && input.fundId) {
      const todayStr = now.toISOString().slice(0, 10)
      const [txRow] = await tx
        .insert(transactions)
        .values({
          fundId: input.fundId,
          type: 'expense',
          amount,
          title: `Lent money to ${input.person.trim()}`,
          category: 'Utang',
          date: todayStr,
          note: input.note?.trim() || null,
          createdAt: now,
        })
        .returning({ id: transactions.id })
      txId = txRow.id
    }

    const [row] = await tx
      .insert(utang)
      .values({
        type: input.type,
        person: input.person.trim(),
        amount,
        deadline: input.deadline || null,
        note: input.note?.trim() || null,
        fundId: input.fundId || null,
        transactionId: txId,
        createdAt: now,
      })
      .returning({ id: utang.id })

    return row.id
  })

  return { success: true, data: { utangId: rowId } }
}

export async function updateUtang(
  utangId: number,
  input: {
    person?: string
    amountRaw?: string
    deadline?: string | null
    note?: string | null
    fundId?: number | null
  }
): Promise<ServiceResult<void>> {
  const record = await db.select().from(utang).where(eq(utang.id, utangId)).get()
  if (!record) return { success: false, error: 'Utang not found' }

  const updates: Partial<typeof utang.$inferInsert> = {}
  if (input.person !== undefined) updates.person = input.person.trim()
  if (input.amountRaw !== undefined) {
    const amt = toCentavos(input.amountRaw)
    if (amt <= 0) return { success: false, error: 'Amount must be greater than zero' }
    updates.amount = amt
  }
  if (input.deadline !== undefined) updates.deadline = input.deadline
  if (input.note !== undefined) updates.note = input.note?.trim() || null
  if (input.fundId !== undefined) updates.fundId = input.fundId

  await db.transaction(async (tx) => {
    if (record.transactionId) {
      const txUpdates: Partial<typeof transactions.$inferInsert> = {}
      if (input.amountRaw !== undefined) {
        txUpdates.amount = toCentavos(input.amountRaw)
      }
      if (input.person !== undefined) {
        txUpdates.title = `Lent money to ${input.person.trim()}`
      }
      if (input.note !== undefined) {
        txUpdates.note = input.note?.trim() || null
      }
      if (input.fundId !== undefined && input.fundId !== null) {
        txUpdates.fundId = input.fundId
      }

      if (Object.keys(txUpdates).length > 0) {
        await tx.update(transactions).set(txUpdates).where(eq(transactions.id, record.transactionId))
      }
    }

    await tx.update(utang).set(updates).where(eq(utang.id, utangId))
  })

  return { success: true, data: undefined }
}

export async function deleteUtang(utangId: number): Promise<ServiceResult<void>> {
  const record = await db.select().from(utang).where(eq(utang.id, utangId)).get()
  if (!record) return { success: false, error: 'Utang not found' }

  const payments = await db
    .select({ transactionId: utangPayments.transactionId })
    .from(utangPayments)
    .where(eq(utangPayments.utangId, utangId))

  const txIds = payments
    .filter((p) => p.transactionId !== null)
    .map((p) => p.transactionId as number)

  if (record.transactionId) {
    txIds.push(record.transactionId)
  }

  await db.transaction(async (tx) => {
    await tx.delete(utang).where(eq(utang.id, utangId))
    if (txIds.length > 0) {
      await tx.delete(transactions).where(inArray(transactions.id, txIds))
    }
  })

  return { success: true, data: undefined }
}

export async function recordUtangPayment(input: {
  utangId: number
  fundId: number
  amountRaw: string
  date: string
  note?: string
}): Promise<ServiceResult<{ paymentId: number }>> {
  const amount = toCentavos(input.amountRaw)
  if (amount <= 0) return { success: false, error: 'Amount must be greater than zero' }

  const record = await db.select().from(utang).where(eq(utang.id, input.utangId)).get()
  if (!record) return { success: false, error: 'Utang not found' }

  const fund = await db.select().from(funds).where(eq(funds.id, input.fundId)).get()
  if (!fund) return { success: false, error: 'Account not found' }

  const [{ total }] = await db
    .select({ total: sql<number>`COALESCE(SUM(${utangPayments.amount}), 0)` })
    .from(utangPayments)
    .where(eq(utangPayments.utangId, input.utangId))

  const totalPaid = total ?? 0
  const remaining = Math.max(0, record.amount - totalPaid)

  if (amount > remaining) {
    return { success: false, error: `Payment exceeds remaining amount (${formatPHP(remaining)})` }
  }

  if (record.type === 'i_owe') {
    const balance = await getFundBalance(input.fundId)
    if (balance < amount) {
      return {
        success: false,
        error: `Insufficient balance in ${fund.name}. Available: ${formatPHP(balance)}`,
      }
    }
  }

  const now = new Date()
  const txType = record.type === 'i_owe' ? 'expense' : 'addition'
  const txTitle = record.type === 'i_owe'
    ? `Utang payment to ${record.person}`
    : `Payment received from ${record.person}`

  const paymentId = await db.transaction(async (tx) => {
    const [txRow] = await tx
      .insert(transactions)
      .values({
        fundId: input.fundId,
        type: txType,
        amount,
        title: txTitle,
        category: 'Utang',
        date: input.date,
        note: input.note || null,
        createdAt: now,
      })
      .returning({ id: transactions.id })

    const [paymentRow] = await tx
      .insert(utangPayments)
      .values({
        utangId: input.utangId,
        fundId: input.fundId,
        transactionId: txRow.id,
        amount,
        date: input.date,
        note: input.note || null,
        createdAt: now,
      })
      .returning({ id: utangPayments.id })

    return paymentRow.id
  })

  return { success: true, data: { paymentId } }
}

export async function deleteUtangPayment(paymentId: number): Promise<ServiceResult<void>> {
  const payment = await db
    .select()
    .from(utangPayments)
    .where(eq(utangPayments.id, paymentId))
    .get()
  if (!payment) return { success: false, error: 'Payment not found' }

  await db.transaction(async (tx) => {
    await tx.delete(utangPayments).where(eq(utangPayments.id, paymentId))
    if (payment.transactionId) {
      await tx.delete(transactions).where(eq(transactions.id, payment.transactionId))
    }
  })
  return { success: true, data: undefined }
}
