import { migrate } from 'drizzle-orm/libsql/migrator'
import { db } from './client'
import path from 'path'

export async function runMigrations() {
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), 'src/lib/db/migrations'),
  })
}

// NOTE: Funds/accounts are NEVER seeded with default names.
// Funds represent real wallet accounts (GCash, BPI, BDO, Cash etc.) —
// the user must create them manually. Allowance/Regalo/Others are income
// SOURCES (src/lib/db/init.ts seeds the `sources` table), not fund accounts.
