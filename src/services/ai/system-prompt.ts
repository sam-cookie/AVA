import { getFundsWithBalances, getTotalBalance } from '@/services/funds'
import { getCategories } from '@/services/categories'
import { getAllSources } from '@/services/sources'
import { getAllGoals, getGoalById } from '@/services/savings-goals'
import { getCurrentMonthSpend, getRecentTransactions, getExpensesByCategoryWithIcon, getMonthlyExpenseTotals, getFundTransactionsWithBalance } from '@/services/transactions'
import { formatPHP } from '@/lib/utils/currency'
import { todayISO } from '@/lib/utils/date'

function fundIdFromPath(pathname: string): number | null {
  const m = pathname.match(/^\/funds\/(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

function goalIdFromPath(pathname: string): number | null {
  const m = pathname.match(/^\/savings\/(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

export async function buildSystemPrompt(pathname = '/'): Promise<string> {
  const today = todayISO()
  const now = new Date()
  const monthFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const monthTo = today

  const [funds, totalBalance, categories, sources, goals, monthSpend] = await Promise.all([
    getFundsWithBalances(),
    getTotalBalance(),
    getCategories(),
    getAllSources(),
    getAllGoals(),
    getCurrentMonthSpend(),
  ])

  const fundsText = funds.length === 0
    ? 'No accounts yet.'
    : funds.map(f => `  - ${f.name} (id:${f.id}): ${formatPHP(f.balance)}`).join('\n')

  const categoriesText = categories.length === 0
    ? 'No categories yet.'
    : categories.map(c => `  - ${c.name} (id:${c.id}) ${c.icon}`).join('\n')

  const sourcesText = sources.length === 0
    ? 'No income sources yet.'
    : sources.map(s => `  - ${s.name} (id:${s.id})`).join('\n')

  const goalsText = goals.length === 0
    ? 'No savings goals.'
    : goals.map(g => `  - ${g.name} (id:${g.id}): ${formatPHP(g.savedAmount)} / ${formatPHP(g.targetAmount)} (${g.percentComplete}%)`).join('\n')

  // Build page-specific context
  let pageContext = ''

  if (pathname === '/' || pathname === '') {
    const recent = await getRecentTransactions(8)
    const recentText = recent.map(t =>
      `  - [${t.date}] ${t.type === 'expense' ? 'Expense' : t.type === 'addition' ? 'Income' : 'Transfer'}: ${formatPHP(t.amount)} ${t.title ? `"${t.title}"` : ''} (${t.fundName})`
    ).join('\n')
    pageContext = `\nPage: Dashboard\nRecent transactions:\n${recentText || '  None'}`
  } else if (pathname.startsWith('/funds/')) {
    const fundId = fundIdFromPath(pathname)
    if (fundId) {
      const fund = funds.find(f => f.id === fundId)
      const history = await getFundTransactionsWithBalance(fundId)
      const histText = history.slice(0, 10).map(t =>
        `  - [${t.date}] ${t.type}: ${formatPHP(t.amount)} — balance after: ${formatPHP(t.runningBalance)}`
      ).join('\n')
      pageContext = `\nPage: Fund detail — ${fund?.name ?? `ID ${fundId}`}\nBalance: ${fund ? formatPHP(fund.balance) : 'unknown'}\nRecent history:\n${histText || '  No transactions'}`
    }
  } else if (pathname === '/funds') {
    pageContext = `\nPage: All Accounts\n(Fund list already in base context above)`
  } else if (pathname === '/transactions') {
    const recent = await getRecentTransactions(15)
    const recentText = recent.map(t =>
      `  - [id:${t.id}] [${t.date}] ${t.type}: ${formatPHP(t.amount)} ${t.title ? `"${t.title}"` : ''} (${t.fundName})`
    ).join('\n')
    pageContext = `\nPage: Transactions / Expenses\nRecent:\n${recentText || '  None'}`
  } else if (pathname === '/reports') {
    const [catBreakdown, monthly] = await Promise.all([
      getExpensesByCategoryWithIcon(monthFrom, monthTo),
      getMonthlyExpenseTotals(6),
    ])
    const catText = catBreakdown.map(c => `  - ${c.category}: ${formatPHP(c.total)}`).join('\n')
    const monthlyText = monthly.map(m => `  - ${m.month}: ${formatPHP(m.total)}`).join('\n')
    pageContext = `\nPage: Reports\nThis month by category:\n${catText || '  None'}\nLast 6 months:\n${monthlyText || '  None'}`
  } else if (pathname === '/savings') {
    pageContext = `\nPage: Savings Goals\n(Goals already in base context above)`
  } else if (pathname.startsWith('/savings/')) {
    const goalId = goalIdFromPath(pathname)
    if (goalId) {
      const detail = await getGoalById(goalId)
      if (detail) {
        const contribText = detail.contributions.slice(0, 5).map(c =>
          `  - [${c.date}] ${formatPHP(c.amount)} from ${c.fundName}`
        ).join('\n')
        pageContext = `\nPage: Savings Goal — ${detail.name}\nTarget: ${formatPHP(detail.targetAmount)} | Saved: ${formatPHP(detail.savedAmount)} (${detail.percentComplete}%)\nRecent contributions:\n${contribText || '  None'}`
      }
    }
  } else if (pathname === '/settings') {
    pageContext = `\nPage: Settings\n(Categories and income sources already in base context above)`
  }

  return `You are Ava, CPA — a friendly, professional Certified Public Accountant and personal finance assistant built into Ava's expense tracker app. You help her understand her finances, spot patterns, and manage her money through natural conversation.

Today's date: ${today}

## Base Financial Context

Total Balance: ${formatPHP(totalBalance)}
Current Month Spending: ${formatPHP(monthSpend)}

Accounts/Funds:
${fundsText}

Expense Categories:
${categoriesText}

Income Sources:
${sourcesText}

Savings Goals:
${goalsText}
${pageContext}

## Your Role & Style

- Respond in a warm, conversational tone — like a trusted CPA friend, not a cold chatbot.
- Be concise. Don't over-explain unless asked.
- Use Philippine Peso (₱) formatting for all money amounts.
- Proactively offer a brief financial observation when relevant (e.g., "That brings your GCash down to ₱1,200 — you might want to top up soon.").
- When the user asks about "here", "this", "this account", "this goal", use the page context above to determine what they mean.
- For destructive actions (delete), confirm what you're about to do in your response before or after executing.

## Rules

- NEVER store money as decimals — amounts in tools are peso strings (e.g. "150.50"), the system handles centavo conversion.
- Transfers are NOT income or expenses — they move money between accounts, net worth stays the same.
- Fund names are wallet/bank accounts (GCash, BPI, Cash) — NOT income labels.
- Income Sources (Allowance, Regalo, etc.) are where money comes from — they don't have balances.
- Use the fund IDs and category IDs shown above when calling tools — match names to IDs from the context.
- If a fund or category name the user mentions doesn't match any in the list, say so and list the available options.
- IMPORTANT: When adding money, recording an expense, creating a transfer, or adding a savings goal contribution — if the user does NOT specify which account/fund to use, ALWAYS ask first before calling any tool. Never assume or default to any account. Ask: "Which account should I use? You have: [list actual fund names]." Only proceed after the user confirms.
- You have full access to create, read, update, and delete any financial data through your tools.`
}
