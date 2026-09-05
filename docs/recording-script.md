# Video recording script — Hello Ivy

A word-for-word script for the submission recording: **running the code → the
full conversation → the structure breakdown.**

Target length **8–10 minutes**. Every button name and on-screen label below has
been checked against the current build, so you can follow it literally.

Lines marked ▶ are **spoken**. Everything else is what you do on screen.

---

## Pre-flight (do this BEFORE you hit record)

```bash
npm install
npm run migrate        # once, ever — creates the Supabase schema
```

Checklist:

- [ ] `.env` has `GOOGLE_GENERATIVE_AI_API_KEY` + the Supabase variables
- [ ] **Chrome or Edge** (best `MediaRecorder` support) — not Firefox
- [ ] Microphone works; grant permission **once before recording** so the
      browser prompt does not eat your opening
- [ ] Record **system audio** too, or Ivy's voice will not be on the tape
- [ ] Close other tabs; set browser zoom to 100%
- [ ] Editor font size up — the code has to be legible at video resolution
- [ ] **Know your story.** Pick one real experience and have 4–5 answers in
      mind. The demo only lands if the answers are genuinely yours.

> One warning: do not have `.env` open, visible in a sidebar, or in your shell
> history when you record. It holds live credentials.

---

## Part 1 — Repository walkthrough (0:00–1:30)

Start in the editor with the file tree visible. Do **not** start with the app.

▶ "This is Hello Ivy — a voice-first AI essay brainstormer. A student talks to
it about their life, and it produces a 350-word essay structure. The important
part is what it does not do: it never writes the essay, and it never invents a
fact about the student."

Expand the tree and point at each directory as you name it:

▶ "Four directories matter. `lib/agents` holds the four AI agents — the
interviewer, the extractor, the strategist, and speech-to-text and
text-to-speech. `lib/domain` is the deterministic engine: completeness scoring,
story ranking, and the word budget. `app/api` is eight route handlers. And
`tests` covers the parts that must never be wrong."

Open `lib/agents/provider.ts`. Scroll to `generateStructured`.

▶ "Every model call goes through this one function. Structured output against a
Zod schema, so malformed JSON is a caught error rather than a crash, and
transient failures retry twice with backoff — the free tier rate-limits a lot.
Swapping Gemini for another vendor is a one-file change."

Now run the tests **on camera**:

```bash
npm test
```

▶ "Thirty-nine tests, all green — over the word budget, the completeness
calculation, and story scoring. These are the pieces where a wrong answer is
invisible to the user, so they are the pieces that are tested."

Start the app:

```bash
npm run dev
```

---

## Part 2 — The interface (1:30–2:15)

Open `http://localhost:3000`.

Walk the header left to right:

▶ "Bryn Mawr College, Essay 1: Personal Story. A 350-word limit, and a session
timer."

Click **Read more** to expand the real prompt. Read the first line aloud.

▶ "That is the actual Bryn Mawr prompt. Everything the app decides is anchored
to it."

---

## Part 3 — Proving the voice is real (2:15–3:00)

Click **Listen**.

▶ "That is a live text-to-speech call. Gemini returns raw PCM and the server
wraps it in a WAV header before it reaches the browser. If TTS is ever
unavailable, it falls back to the browser's own speech synthesis — Ivy always
has a voice."

Let it read a few seconds, then click **Stop**.

▶ "Interruptible, which matters — nobody wants to sit through audio they have
already read."

---

## Part 4 — First voice answer (3:00–3:45)

Click the **microphone**. Show the *Listening…* state.

▶ "The waveform is real amplitude off an AnalyserNode, not a looping
animation — so you can see it actually hearing you."

**Speak your first answer — 20–30 seconds, one specific experience.** Not a
summary. A moment.

Click **Stop**. Narrate the pipeline as each state appears:

▶ "Transcribing… then the transcript appears… then it is choosing a follow-up."

When Ivy's question arrives and is spoken aloud:

▶ "Note it did not ask the next question on a list. It read what I said and
picked the follow-up that closes the biggest gap."

---

## Part 5 — The adaptive conversation (3:45–6:30)

**The core of the demo. Four or five more voice answers.** Do not rush — let the
panel fill in.

**After turn 2 — traceability.** Point at the **Live essay strategy** panel.
Hover a value or skill chip.

▶ "Every chip carries a confidence score and the exact sentence I said to
produce it. Nothing appears in this panel that I did not say out loud. If the
model cannot supply a verbatim quote, the entity is dropped before it is ever
stored."

**After turn 3 — the missing list.** Read the *Still missing* items aloud.

▶ "That list is shrinking, and Ivy's next question targets the top item."

**After turn 4 — the deliberate vague answer.** This is the moment worth
engineering for, so set it up:

▶ "I am going to answer this one badly on purpose."

