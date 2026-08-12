import { db, client } from '@/lib/db/client'
import { ensureInitialized } from '@/lib/db/init'
ensureInitialized()
import { transactions, funds, transfers } from '@/lib/db/schema'
import { and, desc, eq, gte, inArray, like, lte } from 'drizzle-orm'
import type {
  TransactionFilters,
  TransactionWithFund,
  TransactionWithRunningBalance,
} from '@/types'

/** Get a paginated list of transactions with fund name and related fund name for transfers */
export async function getTransactions(
  filters: TransactionFilters = {},
  limit = 50,
  offset = 0
): Promise<TransactionWithFund[]> {
  const conditions = []

  if (filters.fundId) {
    conditions.push(eq(transactions.fundId, filters.fundId))
  }
  if (filters.type) {
    conditions.push(eq(transactions.type, filters.type))
  }
  if (filters.category) {
    conditions.push(eq(transactions.category, filters.category))
  }
  if (filters.source) {
    conditions.push(eq(transactions.source, filters.source))
  }
  if (filters.dateFrom) {
    conditions.push(gte(transactions.date, filters.dateFrom))
  }
  if (filters.dateTo) {
    conditions.push(lte(transactions.date, filters.dateTo))
  }
  if (filters.search) {
    conditions.push(like(transactions.title, `%${filters.search}%`))
  }

  const rows = await db
    .select({
      id: transactions.id,
      fundId: transactions.fundId,
      type: transactions.type,
      amount: transactions.amount,
      title: transactions.title,
      category: transactions.category,
      source: transactions.source,
      transferId: transactions.transferId,
      date: transactions.date,
      note: transactions.note,
      createdAt: transactions.createdAt,
      fundName: funds.name,
    })
    .from(transactions)
    .innerJoin(funds, eq(funds.id, transactions.fundId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .limit(limit)
    .offset(offset)

  // Resolve relatedFundName for transfer rows
  const transferIds = [...new Set(rows.filter((r) => r.transferId).map((r) => r.transferId!))]

  const relatedFundMap = new Map<number, string>()

  if (transferIds.length > 0) {
    const transferRows = await db
      .select({
        id: transfers.id,
        fromFundId: transfers.fromFundId,
        toFundId: transfers.toFundId,
      })
      .from(transfers)
      .where(inArray(transfers.id, transferIds))

    const fundIds = new Set<number>()
    transferRows.forEach((t) => {
      fundIds.add(t.fromFundId)
      fundIds.add(t.toFundId)
    })

    const fundNames = await db
      .select({ id: funds.id, name: funds.name })
      .from(funds)
      .where(inArray(funds.id, [...fundIds]))

    const fundNameMap = new Map(fundNames.map((f) => [f.id, f.name]))

    const transferMeta = new Map(
      transferRows.map((t) => [
        t.id,
        { fromName: fundNameMap.get(t.fromFundId) ?? '', toName: fundNameMap.get(t.toFundId) ?? '' },
      ])
    )

    rows.forEach((r) => {
      if (!r.transferId) return
      const meta = transferMeta.get(r.transferId)
      if (!meta) return
      relatedFundMap.set(
        r.id,
        r.type === 'transfer_out' ? meta.toName : meta.fromName
      )
    })
  }

  return rows.map((r) => ({
    ...r,
    relatedFundName: relatedFundMap.get(r.id) ?? null,
  })) as TransactionWithFund[]
}

/** Get recent transactions across all funds (for dashboard) */
export async function getRecentTransactions(limit = 8): Promise<TransactionWithFund[]> {
  return getTransactions({}, limit, 0)
}

/** Get transactions for a single fund with running balance (SQLite window function) */
export async function getFundTransactionsWithBalance(
  fundId: number
): Promise<TransactionWithRunningBalance[]> {
  const result = await client.execute({
    sql: `
      SELECT
        t.id,
        t.fund_id as fundId,
        t.type,
        t.amount,
        t.title,
        t.category,
        t.source,
        t.transfer_id as transferId,
        t.date,
        t.note,
        t.created_at as createdAt,
        f.name as fundName,
        CASE
          WHEN t.type = 'transfer_out' THEN tf_to.name
          WHEN t.type = 'transfer_in' THEN tf_from.name
          ELSE NULL
        END as relatedFundName,
        SUM(
          CASE WHEN t.type IN ('addition','transfer_in') THEN t.amount ELSE -t.amount END
        ) OVER (
          ORDER BY t.date ASC, t.created_at ASC
        ) as runningBalance
      FROM transactions t
      INNER JOIN funds f ON f.id = t.fund_id
      LEFT JOIN transfers tr ON tr.id = t.transfer_id
      LEFT JOIN funds tf_to ON tf_to.id = tr.to_fund_id
      LEFT JOIN funds tf_from ON tf_from.id = tr.from_fund_id
      WHERE t.fund_id = ?
      ORDER BY t.date DESC, t.created_at DESC
    `,
    args: [fundId],
  })

  return result.rows.map((r) => ({
    id: r.id as number,
    fundId: r.fundId as number,
    type: r.type as string,
    amount: r.amount as number,
    title: r.title as string | null,
    category: r.category as string | null,
    source: r.source as string | null,
    transferId: r.transferId as number | null,
    date: r.date as string,
    note: r.note as string | null,
    createdAt: new Date((r.createdAt as number) * 1000),
    fundName: r.fundName as string,
    relatedFundName: r.relatedFundName as string | null,
    runningBalance: r.runningBalance as number,
  })) as TransactionWithRunningBalance[]
}

/** Monthly expense totals for the last N months */
export async function getMonthlyExpenseTotals(
  months = 6
): Promise<{ month: string; total: number }[]> {
  const safeMonths = Math.max(1, Math.min(120, Math.floor(months)))
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - safeMonths)
  const cutoffDate = cutoff.toISOString().split('T')[0]
  const result = await client.execute({
    sql: `
      SELECT
        strftime('%Y-%m', date) as month,
        SUM(amount) as total
      FROM transactions
      WHERE type = 'expense'
        AND date >= ?
      GROUP BY month
      ORDER BY month ASC
    `,
    args: [cutoffDate],
  })
  return result.rows.map((r) => ({ month: r.month as string, total: r.total as number }))
}

/** Total spent in the current month (expenses only, no transfers) */
export async function getCurrentMonthSpend(): Promise<number> {
  const result = await client.execute({
    sql: `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE type = 'expense'
        AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    `,
    args: [],
  })
  return result.rows[0].total as number
}

/** Expense totals grouped by category for a date range */
export async function getExpensesByCategory(
  dateFrom: string,
  dateTo: string
): Promise<{ category: string; total: number }[]> {
  const result = await client.execute({
    sql: `
      SELECT
        COALESCE(category, 'Uncategorized') as category,
        SUM(amount) as total
      FROM transactions
      WHERE type = 'expense'
        AND date >= ?
        AND date <= ?
      GROUP BY category
      ORDER BY total DESC
    `,
    args: [dateFrom, dateTo],
  })
  return result.rows.map((r) => ({ category: r.category as string, total: r.total as number }))
}

/** Expense totals grouped by fund for a date range */
export async function getExpensesByFund(
  dateFrom: string,
  dateTo: string
): Promise<{ fundName: string; total: number }[]> {
  const result = await client.execute({
    sql: `
      SELECT
        f.name as fundName,
        SUM(t.amount) as total
      FROM transactions t
      INNER JOIN funds f ON f.id = t.fund_id
      WHERE t.type = 'expense'
        AND t.date >= ?
        AND t.date <= ?
      GROUP BY t.fund_id
      ORDER BY total DESC
    `,
    args: [dateFrom, dateTo],
  })
  return result.rows.map((r) => ({ fundName: r.fundName as string, total: r.total as number }))
}

/** Daily expense totals for the last N days (only days with spending are returned) */
export async function getDailyExpenseTotals(
  days: number
): Promise<{ date: string; total: number }[]> {
  const safeDays = Math.max(1, Math.min(365, Math.floor(days)))
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - (safeDays - 1))
  const cutoffDate = cutoff.toISOString().split('T')[0]
  const result = await client.execute({
    sql: `SELECT date, SUM(amount) as total
       FROM transactions
       WHERE type = 'expense'
         AND date >= ?
       GROUP BY date
       ORDER BY date DESC`,
    args: [cutoffDate],
  })
  return result.rows.map((r) => ({ date: r.date as string, total: r.total as number }))
}

