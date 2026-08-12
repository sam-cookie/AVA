// Tool definitions for Gemini function calling.
// Parameters use standard JSON Schema — compatible with Gemini's Schema type at runtime.

const queryDeclarations = [
  {
    name: 'get_fund_balances',
    description: 'Get all funds/accounts with their current balances.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_total_balance',
    description: 'Get the total balance across all funds.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_transactions',
    description: 'Get a filtered list of transactions.',
    parameters: {
      type: 'object',
      properties: {
        fundId: { type: 'number', description: 'Filter by fund ID' },
        type: { type: 'string', enum: ['addition', 'expense', 'transfer_in', 'transfer_out'] },
        category: { type: 'string', description: 'Filter by category name' },
        source: { type: 'string', description: 'Filter by income source name' },
        dateFrom: { type: 'string', description: 'Start date YYYY-MM-DD' },
        dateTo: { type: 'string', description: 'End date YYYY-MM-DD' },
        search: { type: 'string', description: 'Search by title/description' },
        limit: { type: 'number', description: 'Max results (default 20)' },
      },
      required: [],
    },
  },
  {
    name: 'get_monthly_expense_totals',
    description: 'Get monthly expense totals for the last N months.',
    parameters: {
      type: 'object',
      properties: { months: { type: 'number', description: 'Number of months (default 6)' } },
      required: [],
    },
  },
  {
    name: 'get_expenses_by_category',
    description: 'Get expense totals grouped by category for a date range.',
    parameters: {
      type: 'object',
      properties: {
        dateFrom: { type: 'string', description: 'Start date YYYY-MM-DD' },
        dateTo: { type: 'string', description: 'End date YYYY-MM-DD' },
      },
      required: ['dateFrom', 'dateTo'],
    },
  },
  {
    name: 'get_expenses_by_fund',
    description: 'Get expense totals grouped by fund/account for a date range.',
    parameters: {
      type: 'object',
      properties: {
        dateFrom: { type: 'string', description: 'Start date YYYY-MM-DD' },
        dateTo: { type: 'string', description: 'End date YYYY-MM-DD' },
      },
      required: ['dateFrom', 'dateTo'],
    },
  },
  {
    name: 'get_expense_total_for_range',
    description: 'Get total expenses for a specific date range.',
    parameters: {
      type: 'object',
      properties: {
        dateFrom: { type: 'string', description: 'Start date YYYY-MM-DD' },
        dateTo: { type: 'string', description: 'End date YYYY-MM-DD' },
      },
      required: ['dateFrom', 'dateTo'],
    },
  },
  {
    name: 'get_categories',
    description: 'Get all expense categories.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_sources',
    description: 'Get all income sources.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_savings_goals',
    description: 'Get all savings goals with progress.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_goal_details',
    description: 'Get details and contribution history for a specific savings goal.',
    parameters: {
      type: 'object',
      properties: { goalId: { type: 'number', description: 'Savings goal ID from get_savings_goals' } },
      required: ['goalId'],
    },
  },
]

