import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? 'file:/tmp/build.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

await migrate(drizzle(client), { migrationsFolder: './src/lib/db/migrations' })
console.log('[build-migrate] done.')
await client.close()
