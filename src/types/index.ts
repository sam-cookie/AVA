export const TRANSACTION_TYPES = [
  'addition',
  'expense',
  'transfer_in',
  'transfer_out',
] as const
export type TransactionType = (typeof TRANSACTION_TYPES)[number]

// --- DB row types (what services return) ---

export type Fund = {
  id: number
  name: string
  color: string | null
  createdAt: Date
}

export type Category = {
  id: number
  name: string
  icon: string
  createdAt: Date
}

export type IncomeSource = {
  id: number
  name: string
  createdAt: Date
}

export type Transaction = {
  id: number
  fundId: number
  type: TransactionType
  amount: number // centavos
  title: string | null // user-written expense label (e.g. "McDonald's lunch")
  category: string | null
  source: string | null // income source for additions only (Allowance/Gift/etc.)
  transferId: number | null
  date: string // YYYY-MM-DD
  note: string | null
  createdAt: Date
}

export type Transfer = {
  id: number
  fromFundId: number
  toFundId: number
  amount: number // centavos — the value sent (excluding fee)
  fee: number // centavos — charged to the source fund on top of amount
  date: string
  note: string | null
  createdAt: Date
}

// --- Enriched types for UI ---

export type TransactionWithFund = Transaction & {
  fundName: string
  relatedFundName: string | null // for transfers: the other fund's name
}

export type TransactionWithRunningBalance = TransactionWithFund & {
  runningBalance: number
}

export type FundWithBalance = Fund & {
  balance: number
  totalAdded: number
  totalSpent: number
  totalTransferIn: number
  totalTransferOut: number
}

// --- Service result type ---

export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// --- Savings Goals ---

export type SavingsGoal = {
  id: number
  name: string
  targetAmount: number // centavos
  targetDate: string | null // YYYY-MM-DD
  note: string | null
  createdAt: Date
}

export type GoalContribution = {
  id: number
  goalId: number
  fundId: number
  transactionId: number | null
  amount: number // centavos
  date: string
  note: string | null
  createdAt: Date
}

export type GoalWithProgress = SavingsGoal & {
  savedAmount: number // centavos
  percentComplete: number // 0–100
  remaining: number // centavos, clamped to 0
}

export type GoalWithContributions = GoalWithProgress & {
  contributions: (GoalContribution & { fundName: string | null })[]
}

// --- Utang (Debt Tracker) ---

export type UtangType = 'i_owe' | 'they_owe'
export type UtangStatus = 'unpaid' | 'partial' | 'paid'

export type Utang = {
  id: number
  type: UtangType
  person: string
  amount: number // centavos, original amount
  deadline: string | null // YYYY-MM-DD
  note: string | null
  createdAt: Date
}

export type UtangPayment = {
  id: number
  utangId: number
  fundId: number
  transactionId: number | null
  amount: number // centavos
  date: string
  note: string | null
  createdAt: Date
}

export type UtangWithProgress = Utang & {
  totalPaid: number // centavos
  remaining: number // centavos, clamped to 0
  status: UtangStatus
  payments: (UtangPayment & { fundName: string | null })[]
}

// --- Filter types ---

export type TransactionFilters = {
  fundId?: number
  type?: TransactionType
  category?: string
  source?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}