const mutationDeclarations = [
  // Expenses
  {
    name: 'create_expense',
    description: 'Record a new expense transaction. Only call this AFTER the user has explicitly told you which account/fund to use. If they have not specified, ask them first — do not guess.',
    parameters: {
      type: 'object',
      properties: {
        fundId: { type: 'number', description: 'Fund/account ID to deduct from. Must be confirmed by the user — never assume.' },
        amount: { type: 'string', description: 'Amount in pesos, e.g. "150.50"' },
        title: { type: 'string', description: 'Expense label, e.g. "McDonald\'s lunch"' },
        category: { type: 'string', description: 'Category name' },
        date: { type: 'string', description: 'Date YYYY-MM-DD' },
        note: { type: 'string', description: 'Optional note' },
      },
      required: ['amount', 'title', 'category', 'date'],
    },
  },
  {
    name: 'update_expense',
    description: 'Edit an existing expense. Only call after looking up the transactionId with get_transactions.',
    parameters: {
      type: 'object',
      properties: {
        transactionId: { type: 'number', description: 'Transaction ID — look up with get_transactions first' },
        fundId: { type: 'number', description: 'Fund/account ID' },
        amount: { type: 'string', description: 'Amount in pesos' },
        title: { type: 'string' },
        category: { type: 'string' },
        date: { type: 'string', description: 'Date YYYY-MM-DD' },
        note: { type: 'string' },
      },
      required: ['amount', 'title', 'category', 'date'],
    },
  },
  {
    name: 'delete_expense',
    description: 'Delete an expense transaction. Use get_transactions first to find the transactionId — never guess or pass a string.',
    parameters: {
      type: 'object',
      properties: {
        transactionId: { type: 'number', description: 'Numeric transaction ID from get_transactions' },
      },
      required: [],
    },
  },
  // Additions (income)
  {
    name: 'add_money_to_fund',
    description: 'Add income/money to a fund/account. Only call this AFTER the user has explicitly said which account to add to. If they have not specified, ask them first.',
    parameters: {
      type: 'object',
      properties: {
        fundId: { type: 'number', description: 'Fund/account ID to add money to. Must be confirmed by the user — never assume.' },
        amount: { type: 'string', description: 'Amount in pesos' },
        source: { type: 'string', description: 'Income source name, e.g. "Allowance"' },
        date: { type: 'string', description: 'Date YYYY-MM-DD' },
        note: { type: 'string' },
      },
      required: ['amount', 'source', 'date'],
    },
  },
  {
    name: 'delete_addition',
    description: 'Delete an income/addition transaction. Use get_transactions first to find the transactionId.',
    parameters: {
      type: 'object',
      properties: {
        transactionId: { type: 'number', description: 'Numeric transaction ID from get_transactions' },
      },
      required: [],
    },
  },
  {
    name: 'update_addition',
    description: 'Edit an existing income/addition entry. Use get_transactions first to find the transactionId.',
    parameters: {
      type: 'object',
      properties: {
        transactionId: { type: 'number', description: 'Transaction ID from get_transactions' },
        fundId: { type: 'number', description: 'Fund/account ID' },
        amount: { type: 'string', description: 'Amount in pesos' },
        source: { type: 'string' },
        date: { type: 'string', description: 'Date YYYY-MM-DD' },
        note: { type: 'string' },
      },
      required: ['amount', 'source', 'date'],
    },
  },
  // Transfers
  {
    name: 'create_transfer',
    description: 'Transfer money between two funds/accounts. Only call this AFTER the user has explicitly specified both the source and destination accounts.',
    parameters: {
      type: 'object',
      properties: {
        fromFundId: { type: 'number', description: 'Source fund ID — must be confirmed by user' },
        toFundId: { type: 'number', description: 'Destination fund ID — must be confirmed by user' },
        amount: { type: 'string', description: 'Amount in pesos' },
        fee: { type: 'string', description: 'Optional transfer fee in pesos' },
        date: { type: 'string', description: 'Date YYYY-MM-DD' },
        note: { type: 'string' },
      },
      required: ['amount', 'date'],
    },
  },
  {
    name: 'delete_transfer',
    description: 'Delete a transfer and its two linked transactions.',
    parameters: {
      type: 'object',
      properties: {
        transferId: { type: 'number', description: 'Transfer ID' },
      },
      required: [],
    },
  },
  // Funds
  {
    name: 'create_fund',
    description: 'Create a new wallet/bank account fund.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Fund name e.g. GCash, BPI, Cash' },
        color: { type: 'string', description: 'Hex color e.g. #003699' },
      },
      required: ['name'],
    },
  },
  {
    name: 'rename_fund',
    description: 'Rename an existing fund.',
    parameters: {
      type: 'object',
      properties: {
        fundId: { type: 'number' },
        name: { type: 'string' },
      },
      required: ['fundId', 'name'],
    },
  },
  {
    name: 'delete_fund',
    description: 'Delete a fund (only if it has no transactions).',
    parameters: {
      type: 'object',
      properties: { fundId: { type: 'number' } },
      required: ['fundId'],
    },
  },
  // Categories
  {
    name: 'create_category',
    description: 'Create a new expense category.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        icon: { type: 'string', description: 'Emoji icon e.g. 🍔' },
      },
      required: ['name', 'icon'],
    },
  },
  {
    name: 'update_category',
    description: 'Update a category name or icon.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        icon: { type: 'string' },
      },
      required: ['id', 'name', 'icon'],
    },
  },
  {
    name: 'delete_category',
    description: 'Delete an expense category.',
    parameters: {
      type: 'object',
      properties: { id: { type: 'number' } },
      required: ['id'],
    },
  },
  // Sources
  {
    name: 'create_source',
    description: 'Create a new income source.',
    parameters: {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    },
  },
  {
    name: 'update_source',
    description: 'Rename an income source.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
      },
      required: ['id', 'name'],
    },
  },
  {
    name: 'delete_source',
    description: 'Delete an income source.',
    parameters: {
      type: 'object',
      properties: { id: { type: 'number' } },
      required: ['id'],
    },
  },
  // Savings goals
  {
    name: 'create_savings_goal',
    description: 'Create a new savings goal.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        targetAmount: { type: 'string', description: 'Target amount in pesos' },
        targetDate: { type: 'string', description: 'Optional target date YYYY-MM-DD' },
        note: { type: 'string' },
      },
      required: ['name', 'targetAmount'],
    },
  },
  {
    name: 'update_savings_goal',
    description: 'Update a savings goal.',
    parameters: {
      type: 'object',
      properties: {
        goalId: { type: 'number' },
        name: { type: 'string' },
        targetAmount: { type: 'string', description: 'Target amount in pesos' },
        targetDate: { type: 'string' },
        note: { type: 'string' },
      },
      required: ['goalId'],
    },
  },
  {
    name: 'delete_savings_goal',
    description: 'Delete a savings goal.',
    parameters: {
      type: 'object',
      properties: { goalId: { type: 'number' } },
      required: ['goalId'],
    },
  },
  {
    name: 'add_contribution',
    description: 'Add a contribution to a savings goal from a fund. Only call this AFTER the user has explicitly said which account to take money from.',
    parameters: {
      type: 'object',
      properties: {
        goalId: { type: 'number', description: 'Savings goal ID' },
        fundId: { type: 'number', description: 'Fund/account ID to deduct contribution from — must be confirmed by user' },
        amount: { type: 'string', description: 'Amount in pesos' },
        date: { type: 'string', description: 'Date YYYY-MM-DD' },
        note: { type: 'string' },
      },
      required: ['goalId', 'amount', 'date'],
    },
  },
  {
    name: 'delete_contribution',
    description: 'Delete a savings goal contribution.',
    parameters: {
      type: 'object',
      properties: {
        contributionId: { type: 'number', description: 'Contribution ID' },
      },
      required: [],
    },
  },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GEMINI_TOOLS: any[] = [
  { functionDeclarations: [...queryDeclarations, ...mutationDeclarations] },
]

export const MUTATION_TOOL_NAMES = new Set(mutationDeclarations.map((d) => d.name))
