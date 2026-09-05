# Hello Ivy — Voice-Based AI Essay Brainstormer

> *Your story. Your voice. Your essay strategy.*

A voice-first brainstorming coach for high-school students writing college essays. Ivy interviews the student by voice, adapts every question to what is still missing from their story, extracts only what the transcript actually supports, and produces an essay **structure** with a programmatically verified word budget.

Ivy does not write the essay. That is the point.

---

## The problem

A college essay prompt like this one asks a student to be introspective on demand:

> *"How has your life experience contributed to your personal story—your character, values, perspectives, or skills—and what you want to pursue at Bryn Mawr College?"* — **350 words**

Most students freeze. The blank page gives no help, and generic AI writing tools solve the wrong problem: they produce an essay that is not the student's, in a voice that is not theirs, using experiences they may never have had.

## The solution

Ivy inverts the flow. Instead of generating prose, she **runs an interview** and then hands back a strategy:

1. She talks with the student, adapting each question to the highest-value gap in their story.
2. She extracts values, skills and perspective shifts — each one tied to the student's own words.
3. She ranks the experiences the student raised and picks the strongest.
4. She returns a section-by-section blueprint totalling **exactly 350 words**.

The student writes the essay. Ivy makes sure they know what to write and why it works.

## Why voice-first

Students talk about themselves far more naturally than they write about themselves. Asked to *type* about a moment that changed them, a 17-year-old produces a paragraph of résumé language. Asked out loud, they tell a story — with the specifics, hesitations and asides that make an essay worth reading. Voice also makes the interview feel like a conversation with a coach rather than a form, which is what keeps the answers honest.

Comparable products in the college-guidance space include **Unifrog**, **Sups.ai**, **Ambitio** and **Kollegio**. This prototype's specific emphasis — an adaptive voice interview whose every conclusion is traceable to a transcript quote, ending in an exactly-budgeted structure rather than a draft — is the angle it explores.

---

## Features

| | |
|---|---|
| **Voice-first story discovery** | Real `MediaRecorder` capture, real speech-to-text, spoken replies. The microphone is not decorative. |
| **Adaptive questioning** | Every question targets the highest-value *missing* dimension. There is no fixed question list. |
| **Evidence traceability** | Every value, skill and perspective shift carries a confidence score and the student's own quote. |
| **Story ranking** | When several experiences emerge, ten deterministic criteria decide which is strongest — and explain why. |
| **Semantic completion** | The interview ends when the story is complete, not after N questions. |
| **Live essay strategy** | The right-hand panel fills in as the conversation happens. |
| **Exact word budget** | Section totals are rebalanced server-side and asserted. The LLM never does the arithmetic. |
| **Academic integrity** | Nothing without transcript support is ever shown, and no finished essay is produced. |
| **Session resume** | Close the tab and come back; the conversation, state and blueprint are all restored. |
| **Realtime** | Supabase Realtime keeps the transcript live across tabs and devices. |

---

## Product flow

```
Start session
   ↓  prompt analysed once, cached on the session
Instructions  ──── Listen button reads them aloud (real TTS)
   ↓
Voice interview  ←──────────────┐
   ↓  answer captured           │
Story extraction                │  adaptive loop
   ↓  merged into server state  │
Completeness check ─────────────┘  repeats until the story is complete
   ↓
Story ranking          10 criteria, deterministic
   ↓
Story review           "Your Story So Far" — confirm / edit / remove
   ↓
350-word blueprint     section allocation validated to the exact total
```

## AI architecture

Four agents, each with a narrow job. **The model reports observations; the server owns all derived state.**

```
                    ┌──────────────────────┐
  Essay prompt ────►│   Prompt Analyzer    │  once per session
                    └──────────┬───────────┘
                               ▼
                    ┌──────────────────────┐
  Student answer ──►│ Interviewer +        │  once per turn
                    │ Story Extractor      │
                    └──────────┬───────────┘
                               │ newly_covered, entities, candidate stories
                               ▼
        ┌──────────────────────────────────────────┐
        │  DETERMINISTIC — no LLM involved         │
        │  · completeness   (weighted, 0..1)       │
        │  · missing        (which gaps remain)    │
        │  · phase          (derived from gaps)    │
        │  · readiness      (spine + value + skill)│
        │  · story ranking  (10 weighted criteria) │
        │  · word budget    (largest-remainder)    │
        └──────────────────┬───────────────────────┘
                           ▼
                    ┌──────────────────────┐
                    │     Strategist       │  once, at the end
                    └──────────┬───────────┘
                               ▼
                    350-word blueprint  ── rebalanced, then asserted
```

