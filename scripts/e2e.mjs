/**
 * End-to-end flow test against a running dev server.
 *
 * Walks the full product flow the way a student would:
 *   create session -> adaptive interview turns -> ranked stories ->
 *   blueprint generation -> word-budget verification -> resume.
 *
 * Usage: node scripts/e2e.mjs
 */

const BASE = process.env.IVY_BASE ?? 'http://localhost:3000'

const ANSWERS = [
  "When I volunteered at the Lincoln community center last summer, I noticed the staff were struggling to manage student attendance records. Everything was on paper and they kept losing track of which kids had shown up.",
  "I decided to help instead of just noticing because one of the coordinators, Ms. Reyes, spent almost three hours every Friday re-entering the same names. It felt wrong to watch that and do nothing when I knew how to build software.",
  "I built a small web application that let them check students in on a tablet. It took me about six weeks and I had to rewrite the whole thing once because my first version was too complicated for the staff to actually use.",
  "After people started using it, Ms. Reyes told me it gave her an entire afternoon back every week. That hit me harder than any grade I have ever gotten. I realized technology was not only about coding — it could actually solve problems for real people.",
  "Before that experience I thought being good at technology meant being technically skilled, like knowing the hardest algorithms. Now I think what matters more is understanding what people actually need and building something they will genuinely use.",
  "That experience made me want to study computer science, but combined with something social — I want to understand policy and communities too, not just write code in isolation.",
  "Bryn Mawr feels right for that because of the emphasis on interdisciplinary work and the Praxis program, where you can tie coursework to actual community organizations. That is exactly the combination I have been looking for.",
]

const log = (...args) => console.log(...args)
const step = (name) => log(`\n${'='.repeat(62)}\n${name}\n${'='.repeat(62)}`)