/** Expense total for an arbitrary date range */
export async function getExpenseTotalForRange(dateFrom: string, dateTo: string): Promise<number> {
  const result = await client.execute({
    sql: `SELECT COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE type = 'expense' AND date >= ? AND date <= ?`,
    args: [dateFrom, dateTo],
  })
  return result.rows[0].total as number
}

/** Count of expense transactions in an arbitrary date range */
export async function getExpenseCountForRange(dateFrom: string, dateTo: string): Promise<number> {
  const result = await client.execute({
    sql: `SELECT COUNT(*) as count
       FROM transactions
       WHERE type = 'expense' AND date >= ? AND date <= ?`,
    args: [dateFrom, dateTo],
  })
  return result.rows[0].count as number
}

/** Expense totals by category with category icon, joined from categories table */
export async function getExpensesByCategoryWithIcon(
  dateFrom: string,
  dateTo: string
): Promise<{ category: string; icon: string | null; total: number }[]> {
  const result = await client.execute({
    sql: `SELECT
         COALESCE(t.category, 'Uncategorized') as category,
         c.icon as icon,
         SUM(t.amount) as total
       FROM transactions t
       LEFT JOIN categories c ON c.name = t.category
       WHERE t.type = 'expense' AND t.date >= ? AND t.date <= ?
       GROUP BY t.category
       ORDER BY total DESC`,
    args: [dateFrom, dateTo],
  })
  return result.rows.map((r) => ({
    category: r.category as string,
    icon: r.icon as string | null,
    total: r.total as number,
  }))
}

/** All-time total of expenses */
export async function getTotalExpenses(): Promise<number> {
  const result = await client.execute({
    sql: `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense'`,
    args: [],
  })
  return result.rows[0].total as number
}

/** Count of expense transactions in the current month */
export async function getCurrentMonthExpenseCount(): Promise<number> {
  const result = await client.execute({
    sql: `SELECT COUNT(*) as count FROM transactions
       WHERE type = 'expense' AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')`,
    args: [],
  })
  return result.rows[0].count as number
}
