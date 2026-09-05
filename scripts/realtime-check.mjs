/**
 * Verifies Supabase Realtime actually delivers conversation turns to a
 * subscribed browser-style client — the same path app/page.tsx uses.
 *
 * Usage: node scripts/realtime-check.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

for (const rawLine of fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const line = rawLine.trim()
  if (!line || line.startsWith('#')) continue
  const match = line.match(/^([A-Za-z0-9_]+)=([\s\S]*)$/)
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
}

const BASE = process.env.IVY_BASE ?? 'http://localhost:3000'

// The anon key is what the browser uses — this exercises RLS too.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
)

const created = await fetch(`${BASE}/api/sessions`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({}),
}).then((r) => r.json())

const sessionId = created.sessionId
console.log(`session: ${sessionId}`)

const received = []
let subscribed = false

const channel = supabase
  .channel(`ivy-session-${sessionId}`)
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'conversation_turns', filter: `session_id=eq.${sessionId}` },
    (payload) => {
      const row = payload.new
      console.log(`  <- realtime: [${row.speaker}] ${String(row.content).slice(0, 62)}…`)
      received.push(row)
    },
  )
  .subscribe((status) => {
    console.log(`  channel: ${status}`)
    if (status === 'SUBSCRIBED') subscribed = true
  })

// Wait for the subscription to be live before writing.
for (let i = 0; i < 50 && !subscribed; i++) await new Promise((r) => setTimeout(r, 200))

if (!subscribed) {
  console.log('\nFAIL: channel never reached SUBSCRIBED')
  process.exit(1)
}

console.log('\nsending a message through the API…')
await fetch(`${BASE}/api/sessions/${sessionId}/message`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    answer:
      'I taught myself to repair bicycles after my neighbour gave me a broken one, and I ended up fixing bikes for half the kids on my street.',
    source: 'text',
  }),
}).then((r) => r.json())

// Give the realtime broadcast time to land.
for (let i = 0; i < 60 && received.length < 2; i++) await new Promise((r) => setTimeout(r, 250))

await supabase.removeChannel(channel)

const speakers = received.map((r) => r.speaker)
const ok = received.length >= 2 && speakers.includes('student') && speakers.includes('ivy')

console.log(`\nturns received over realtime: ${received.length} (${speakers.join(', ')})`)
console.log(ok ? 'PASS — realtime delivers both the student turn and Ivy reply' : 'FAIL — realtime did not deliver expected turns')

process.exit(ok ? 0 : 1)
