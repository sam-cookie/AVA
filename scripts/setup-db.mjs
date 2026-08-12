// Run once to create tables and seed the three funds
import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const Database = require('better-sqlite3')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', '.data', 'ava.db')

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Create tables
db.exec(`
CREATE TABLE IF NOT EXISTS funds (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  from_fund_id INTEGER NOT NULL,
  to_fund_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  date TEXT NOT NULL,
  note TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (from_fund_id) REFERENCES funds(id),
  FOREIGN KEY (to_fund_id) REFERENCES funds(id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  fund_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  category TEXT,
  payment_method TEXT,
  transfer_id INTEGER,
  date TEXT NOT NULL,
  note TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (fund_id) REFERENCES funds(id),
  FOREIGN KEY (transfer_id) REFERENCES transfers(id) ON DELETE CASCADE
);
`)

// Seed funds if not present
const count = db.prepare('SELECT COUNT(*) as count FROM funds').get()
if (count.count === 0) {
  const now = Math.floor(Date.now() / 1000)
  const insert = db.prepare('INSERT INTO funds (name, created_at) VALUES (?, ?)')
  db.transaction(() => {
    insert.run('Allowance', now)
    insert.run('Regalo', now)
    insert.run('Others', now)
  })()
  console.log('✓ Seeded 3 funds: Allowance, Regalo, Others')
} else {
  console.log(`✓ Funds already exist (${count.count} found)`)
}

console.log('✓ Database ready at', dbPath)
db.close()
