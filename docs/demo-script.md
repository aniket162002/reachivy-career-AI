# Demo script

Target: **5–8 minutes**, recorded start to finish — from running the code, through the conversation, to the structure breakdown.

## Before you record

```bash
npm install
npm run migrate          # once
npm test                 # 39 tests, all green — worth showing on camera
```

Check `.env` has `GOOGLE_GENERATIVE_AI_API_KEY` and the Supabase variables.

Use **Chrome or Edge** (best `MediaRecorder` support), allow microphone access when prompted, and record with system audio so Ivy's voice is captured.

Have a real experience in mind. The demo is only convincing if the answers are genuinely yours — which is also the point of the product.

---

## 0:00 — Repository and startup

Show the tree briefly: `lib/agents` (the four agents), `lib/domain` (the deterministic engines), `app/api` (eight routes), `tests`.

Say what this is:

> "This is a voice-first AI essay brainstormer. It interviews a student about their life, extracts only what they actually said, and produces a 350-word essay structure. It does not write the essay."

Run the tests, then the app:

```bash
npm test
npm run dev
```

Point out: **35+ tests over the word budget, completeness and scoring engines** — the parts that must never be wrong.

## 0:45 — The interface

Open `http://localhost:3000`.

Walk the header: Hello Ivy mark, *New Essay Brainstorming*, **Bryn Mawr College, Essay 1: Personal Story**, the **350 words** pill, session timer, avatar.

Expand **Read more** to show the actual essay prompt.

## 1:10 — Listen (proving TTS is real)

Click **Listen**. Ivy reads the instructions aloud.

> "That's a real text-to-speech call — Gemini returns raw PCM, the server wraps it in a WAV header. If TTS is ever unavailable it falls back to the browser's speech synthesis, so Ivy always has a voice."

Click **Stop** mid-sentence to show it is interruptible.

## 1:40 — First voice answer

Click the microphone. Show the permission prompt, then the listening state: **Listening…**, the live waveform, the elapsed timer, Stop.

> "The waveform is driven by real amplitude from an AnalyserNode, not an animation loop."

Speak your opening answer — 20–30 seconds about a specific experience.

Click **Stop**. Show *Transcribing…* → the transcript appearing → *Finding the strongest follow-up…* → Ivy's question, spoken aloud.

## 2:15 — 5:00 — The adaptive conversation

Keep answering by voice. Four or five more turns. As you go, point out:

**The Live Strategy panel filling in.** Values and skills appear as chips. **Hover one** — the tooltip shows the confidence percentage *and the exact sentence you said*.

> "Every conclusion is traceable to a transcript quote. Nothing appears here that you didn't say."

**The "Still missing" list shrinking.** Read it aloud once, then note that Ivy's next question targets the top item.

**The completeness percentage.** Not a question counter — a weighted function of which evidence dimensions are covered.

**One deliberate moment worth engineering:** answer a question *vaguely* on purpose. Ivy will push for a concrete example rather than moving on. Call it out:

> "A static questionnaire would have advanced. It noticed I gave motivation instead of action, and re-asked more specifically."

Read the *"Ivy is asking this because…"* line under the card — the product-safe rationale.

## 5:00 — Review

Once the story is complete, **Review & Edit Structure** enables.

> "That button was disabled until the server decided there was enough evidence — the narrative spine, plus a supported value, plus a supported skill. Not after N questions."

Click through to **Your Story So Far**. Scroll the rows: core experience, challenge, action, impact, reflection, values, skills, perspective shift, future goal, college connection — each with a confidence score and **your own words underneath**.

If you mentioned more than one experience, show the story ranking and the plain-language explanation of why the winner is stronger.

## 6:00 — The blueprint

Click **Build My Essay Strategy**. Show *Building your 350-word blueprint…*.

Then the result:

- **Core story** and **central message**
- **Why this story works** — specific reasons drawn from your material
- **Story strength** — note the caveat text: an internal selection signal, not an admissions score

Scroll the sections. For one of them, read out: the word count, the purpose, what to include, **the quote from your own transcript**, and the questions it must answer.

> "This is a structure, not an essay. It tells me what to write and which of my own words to use. The writing stays mine."

**Land on the word total.** Point at the **Verified exact** badge:

> "350 out of 350. The model proposes a shape; the server rebalances it with largest-remainder apportionment and then asserts the total. A wrong number physically cannot reach this screen."

Click **Copy strategy** to show the export.

## 7:00 — Architecture (brief)

Open `docs/architecture.md` and show the system diagram.

The one idea worth stating clearly:

> "The model reports observations. The server owns all derived state. Completeness, phase, readiness, story ranking and the word budget are all deterministic TypeScript — the LLM never does arithmetic and never decides when it's finished."

Show the provider seams — `provider.ts`, `stt.ts`, `tts.ts` — and note that swapping Gemini for another vendor is a three-file change.

## 7:30 — Session resume (optional, strong closer)

Refresh the page. Everything comes back: transcript, extracted evidence, blueprint.

> "State lives in Postgres, not the browser. Close the tab mid-conversation and you pick up exactly where you left off."

---

## Talking points if you are asked

**"Why voice?"** Students talk about themselves far more naturally than they write about themselves. Asked to type, a 17-year-old produces résumé language. Asked out loud, they tell a story.

**"How do you stop it hallucinating a student's life?"** Three enforcement points, not just a prompt: the extractor must supply a verbatim quote for every entity; the route drops anything under 0.6 confidence before it is stored; the strategist gets the student's own words as the only permitted source of facts. Sensitive traits are explicitly excluded.

**"Why not just have the model count the words?"** Because it cannot reliably. The allocation is rebalanced by largest-remainder apportionment and then `assert`ed twice — in the strategist and again in the route.

**"How does it know when to stop asking?"** Semantic completeness, not question count. The narrative spine plus future goal and college connection must be covered, *and* at least one value and one skill/perspective must exist above 0.6 confidence.

**"What happens if the model returns nonsense?"** Structured output against a Zod schema, so malformed JSON is a caught error. Transient failures retry twice with backoff. The student's answer is persisted *before* the model call, so nothing is lost and they can retry.

**"Where would this go next?"** Gemini's realtime bidirectional voice API removes the record → transcribe → respond round-trip, and one story profile could serve many college prompts.
