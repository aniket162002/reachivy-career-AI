/**
 * Applies every SQL file in supabase/migrations in filename order.
 *
 * Usage: node scripts/migrate.mjs
 *
 * Reads POSTGRES_URL_NON_POOLING (preferred, required for DDL) or POSTGRES_URL
 * from .env. Each file runs inside a transaction; a failure rolls that file back
 * and stops the run.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function loadEnv() {
  const file = path.join(root, '.env')
  if (!fs.existsSync(file)) return
  for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const match = line.match(/^([A-Za-z0-9_]+)=([\s\S]*)$/)
    if (!match) continue
    const value = match[2].trim().replace(/^["']|["']$/g, '')
    if (!process.env[match[1]]) process.env[match[1]] = value
  }
}

loadEnv()

const connectionString = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL
if (!connectionString) {
  console.error('POSTGRES_URL_NON_POOLING is not set — cannot run migrations.')
  process.exit(1)
}

const dir = path.join(root, 'supabase', 'migrations')
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()

// Strip sslmode from the URL: it would otherwise override the ssl object below.
// Supabase's pooler presents a chain Node does not trust by default, and this
// script only ever runs locally against your own database.
const dsn = connectionString.replace(/[?&]sslmode=[^&]*/g, '')

const client = new pg.Client({ connectionString: dsn, ssl: { rejectUnauthorized: false } })
await client.connect()

// Track what has run so re-invoking the script is safe.
await client.query(`
  create table if not exists public._ivy_migrations (
    filename text primary key,
    applied_at timestamptz not null default now()
  )
`)

const { rows } = await client.query('select filename from public._ivy_migrations')
const applied = new Set(rows.map((r) => r.filename))

for (const file of files) {
  if (applied.has(file)) {
    console.log(`- skip ${file} (already applied)`)
    continue
  }
  const sql = fs.readFileSync(path.join(dir, file), 'utf8')
  try {
    await client.query('begin')
    await client.query(sql)
    await client.query('insert into public._ivy_migrations (filename) values ($1)', [file])
    await client.query('commit')
    console.log(`+ applied ${file}`)
  } catch (error) {
    await client.query('rollback')
    console.error(`x failed ${file}:`, error.message)
    await client.end()
    process.exit(1)
  }
}

await client.end()
console.log('migrations complete')
