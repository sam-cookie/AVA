import { formatPHP } from '@/lib/utils/currency'
import * as fundsService from '@/services/funds'
import * as expensesService from '@/services/expenses'
import * as transfersService from '@/services/transfers'
import * as txService from '@/services/transactions'
import * as categoriesService from '@/services/categories'
import * as sourcesService from '@/services/sources'
import * as goalsService from '@/services/savings-goals'

type Args = Record<string, unknown>

function centavosToDisplay(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj
  if (Array.isArray(obj)) return obj.map(centavosToDisplay)
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (
      typeof v === 'number' &&
      (k === 'balance' || k === 'amount' || k === 'total' || k === 'totalAdded' ||
       k === 'totalSpent' || k === 'totalTransferIn' || k === 'totalTransferOut' ||
       k === 'targetAmount' || k === 'savedAmount' || k === 'remaining' || k === 'fee')
    ) {
      result[k] = formatPHP(v)
    } else if (typeof v === 'object') {
      result[k] = centavosToDisplay(v)
    } else {
      result[k] = v
    }
  }
  return result
}

function ok(data: unknown): string {
  return JSON.stringify(centavosToDisplay(data))
}

function err(message: string): string {
  return JSON.stringify({ error: message })
}

// Returns the value only if it is a finite number — rejects strings like "unknown"
function requireNum(args: Args, field: string): number | null {
  const v = args[field]
  if (typeof v === 'number' && Number.isFinite(v)) return v
  return null
}

// Returns a trimmed non-empty string under maxLen, or null
function safeStr(args: Args, field: string, maxLen = 200): string | null {
  const v = args[field]
  if (typeof v !== 'string') return null
  const trimmed = v.trim()
  if (!trimmed || trimmed.length > maxLen) return null
  return trimmed
}

// Returns a YYYY-MM-DD date string or null if malformed
function safeDateStr(args: Args, field: string): string | null {
  const v = args[field]
  if (typeof v !== 'string') return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  return v
}

async function fundMissing(): Promise<string> {
  const funds = await fundsService.getFundsWithBalances()
  const list = funds.map(f => `${f.name} (id:${f.id})`).join(', ')
  return `No account specified. Please ask the user which account to use. Available accounts: ${list}`
}