### Why the split matters

The model is good at understanding language and bad at arithmetic, consistency and honesty about its own confidence. So:

- **Completeness** is a weighted function of which dimensions are covered — not a number the model invents.
- **Phase** is derived from the first evidence gap, so the interview cannot get stuck or loop.
- **Story ranking** is ten deterministic criteria over the transcript, so the same conversation always ranks the same way and "why A beat B" is explainable.
- **The word budget** is rebalanced with largest-remainder apportionment and then `assert`ed. A wrong total cannot reach the client.
- **Low-confidence extractions are dropped** at the route boundary (`confidence >= 0.6`), before they can ever be displayed.

## Prompt architecture

| Agent | File | Temp | Job |
|---|---|---|---|
| Prompt Analyzer | `lib/agents/promptAnalyzer.ts` | 0.2 | What evidence does this prompt need? What is the best opening question? |
| Interviewer + Extractor | `lib/agents/interviewer.ts` | 0.5 | Respond, ask the next best question, extract supported entities. |
| Strategist | `lib/agents/strategist.ts` | 0.4 | Turn the winning story into a sectioned strategy. |

Every agent uses **structured output against a Zod schema**, so malformed JSON is a caught error rather than a crash. The extractor prompt is explicit: *if you cannot quote it, do not extract it.*

`reason_for_question` is returned to the UI as a short, product-safe rationale. Internal reasoning is never exposed.

## Voice flow

```
 Microphone ──► MediaRecorder ──► Blob ──► POST /transcribe ──► Gemini STT
                                                                    │
                                            transcript ◄────────────┘
                                                 │
                                                 ▼
                                    POST /message ──► Interviewer
                                                 │
                        assistant_message ◄──────┘
                                 │
                                 ▼
                     POST /tts ──► Gemini TTS ──► WAV ──► <audio>
                                                             │
                          (204 / failure) ──► browser SpeechSynthesis fallback
```

**Voice states**: `idle` · `requesting_permission` · `listening` · `processing` · `thinking` · `speaking` · `error` — each with its own UI treatment. The waveform is driven by measured RMS amplitude from an `AnalyserNode`, not an animation loop. Starting the microphone stops Ivy mid-sentence (barge-in).

## Academic integrity

Ivy **may**: ask questions, organise experiences, identify themes, suggest narrative strategy, allocate words, highlight evidence.

Ivy **must not**: invent experiences, family circumstances, achievements, extracurriculars, emotions, or values without evidence — or produce a finished essay.

This is enforced in three places, not just in the prompt:

1. The extractor must supply a verbatim quote for every entity.
2. The route drops anything below 0.6 confidence before it is stored or displayed.
3. The strategist receives the student's own words as the only permitted source of facts, and returns *guidance* fields rather than prose.

Sensitive traits (health, religion, sexuality, ethnicity, immigration status, family finances) are explicitly excluded from extraction.

## Privacy

- Raw audio is **never persisted**. It exists in memory for the duration of the transcription request and is then discarded.
- The microphone stream's tracks are stopped the moment recording ends, so the browser's recording indicator goes off.
- A privacy note sits directly under the composer, where the microphone is.
- The service-role Supabase key is read from a non-`NEXT_PUBLIC` variable so it cannot be inlined into a client bundle.

---

## Tech stack

**Frontend** — Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · Lucide · Zod
**Backend** — Next.js Route Handlers (Node runtime) · Zod validation · Vercel AI SDK
**AI** — Google Gemini (free tier) behind swappable provider interfaces:
`gemini-3.5-flash-lite` (interview turns) · `gemini-3.5-flash` (strategy) · `gemini-3.5-transcribe` (STT) · `gemini-3.1-flash-tts-preview` (TTS)
**Database** — Supabase / PostgreSQL, with Realtime on the transcript
**Deployment** — Vercel (frontend + API), Supabase (database)

