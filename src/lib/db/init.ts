import { db, client } from './client'
import { sources, categories, funds } from './schema'
import { sql } from 'drizzle-orm'

let initPromise: Promise<void> | null = null

/** Idempotent async init: seeds default data on first run. */
export function ensureInitialized(): void {
  if (!initPromise) {
    initPromise = init().catch((e) => console.error('[init] seed error:', e))
  }
}

const OLD_FUND_NAMES = ['Allowance', 'Regalo', 'Others', '[Rename] Allowance', '[Rename] Regalo', '[Rename] Others']

async function init() {
  // Ensure archived_at column exists on all tables (idempotent migration check)
  const tables = [
    'funds',
    'transactions',
    'transfers',
    'categories',
    'sources',
    'savings_goals',
    'goal_contributions',
    'utang',
    'utang_payments',
  ]
  for (const table of tables) {
    try {
      await client.execute(`ALTER TABLE ${table} ADD COLUMN archived_at integer`)
    } catch {
      // Column already exists or table not yet created
    }
  }

  // Remove incorrectly-named funds that have no transactions
  for (const name of OLD_FUND_NAMES) {
    await db.run(
      sql`DELETE FROM funds WHERE name = ${name} AND id NOT IN (SELECT DISTINCT fund_id FROM transactions)`
    )
  }

  // Seed a default Cash account if no funds exist
  const [{ count: fundCount }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(funds)
  if (Number(fundCount) === 0) {
    await db.insert(funds).values({ name: 'Cash', createdAt: new Date() })
  }

  // Seed default income sources if table is empty
  const [{ count: srcCount }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(sources)
  if (Number(srcCount) === 0) {
    const now = new Date()
    await db.insert(sources).values([
      { name: 'Allowance', createdAt: now },
      { name: 'Regalo', createdAt: now },
      { name: 'Salary', createdAt: now },
      { name: 'Business', createdAt: now },
      { name: 'Others', createdAt: now },
    ])
  }

  // Seed default categories if table is empty
  const [{ count: catCount }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(categories)
  if (Number(catCount) === 0) {
    const now = new Date()
    await db.insert(categories).values([
      { name: 'Food & Drink', icon: 'UtensilsCrossed', createdAt: now },
      { name: 'Entertainment', icon: 'Film', createdAt: now },
      { name: 'Subscriptions', icon: 'RefreshCw', createdAt: now },
      { name: 'Grocery + Palengke', icon: 'ShoppingCart', createdAt: now },
      { name: 'Shopping / Wants', icon: 'ShoppingBag', createdAt: now },
      { name: 'Transportation', icon: 'Car', createdAt: now },
      { name: 'Others', icon: 'MoreHorizontal', createdAt: now },
    ])
  }
}