export async function executeTool(
  name: string,
  args: Args
): Promise<{ result: string; mutated: boolean }> {

  try {
    switch (name) {
      // ── Query tools ──────────────────────────────────────────────────────────
      case 'get_fund_balances': {
        const funds = await fundsService.getFundsWithBalances()
        return { result: ok(funds), mutated: false }
      }
      case 'get_total_balance': {
        const total = await fundsService.getTotalBalance()
        return { result: ok({ totalBalance: formatPHP(total) }), mutated: false }
      }
      case 'get_transactions': {
        const limit = typeof args.limit === 'number' ? args.limit : 20
        const filters: Record<string, unknown> = {}
        if (args.fundId) filters.fundId = args.fundId
        if (args.type) filters.type = args.type
        if (args.category) filters.category = args.category
        if (args.source) filters.source = args.source
        if (args.dateFrom) filters.dateFrom = args.dateFrom
        if (args.dateTo) filters.dateTo = args.dateTo
        if (args.search) filters.search = args.search
        const txs = await txService.getTransactions(filters as Parameters<typeof txService.getTransactions>[0], limit, 0)
        return { result: ok(txs.map(t => ({ ...t, amount: formatPHP(t.amount) }))), mutated: false }
      }
      case 'get_monthly_expense_totals': {
        const months = typeof args.months === 'number' ? args.months : 6
        const rows = await txService.getMonthlyExpenseTotals(months)
        return { result: ok(rows.map(r => ({ ...r, total: formatPHP(r.total) }))), mutated: false }
      }
      case 'get_expenses_by_category': {
        const rows = await txService.getExpensesByCategoryWithIcon(args.dateFrom as string, args.dateTo as string)
        return { result: ok(rows.map(r => ({ ...r, total: formatPHP(r.total) }))), mutated: false }
      }
      case 'get_expenses_by_fund': {
        const rows = await txService.getExpensesByFund(args.dateFrom as string, args.dateTo as string)
        return { result: ok(rows.map(r => ({ ...r, total: formatPHP(r.total) }))), mutated: false }
      }
      case 'get_expense_total_for_range': {
        const total = await txService.getExpenseTotalForRange(args.dateFrom as string, args.dateTo as string)
        return { result: ok({ total: formatPHP(total), dateFrom: args.dateFrom, dateTo: args.dateTo }), mutated: false }
      }
      case 'get_categories': {
        const cats = await categoriesService.getCategories()
        return { result: ok(cats), mutated: false }
      }
      case 'get_sources': {
        const sources = await sourcesService.getAllSources()
        return { result: ok(sources), mutated: false }
      }
      case 'get_savings_goals': {
        const goals = await goalsService.getAllGoals()
        return { result: ok(goals), mutated: false }
      }
      case 'get_goal_details': {
        const goalId = requireNum(args, 'goalId')
        if (goalId === null) return { result: err('goalId must be a number — use get_savings_goals to find it'), mutated: false }
        const goal = await goalsService.getGoalById(goalId)
        if (!goal) return { result: err('Goal not found'), mutated: false }
        return { result: ok(goal), mutated: false }
      }

      // ── Expenses ─────────────────────────────────────────────────────────────
      case 'create_expense': {
        const fundId = requireNum(args, 'fundId')
        if (fundId === null) return { result: err(await fundMissing()), mutated: false }
        const title = safeStr(args, 'title', 100)
        if (!title) return { result: err('title is required and must be under 100 characters'), mutated: false }
        const category = safeStr(args, 'category', 60)
        if (!category) return { result: err('category is required'), mutated: false }
        const date = safeDateStr(args, 'date')
        if (!date) return { result: err('date must be in YYYY-MM-DD format'), mutated: false }
        const r = await expensesService.createExpense({
          fundId,
          amountRaw: args.amount as string,
          title,
          category,
          date,
          note: safeStr(args, 'note') ?? undefined,
        })
        return { result: r.success ? ok({ success: true, transactionId: r.data.transactionId }) : err(r.error), mutated: r.success }
      }
      case 'update_expense': {
        const transactionId = requireNum(args, 'transactionId')
        if (transactionId === null) return { result: err('transactionId is required — call get_transactions to look it up first'), mutated: false }
        const fundId = requireNum(args, 'fundId')
        if (fundId === null) return { result: err(await fundMissing()), mutated: false }
        const title = safeStr(args, 'title', 100)
        if (!title) return { result: err('title is required and must be under 100 characters'), mutated: false }
        const category = safeStr(args, 'category', 60)
        if (!category) return { result: err('category is required'), mutated: false }
        const date = safeDateStr(args, 'date')
        if (!date) return { result: err('date must be in YYYY-MM-DD format'), mutated: false }
        const r = await expensesService.updateExpense(transactionId, {
          fundId,
          amountRaw: args.amount as string,
          title,
          category,
          date,
          note: safeStr(args, 'note') ?? undefined,
        })
        return { result: r.success ? ok({ success: true }) : err(r.error), mutated: r.success }
      }
      case 'delete_expense': {
        const transactionId = requireNum(args, 'transactionId')
        if (transactionId === null) return { result: err('transactionId is required — call get_transactions to look it up first'), mutated: false }
        const r = await expensesService.deleteExpense(transactionId)
        return { result: r.success ? ok({ success: true }) : err(r.error), mutated: r.success }
      }

      // ── Additions (income) ────────────────────────────────────────────────────
      case 'add_money_to_fund': {
        const fundId = requireNum(args, 'fundId')
        if (fundId === null) return { result: err(await fundMissing()), mutated: false }
        const source = safeStr(args, 'source', 60)
        if (!source) return { result: err('source is required'), mutated: false }
        const date = safeDateStr(args, 'date')
        if (!date) return { result: err('date must be in YYYY-MM-DD format'), mutated: false }
        const r = await fundsService.addMoneyToFund({
          fundId,
          amountRaw: args.amount as string,
          source,
          date,
          note: safeStr(args, 'note') ?? undefined,
        })
        return { result: r.success ? ok({ success: true, transactionId: r.data.transactionId }) : err(r.error), mutated: r.success }
      }
      case 'delete_addition': {
        const transactionId = requireNum(args, 'transactionId')
        if (transactionId === null) return { result: err('transactionId is required — call get_transactions to look it up first'), mutated: false }
        const r = await expensesService.deleteAddition(transactionId)
        return { result: r.success ? ok({ success: true }) : err(r.error), mutated: r.success }
      }
      case 'update_addition': {
        const transactionId = requireNum(args, 'transactionId')
        if (transactionId === null) return { result: err('transactionId is required — call get_transactions to look it up first'), mutated: false }
        const fundId = requireNum(args, 'fundId')
        if (fundId === null) return { result: err(await fundMissing()), mutated: false }
        const r = await expensesService.updateAddition(transactionId, {
          fundId,
          amountRaw: args.amount as string,
          source: args.source as string,
          date: args.date as string,
          note: args.note as string | undefined,
        })
        return { result: r.success ? ok({ success: true }) : err(r.error), mutated: r.success }
      }

      // ── Transfers ─────────────────────────────────────────────────────────────
      case 'create_transfer': {
        const fromFundId = requireNum(args, 'fromFundId')
        const toFundId = requireNum(args, 'toFundId')
        if (fromFundId === null || toFundId === null) {
          const funds = await fundsService.getFundsWithBalances()
          const list = funds.map(f => `${f.name} (id:${f.id})`).join(', ')
          const missing = fromFundId === null && toFundId === null
            ? 'both the source and destination accounts'
            : fromFundId === null ? 'the source account' : 'the destination account'
          return { result: err(`Please ask the user to specify ${missing}. Available accounts: ${list}`), mutated: false }
        }
        const date = safeDateStr(args, 'date')
        if (!date) return { result: err('date must be in YYYY-MM-DD format'), mutated: false }
        const r = await transfersService.createTransfer({
          fromFundId,
          toFundId,
          amountRaw: args.amount as string,
          feeRaw: typeof args.fee === 'string' ? args.fee : undefined,
          date,
          note: safeStr(args, 'note') ?? undefined,
        })
        return { result: r.success ? ok({ success: true, transferId: r.data.transferId }) : err(r.error), mutated: r.success }
      }
      case 'delete_transfer': {
        const transferId = requireNum(args, 'transferId')
        if (transferId === null) return { result: err('transferId is required'), mutated: false }
        const r = await transfersService.deleteTransfer(transferId)
        return { result: r.success ? ok({ success: true }) : err(r.error), mutated: r.success }
      }

      // ── Funds ─────────────────────────────────────────────────────────────────
      case 'create_fund': {
        const name = safeStr(args, 'name', 60)
        if (!name) return { result: err('name is required'), mutated: false }
        const r = await fundsService.createFund(name, safeStr(args, 'color', 20) ?? undefined)
        return { result: r.success ? ok({ success: true, fund: r.data }) : err(r.error), mutated: r.success }
      }
      case 'rename_fund': {
        const fundId = requireNum(args, 'fundId')
        if (fundId === null) return { result: err('fundId is required'), mutated: false }
        const name = safeStr(args, 'name', 60)
        if (!name) return { result: err('name is required'), mutated: false }
        const r = await fundsService.renameFund(fundId, name)
        return { result: r.success ? ok({ success: true }) : err(r.error), mutated: r.success }
      }
      case 'delete_fund': {
        const fundId = requireNum(args, 'fundId')
        if (fundId === null) return { result: err('fundId is required'), mutated: false }
        const r = await fundsService.deleteFund(fundId)
        return { result: r.success ? ok({ success: true }) : err(r.error), mutated: r.success }
      }

      // ── Categories ────────────────────────────────────────────────────────────
      case 'create_category': {
        const name = safeStr(args, 'name', 60)
        if (!name) return { result: err('name is required'), mutated: false }
        const icon = safeStr(args, 'icon', 10) ?? ''
        const r = await categoriesService.createCategory(name, icon)
        return { result: r.success ? ok({ success: true, category: r.data }) : err(r.error), mutated: r.success }
      }
      case 'update_category': {
        const id = requireNum(args, 'id')
        if (id === null) return { result: err('id is required'), mutated: false }
        const name = safeStr(args, 'name', 60)
        if (!name) return { result: err('name is required'), mutated: false }
        const icon = safeStr(args, 'icon', 10) ?? ''
        const r = await categoriesService.updateCategory(id, name, icon)
        return { result: r.success ? ok({ success: true }) : err(r.error), mutated: r.success }
      }
      case 'delete_category': {
        const id = requireNum(args, 'id')
        if (id === null) return { result: err('id is required'), mutated: false }
        const r = await categoriesService.deleteCategory(id)
        return { result: r.success ? ok({ success: true }) : err(r.error), mutated: r.success }
      }

      // ── Sources ───────────────────────────────────────────────────────────────
      case 'create_source': {
        const name = safeStr(args, 'name', 60)
        if (!name) return { result: err('name is required'), mutated: false }
        const r = await sourcesService.createSource(name)
        return { result: r.success ? ok({ success: true, source: r.data }) : err(r.error), mutated: r.success }
      }
      case 'update_source': {
        const id = requireNum(args, 'id')
        if (id === null) return { result: err('id is required'), mutated: false }
        const name = safeStr(args, 'name', 60)
        if (!name) return { result: err('name is required'), mutated: false }
        const r = await sourcesService.updateSource(id, name)
        return { result: r.success ? ok({ success: true }) : err(r.error), mutated: r.success }
      }
      case 'delete_source': {
        const id = requireNum(args, 'id')
        if (id === null) return { result: err('id is required'), mutated: false }
        const r = await sourcesService.deleteSource(id)
        return { result: r.success ? ok({ success: true }) : err(r.error), mutated: r.success }
      }

      // ── Savings goals ─────────────────────────────────────────────────────────
      case 'create_savings_goal': {
        const name = safeStr(args, 'name', 60)
        if (!name) return { result: err('name is required and must be under 60 characters'), mutated: false }
        const targetDate = args.targetDate !== undefined ? safeDateStr(args, 'targetDate') : undefined
        if (args.targetDate !== undefined && targetDate === null) {
          return { result: err('targetDate must be in YYYY-MM-DD format'), mutated: false }
        }
        const r = await goalsService.createSavingsGoal({
          name,
          targetAmountRaw: args.targetAmount as string,
          targetDate: targetDate ?? undefined,
          note: safeStr(args, 'note') ?? undefined,
        })
        return { result: r.success ? ok({ success: true, goalId: r.data.goalId }) : err(r.error), mutated: r.success }
      }
      case 'update_savings_goal': {
        const goalId = requireNum(args, 'goalId')
        if (goalId === null) return { result: err('goalId is required — use get_savings_goals to find it'), mutated: false }
        const targetDate = args.targetDate !== undefined && args.targetDate !== null
          ? safeDateStr(args, 'targetDate')
          : args.targetDate as string | null | undefined
        if (args.targetDate !== undefined && args.targetDate !== null && targetDate === null) {
          return { result: err('targetDate must be in YYYY-MM-DD format'), mutated: false }
        }
        const r = await goalsService.updateSavingsGoal(goalId, {
          name: args.name !== undefined ? (safeStr(args, 'name', 60) ?? undefined) : undefined,
          targetAmountRaw: args.targetAmount !== undefined ? (args.targetAmount as string) : undefined,
          targetDate,
          note: args.note !== undefined ? (safeStr(args, 'note') ?? null) : undefined,
        })
        return { result: r.success ? ok({ success: true }) : err(r.error), mutated: r.success }
      }
      case 'delete_savings_goal': {
        const goalId = requireNum(args, 'goalId')
        if (goalId === null) return { result: err('goalId is required — use get_savings_goals to find it'), mutated: false }
        const r = await goalsService.deleteSavingsGoal(goalId)
        return { result: r.success ? ok({ success: true }) : err(r.error), mutated: r.success }
      }
      case 'add_contribution': {
        const goalId = requireNum(args, 'goalId')
        if (goalId === null) return { result: err('goalId is required — use get_savings_goals to find it'), mutated: false }
        const fundId = requireNum(args, 'fundId')
        if (fundId === null) return { result: err(await fundMissing()), mutated: false }
        const date = safeDateStr(args, 'date')
        if (!date) return { result: err('date must be in YYYY-MM-DD format'), mutated: false }
        const r = await goalsService.addContribution({
          goalId,
          fundId,
          amountRaw: args.amount as string,
          date,
          note: safeStr(args, 'note') ?? undefined,
        })
        return { result: r.success ? ok({ success: true, contributionId: r.data.contributionId }) : err(r.error), mutated: r.success }
      }
      case 'delete_contribution': {
        const contributionId = requireNum(args, 'contributionId')
        if (contributionId === null) return { result: err('contributionId is required'), mutated: false }
        const r = await goalsService.deleteContribution(contributionId)
        return { result: r.success ? ok({ success: true }) : err(r.error), mutated: r.success }
      }

      default:
        return { result: err(`Unknown tool: ${name}`), mutated: false }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error'
    return { result: err(message), mutated: false }
  }
}