> **A note on the backend.** The original specification called for a separate Python/FastAPI service. This implementation puts the same agent architecture in Next.js route handlers instead: the agents, schemas, services and prompts are all present as discrete modules (`lib/agents`, `lib/domain`), but they run in one deployable rather than two. The trade-off is one process and one deploy instead of a Python environment plus a separate host — appropriate for a prototype whose database was already live. The `LanguageModelProvider` / `SpeechToTextProvider` / `TextToSpeechProvider` seams are still in place, so the agents could be lifted into a FastAPI service without touching the UI.

## Repository structure

```
app/
  api/
    sessions/route.ts                       POST   create session
    sessions/[id]/state/route.ts            GET    full hydration / resume
    sessions/[id]/message/route.ts          POST   one adaptive interview turn
    sessions/[id]/transcribe/route.ts       POST   audio → transcript
    sessions/[id]/stories/route.ts          GET    ranked candidate stories
    sessions/[id]/generate-blueprint/route.ts POST rank → strategise → persist
    sessions/[id]/blueprint/route.ts        GET    read back a blueprint
    tts/route.ts                            POST   text → WAV
  page.tsx                                  screen orchestration
  globals.css                               design tokens + all styling

components/ivy/
  Header.tsx           IvyAssistant.tsx     Waveform.tsx
  InstructionsCard.tsx Composer.tsx         ConversationPanel.tsx
  StrategyPanel.tsx    StoryReview.tsx      EssayBlueprint.tsx
  ErrorBanner.tsx

lib/
  agents/     provider.ts  promptAnalyzer.ts  interviewer.ts  strategist.ts
              stt.ts  tts.ts
  domain/     types.ts  completeness.ts  scoring.ts  wordBudget.ts
              repository.ts  seed.ts
  voice/      useRecorder.ts  useSpeech.ts
  api/        client.ts  respond.ts
  supabase/   client.ts  server.ts

supabase/migrations/    0002_session_state.sql
scripts/migrate.mjs     idempotent migration runner
tests/                  35 tests over the deterministic engines
docs/                   architecture · product-flow · api · database · demo-script · recording-script
```

## Database

Eight concerns across six tables (plus a migrations ledger):

| Table | Holds |
|---|---|
| `essay_sessions` | College, prompt, word limit, status, **cached prompt analysis**, **covered flags**, phase, readiness |
| `conversation_turns` | Every turn, with `source` = `voice` \| `text` |
| `story_entities` | Extracted values / skills / perspective shifts, each with confidence + evidence quote |
| `story_candidates` | Each experience raised, with its ten-criterion scores and which one was selected |
| `essay_blueprints` | Core story, central message, why it works, verified total |
| `essay_sections` | Per-section allocation, purpose, guidance, evidence, transition |

Realtime is enabled on `conversation_turns`, `essay_sessions` and `story_entities`.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/sessions` | Create a session, analyse the prompt, seed the greeting |
| `GET` | `/api/sessions/{id}/state` | Full hydration — session, analysis, state, turns, blueprint |
| `POST` | `/api/sessions/{id}/message` | One adaptive turn |
| `POST` | `/api/sessions/{id}/transcribe` | Audio → transcript |
| `GET` | `/api/sessions/{id}/stories` | Ranked stories + comparison |
| `POST` | `/api/sessions/{id}/generate-blueprint` | Rank → strategise → persist |
| `GET` | `/api/sessions/{id}/blueprint` | Read back a blueprint |
| `POST` | `/api/tts` | Text → WAV (204 when unavailable) |

Errors share one shape — `{ error, code }` — where `code` is one of `missing_api_key`, `model_failed`, `invalid_input`, `not_found`, `database_unavailable`, `not_ready`, `server_error`. The UI renders a specific message per code.

---

## Local setup

### 1. Install

```bash
npm install
```

### 2. Configure

```bash
cp .env.example .env
```

**Gemini (free).** Create a key at <https://aistudio.google.com/apikey> and set:

```
GOOGLE_GENERATIVE_AI_API_KEY=your-key-here
```

The free tier covers everything this app uses: the interview loop, extraction, the strategist, speech-to-text and text-to-speech.

**Supabase.** From your project's dashboard → Project Settings:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key>
POSTGRES_URL_NON_POOLING=<direct connection string>
```

