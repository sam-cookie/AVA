import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const funds = sqliteTable('funds', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  color: text('color'), // hex color chosen by user, e.g. '#003699'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const transfers = sqliteTable('transfers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fromFundId: integer('from_fund_id')
    .notNull()
    .references(() => funds.id),
  toFundId: integer('to_fund_id')
    .notNull()
    .references(() => funds.id),
  amount: integer('amount').notNull(),
  fee: integer('fee').notNull().default(0),
  date: text('date').notNull(),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fundId: integer('fund_id')
    .notNull()
    .references(() => funds.id),
  type: text('type', {
    enum: ['addition', 'expense', 'transfer_in', 'transfer_out'],
  }).notNull(),
  amount: integer('amount').notNull(),
  title: text('title'), // user-written label for expenses (e.g. "McDonald's lunch")
  category: text('category'),
  source: text('source'), // income source for additions (Allowance/Gift/etc.)
  transferId: integer('transfer_id').references(() => transfers.id, {
    onDelete: 'cascade',
  }),
  date: text('date').notNull(),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (t) => ({
  fundIdIdx: index('idx_transactions_fund_id').on(t.fundId),
  typeIdx: index('idx_transactions_type').on(t.type),
  dateIdx: index('idx_transactions_date').on(t.date),
  transferIdIdx: index('idx_transactions_transfer_id').on(t.transferId),
}))

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const sources = sqliteTable('sources', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const savingsGoals = sqliteTable('savings_goals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  targetAmount: integer('target_amount').notNull(), // centavos
  targetDate: text('target_date'), // YYYY-MM-DD, nullable
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const goalContributions = sqliteTable('goal_contributions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  goalId: integer('goal_id')
    .notNull()
    .references(() => savingsGoals.id, { onDelete: 'cascade' }),
  fundId: integer('fund_id')
    .notNull()
    .references(() => funds.id),
  transactionId: integer('transaction_id'), // soft link to expense tx; managed in service
  amount: integer('amount').notNull(), // centavos
  date: text('date').notNull(),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (t) => ({
  goalIdIdx: index('idx_goal_contributions_goal_id').on(t.goalId),
}))

export const utang = sqliteTable('utang', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type', { enum: ['i_owe', 'they_owe'] }).notNull(),
  person: text('person').notNull(),
  amount: integer('amount').notNull(), // centavos, original amount
  deadline: text('deadline'), // YYYY-MM-DD, nullable
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const utangPayments = sqliteTable('utang_payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  utangId: integer('utang_id')
    .notNull()
    .references(() => utang.id, { onDelete: 'cascade' }),
  fundId: integer('fund_id')
    .notNull()
    .references(() => funds.id),
  transactionId: integer('transaction_id'), // soft link to transactions
  amount: integer('amount').notNull(), // centavos
  date: text('date').notNull(),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (t) => ({
  utangIdIdx: index('idx_utang_payments_utang_id').on(t.utangId),
}))

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export type DbUser = typeof users.$inferSelect
export type DbFund = typeof funds.$inferSelect
export type DbTransaction = typeof transactions.$inferSelect
export type DbTransfer = typeof transfers.$inferSelect
export type DbCategory = typeof categories.$inferSelect
export type DbSource = typeof sources.$inferSelect
export type DbSavingsGoal = typeof savingsGoals.$inferSelect
export type DbGoalContribution = typeof goalContributions.$inferSelect
export type DbUtang = typeof utang.$inferSelect
export type DbUtangPayment = typeof utangPayments.$inferSelect