async function call(path, init) {
  const response = await fetch(`${BASE}${path}`, init)
  const text = await response.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }
  if (!response.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${path} -> ${response.status}: ${JSON.stringify(body).slice(0, 300)}`)
  }
  return body
}

let failures = 0
function check(label, condition, detail = '') {
  if (condition) {
    log(`  PASS  ${label}${detail ? ` — ${detail}` : ''}`)
  } else {
    failures += 1
    log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

// ---- 1. Create session ----------------------------------------------------

step('1. CREATE SESSION')
const created = await call('/api/sessions', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({}),
})

const sessionId = created.sessionId
log(`  session: ${sessionId}`)
log(`  opening question: "${created.analysis.opening_question}"`)
check('session created', Boolean(sessionId))
check('prompt analysis returned', Array.isArray(created.analysis.required_dimensions))
check('word limit is 350', created.analysis.word_limit === 350)
check('greeting + opening seeded', created.turns.length === 2, `${created.turns.length} turns`)

// ---- 2. Adaptive interview ------------------------------------------------

step('2. ADAPTIVE INTERVIEW')
let last = null
let previousCompleteness = -1
let monotonic = true

for (const [index, answer] of ANSWERS.entries()) {
  const started = Date.now()
  const result = await call(`/api/sessions/${sessionId}/message`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ answer, source: 'text' }),
  })
  const ms = Date.now() - started

  log(`\n  --- turn ${index + 1} (${ms}ms) ---`)
  log(`  student: ${answer.slice(0, 88)}…`)
  log(`  ivy:     ${result.assistant_message}`)
  log(`  why:     ${result.reason_for_question}`)
  log(`  phase:   ${result.phase}   completeness: ${Math.round(result.completeness * 100)}%   ready: ${result.ready_for_strategy}`)
  log(`  missing: ${result.missing_dimensions.join(', ') || 'none'}`)

  if (result.entities.length) {
    log(`  entities (${result.entities.length}):`)
    for (const entity of result.entities.slice(-5)) {
      log(`      [${entity.type}] ${entity.name} @${Math.round(entity.confidence * 100)}% ← "${entity.evidence.slice(0, 60)}…"`)
    }
  }

  if (result.completeness < previousCompleteness) monotonic = false
  previousCompleteness = result.completeness
  last = result
}

check('interview produced questions', Boolean(last?.assistant_message))
check('completeness never went backwards', monotonic)
check('evidence was extracted', last.entities.length > 0, `${last.entities.length} entities`)
check('every entity carries a quote', last.entities.every((e) => e.evidence?.trim().length > 0))
check('every entity is >= 0.6 confidence', last.entities.every((e) => e.confidence >= 0.6))
check('candidate story identified', last.candidates.length > 0, `${last.candidates.length} candidates`)
check('reached readiness', last.ready_for_strategy, `completeness ${Math.round(last.completeness * 100)}%`)

// ---- 3. Story ranking -----------------------------------------------------

step('3. STORY RANKING')
const stories = await call(`/api/sessions/${sessionId}/stories`)
for (const story of stories.stories) {
  log(`  ${story.total.toString().padStart(3)}  ${story.title}`)
}
if (stories.comparison) {
  log(`  winner: ${stories.comparison.winner} over ${stories.comparison.runnerUp}`)
  log(`  reasons: ${stories.comparison.reasons.join(' · ')}`)
}
check('stories ranked', stories.stories.length > 0)
check('a story was selected', Boolean(stories.selected))
check('scores are within 0-100', stories.stories.every((s) => s.total >= 0 && s.total <= 100))
check(
  'ranking is descending',
  stories.stories.every((s, i) => i === 0 || stories.stories[i - 1].total >= s.total),
)

// ---- 4. Blueprint ---------------------------------------------------------

step('4. BLUEPRINT GENERATION')
const started = Date.now()
const result = await call(`/api/sessions/${sessionId}/generate-blueprint`, { method: 'POST' })
log(`  generated in ${Date.now() - started}ms`)

const { blueprint } = result
log(`\n  Core story:      ${blueprint.core_story}`)
log(`  Central message: ${blueprint.central_message}`)
log(`  Strength:        ${blueprint.story_strength}/100`)
log(`\n  Why this story works:`)
for (const reason of blueprint.why_this_story_works) log(`    · ${reason}`)

log(`\n  Sections:`)
let total = 0
for (const [index, section] of blueprint.sections.entries()) {
  total += section.word_count
  log(`    ${index + 1}. ${section.title.padEnd(34)} ${String(section.word_count).padStart(3)} words`)
  if (section.evidence?.length) log(`         evidence: "${section.evidence[0].slice(0, 70)}…"`)
}
log(`    ${''.padEnd(37)} ${'—'.padStart(3)}`)
log(`    ${'TOTAL'.padEnd(37)} ${String(total).padStart(3)} words`)

check('word total is EXACTLY 350', total === 350, `got ${total}`)
check('server agrees on the total', result.total === 350, `server reported ${result.total}`)
check('has at least 4 sections', blueprint.sections.length >= 4, `${blueprint.sections.length} sections`)
check('every section has a purpose', blueprint.sections.every((s) => s.purpose?.trim().length > 0))
check('every section has guidance', blueprint.sections.every((s) => s.include?.length > 0))
check('story strength matches ranking', blueprint.story_strength === stories.selected.total)

// Academic integrity: the blueprint must not be a finished essay.
const prose = blueprint.sections.map((s) => s.include.join(' ')).join(' ')
check('blueprint is guidance, not a drafted essay', prose.length < 4000, `${prose.length} chars of guidance`)

// ---- 5. Persistence + resume ---------------------------------------------

step('5. PERSISTENCE & RESUME')
const snapshot = await call(`/api/sessions/${sessionId}/state`)
log(`  turns persisted:   ${snapshot.turns.length}`)
log(`  entities persisted: ${snapshot.state.entities.length}`)
log(`  status:            ${snapshot.session.status}`)

check('all turns persisted', snapshot.turns.length === ANSWERS.length * 2 + 2, `${snapshot.turns.length} turns`)
check('entities persisted', snapshot.state.entities.length > 0)
check('blueprint readable on resume', Boolean(snapshot.blueprint))
check('resumed blueprint still totals 350', snapshot.blueprint.sections.reduce((s, x) => s + x.word_count, 0) === 350)
check('voice/text source recorded', snapshot.turns.every((t) => ['voice', 'text'].includes(t.source)))

const reread = await call(`/api/sessions/${sessionId}/blueprint`)
check('blueprint GET endpoint works', reread.total === 350)

// ---- 6. Error handling ----------------------------------------------------

step('6. ERROR HANDLING')
const missing = await fetch(`${BASE}/api/sessions/00000000-0000-0000-0000-000000000000/state`)
check('unknown session returns 404', missing.status === 404, `got ${missing.status}`)

const bad = await fetch(`${BASE}/api/sessions/${sessionId}/message`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ answer: '' }),
})
check('empty answer rejected', bad.status === 400, `got ${bad.status}`)

const noAudio = await fetch(`${BASE}/api/sessions/${sessionId}/transcribe`, { method: 'POST', body: new FormData() })
check('transcribe without audio rejected', noAudio.status === 400, `got ${noAudio.status}`)

// ---- 7. TTS ---------------------------------------------------------------

step('7. TEXT TO SPEECH')
const tts = await fetch(`${BASE}/api/tts`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ text: 'Think about an experience that changed the way you see yourself.' }),
})
if (tts.status === 200) {
  const buffer = await tts.arrayBuffer()
  const header = new TextDecoder().decode(new Uint8Array(buffer.slice(0, 4)))
  log(`  audio: ${buffer.byteLength} bytes, header "${header}"`)
  check('TTS returns WAV audio', header === 'RIFF' && buffer.byteLength > 1000)
} else {
  log(`  TTS unavailable (${tts.status}) — client falls back to browser speech synthesis`)
  check('TTS degrades cleanly', tts.status === 204, `got ${tts.status}`)
}

// ---- Summary --------------------------------------------------------------

step(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
log(`session id: ${sessionId}`)
process.exit(failures === 0 ? 0 : 1)