### 3. Migrate

```bash
npm run migrate
```

Idempotent — it tracks applied files in `_ivy_migrations` and skips them on re-runs.

### 4. Run

```bash
npm run dev          # http://localhost:3000
```

### Other commands

```bash
npm test             # 35 tests over the deterministic engines
npm run typecheck    # tsc --noEmit
npm run build        # production build
```

## Testing

### Unit tests — the logic that must never be wrong

```bash
npm test          # 39 tests, all passing
```

- **Word budget** (11) — exact totals, over/under-allocation, zeros, negatives, proportion preservation, the 5-word floor, non-350 limits, and that `assertBudget` throws.
- **Completeness** (18) — monotonic progress, readiness gating, low-confidence rejection, phase derivation at every step, entity de-duplication, and coverage reconciliation from evidence.
- **Scoring** (10) — score bounds, determinism, detailed beats thin, evidence effects, ranking order, advantage explanations.

### End-to-end — the real flow against live services

```bash
npm run dev             # in one terminal
npm run test:e2e        # in another
```

Walks the full product flow with a realistic seven-turn student story and asserts 32 checks: session creation, adaptive questioning, evidence extraction with quotes, confidence filtering, story ranking, **an exactly-350 word budget**, persistence, resume, error handling and TTS audio output.

```
PASS  reached readiness — completeness 100%
PASS  word total is EXACTLY 350 — got 350
PASS  every entity carries a quote
PASS  every entity is >= 0.6 confidence
PASS  blueprint is guidance, not a drafted essay
PASS  TTS returns WAV audio
ALL CHECKS PASSED
```

### Realtime

```bash
npm run test:realtime
```

Subscribes with the anon key (so RLS is exercised) and confirms both the student turn and Ivy's reply arrive over the websocket.

## Deployment

**Frontend + API → Vercel.** Import the repo, add the environment variables from `.env.example`, deploy. `maxDuration` is already set per route (60s for turns, 90s for blueprint generation).

**Database → Supabase.** Run `npm run migrate` against the production connection string.

Because the LLM, STT and TTS all sit behind provider interfaces, moving off Gemini means editing `lib/agents/provider.ts`, `stt.ts` and `tts.ts` — nothing above them changes.

## Demo scenario

See `docs/recording-script.md` for a word-for-word recording script (every on-screen label verified against the build), or `docs/demo-script.md` for the shorter outline. In short: start the app, hit **Listen**, hold the microphone and talk about a real experience, watch the right-hand panel fill in with values and quotes as you speak, and finish on a 350-word blueprint whose total is verified on the server.

## Assumptions made

- **Backend runtime.** Next.js route handlers instead of a separate FastAPI service — see the note under *Tech stack*.
- **Model provider.** Gemini's free tier, chosen because it covers LLM + STT + TTS with one key and enforces JSON schemas strictly. The provider seams keep this swappable.
- **Authentication.** Sessions are anonymous and keyed by `localStorage`, with open RLS policies for the `anon` role. `user_id` exists on `essay_sessions` for when Supabase Auth is added.
- **Reference screenshots.** The `1.png` / `2.png` / `3.png` / `Ivy animation.gif` assets were not present in the repository, so the interface was built from the written specification of the visual language: light blue/white ground, gradient hairline card borders, word pill, session timer, two-column brainstorming layout, small type and generous whitespace. The Ivy mark is a CSS/Framer Motion assistant that reacts to real voice state rather than a GIF.
- **Screens 1–3 are one continuous view.** The reference describes an empty state, an information-capture state and a two-column brainstorming state. These are rendered as states of a single conversation screen — the strategy column appears once there is something to show — rather than as separate routes, which is what the "live strategy updates as you talk" requirement implies.

## Future improvements

- Supabase Auth so students keep a history across devices.
- Streaming responses, so Ivy starts speaking before the full turn resolves.
- A story-map visualisation (experience → challenge → action → impact → reflection → value → goal).
- PDF export of the strategy.
- Gemini's realtime bidirectional voice API to remove the record → transcribe → respond round-trip.
- Multi-essay sessions that reuse one story profile across several college prompts.
- Sentry wiring — the error codes and boundaries are already in place for it.
