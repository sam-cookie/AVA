import { createClient, type Client } from '@libsql/client'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import * as schema from './schema'

type GlobalDb = {
  client: Client
  db: LibSQLDatabase<typeof schema>
}

const g = globalThis as unknown as { _db?: GlobalDb }

function createDb(): GlobalDb {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  return { client, db: drizzle(client, { schema }) }
}

const { client, db } = (g._db ??= createDb())

if (process.env.NODE_ENV !== 'production') {
  g._db = { client, db }
}

export { client, db }