Give a vague, motivation-only answer — *"I just really care about helping
people"* — with no concrete action. Ivy will push for a specific example.

▶ "A static questionnaire would have moved on. It noticed I gave motivation
instead of action, and re-asked more specifically."

Read the *"Ivy is asking this because…"* line under the card.

**Completeness.**

▶ "That percentage is not a question counter. It is a weighted function of which
evidence dimensions are actually covered — so a vague answer can move the
conversation forward without moving the number."

---

## Part 6 — Review (6:30–7:30)

**Review & Edit Structure** is now enabled. Before clicking, hover it:

▶ "This button was disabled until the server decided there was enough
evidence — the narrative spine, plus at least one supported value and one
supported skill above 0.6 confidence. Not after N questions."

Click it. On **Your Story So Far**, scroll slowly through the rows: core
experience, challenge, action, impact, reflection, values, skills, perspective
shift, future goal, college connection.

▶ "Ten dimensions, each with a confidence score, and underneath each one — my
own words. This is the audit trail. A student can see exactly why the app
believes what it believes about them."

If you mentioned more than one experience, show **Ivy compared your
experiences** and the **Strongest** tag.

▶ "It ranked them and explains in plain language why this one is stronger."

---

## Part 7 — The blueprint (7:30–9:00)

Click **Build My Essay Strategy**. Show *Building your 350-word blueprint…*.

When it lands, walk it top to bottom:

▶ "Core story. Central message. Why this story works — drawn from my material,
not generic advice."

Note the **Story strength** caveat.

▶ "That is an internal selection signal, not an admissions score, and it says
so on screen."

Expand one section. Read out: the word count, the purpose, what to include, and
**Your own words to draw on**.

▶ "This is a structure, not an essay. It tells me what each paragraph has to do
and which of my own sentences to build it from. The writing stays mine — which
is the whole point for a college application."

**Land on the word total.** Point at the **Verified exact** badge:

▶ "350 of 350, verified exact. The model proposes a shape, but it does not do
arithmetic. The server rebalances the allocation using largest-remainder
apportionment, then asserts the total twice — in the strategist and again in the
route. A wrong number physically cannot reach this screen."

Click **Copy strategy**, show it flip to **Copied**.

---

## Part 8 — Structure breakdown (9:00–10:00)

Back to the editor. Open `docs/architecture.md` and show the diagram.

**The one idea to state clearly:**

▶ "The model reports observations. The server owns every derived value.
Completeness, phase, readiness, story ranking, and the word budget are all
deterministic TypeScript. The LLM never does arithmetic and never decides when
the conversation is finished. That is what makes the output trustworthy."

Show the three seams — `provider.ts`, `stt.ts`, `tts.ts`.

▶ "Three files isolate the vendor. Gemini could be swapped for anything without
touching a route or a component."

**Closer — session resume.** Return to the browser and **refresh the page**.

▶ "State lives in Postgres, not the browser. A student can close the tab
mid-conversation and pick up exactly where they left off — transcript,
evidence, and blueprint all intact."

▶ "That is Hello Ivy. Thanks for watching."

---

## If you are asked follow-up questions

**"Why voice?"** Students talk about themselves far more naturally than they
write about themselves. Asked to type, a 17-year-old produces résumé language.
Asked out loud, they tell a story.

**"How do you stop it hallucinating a student's life?"** Three enforcement
points, not just a prompt. The extractor must supply a verbatim quote for every
entity; the route drops anything under 0.6 confidence before storage; the
strategist gets the student's own words as the only permitted source of facts.
Sensitive traits are explicitly excluded.

**"Why not let the model count words?"** Because it cannot do it reliably.
Largest-remainder apportionment on the server, asserted twice.

**"How does it know when to stop asking?"** Semantic completeness, not question
count — the narrative spine plus future goal and college connection, *and* at
least one value and one skill above 0.6 confidence.

**"What if the model returns nonsense?"** Zod-schema structured output, so
malformed JSON is caught. Two retries with backoff on transient failures. The
student's answer is persisted *before* the model call, so nothing is lost.

**"Where next?"** Gemini's realtime bidirectional voice API removes the
record → transcribe → respond round-trip, and one story profile could serve many
college prompts.

---

## Recovery — if something breaks on camera

Keep going. A recovered failure demonstrates the error handling.

| Problem | What to do |
|---|---|
| Model rate-limited (free tier) | The retry is automatic. Say: *"Free-tier rate limit — it backs off and retries twice."* Wait. |
| Mic permission denied | Use the text composer. The whole flow works typed; say so and continue. |
| TTS silent | It falls back to browser speech synthesis. Point that out as designed behavior. |
| A response is slow | Talk over it — explain the pipeline while it works. |
| Something genuinely breaks | Refresh. Session resume restores state, which is itself a feature worth showing. |
