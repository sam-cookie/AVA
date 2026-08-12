/**
 * Create a user in the Turso database.
 * Usage: pnpm db:seed-user <username> <password>
 *   OR:  node --env-file=.env.local scripts/seed-user.mjs <username> <password>
 */

import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'

const [, , username, password] = process.argv

if (!username || !password) {
  console.error('Usage: pnpm db:seed-user <username> <password>')
  process.exit(1)
}

if (!process.env.TURSO_DATABASE_URL) {
  console.error('Missing TURSO_DATABASE_URL. Run: pnpm db:seed-user <username> <password>')
  process.exit(1)
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const passwordHash = await bcrypt.hash(password, 10)
const now = Math.floor(Date.now() / 1000)

try {
  await client.execute({
    sql: 'INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)',
    args: [username, passwordHash, now],
  })
  console.log(`✓ Created user: ${username}`)
} catch (e) {
  if (e.message?.includes('UNIQUE')) {
    console.error(`✗ Username "${username}" already exists`)
  } else {
    throw e
  }
}

await client.close()
