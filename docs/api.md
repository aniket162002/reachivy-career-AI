# API reference

Base URL: `/api`. All handlers run on the Node runtime. Every request body is validated with Zod; every failure returns `{ error, code }`.

---

## `POST /api/sessions`

Creates a brainstorming session, runs the Prompt Analyzer once, and seeds the transcript with Ivy's greeting and opening question.

**Body** (all optional — defaults to the Bryn Mawr seed session)

```json
{
  "college": "Bryn Mawr College",
  "essayTitle": "Essay 1: Personal Story",
  "prompt": "How has your life experience contributed to your personal story…",
  "wordLimit": 350
}
```

**201**

```json
{
  "sessionId": "682a283f-913f-4e56-8c9f-b7f15ff5a79f",
  "analysis": {
    "word_limit": 350,
    "required_dimensions": ["specific_experience", "challenge", "action", "impact",
                            "reflection", "values", "skills", "future_goal", "college_connection"],
    "recommended_story_type": "transformational personal experience",
    "desired_narrative_arc": ["specific experience", "challenge/action", "reflection",
                              "growth", "future direction"],
    "opening_question": "Can you think of a specific moment that fundamentally shifted how you see your place in the world?"
  },
  "turns": [{ "id": "…", "speaker": "ivy", "content": "Hey! I'm Ivy…", "source": "text" }]
}
```

The word limit is a product constraint and is always forced back to the requested value, even if the model returns something else.

---

## `GET /api/sessions/{id}/state`

Full hydration — everything needed to render any screen. Used on first load and for session resume.

**200**

```json
{
  "session": { "id": "…", "college": "Bryn Mawr College", "essayTitle": "Essay 1: Personal Story",
               "prompt": "…", "wordLimit": 350, "status": "blueprint",
               "startedAt": "2026-09-03T11:49:20Z", "completedAt": null },
  "analysis": { "…": "cached prompt analysis" },
  "state": {
    "covered": { "specific_experience": true, "challenge": true, "…": false },
    "entities": [{ "type": "value", "name": "Helpfulness", "summary": "…",
                   "evidence": "I decided to help instead of just noticing…", "confidence": 0.95 }],
    "candidates": [{ "id": "lincoln-community-center", "title": "…", "summary": "…" }],
    "missing": ["skills"],
    "completeness": 0.91,
    "phase": "strategy",
    "readyForStrategy": true
  },
  "turns": [{ "id": "…", "speaker": "student", "content": "…", "source": "voice" }],
  "blueprint": null
}
```

`state` is always **recomputed** from stored covered-flags and entities rather than read from a cached copy, so it can never drift.

---

## `POST /api/sessions/{id}/message`

One adaptive interview turn. `maxDuration` 60s.

**Body**

```json
{ "answer": "When I volunteered at the Lincoln community center…", "source": "voice" }
```

**200**

```json
{
  "studentTurn": { "id": "…", "speaker": "student", "content": "…", "source": "voice" },
  "ivyTurn": { "id": "…", "speaker": "ivy", "content": "…", "source": "text" },
  "assistant_message": "That sounds like a really practical problem to step into. What specific action did you take?",
  "reason_for_question": "The student shared a specific experience and challenge, but the action they took is still missing.",
  "phase": "deep_dive",
  "covered_dimensions": ["specific_experience", "challenge"],
  "missing_dimensions": ["action", "impact", "reflection", "values", "skills", "future_goal", "college_connection"],
  "completeness": 0.26,
  "ready_for_strategy": false,
  "entities": [{ "type": "experience", "name": "Lincoln community center volunteering",
                 "summary": "…", "evidence": "When I volunteered at the Lincoln…", "confidence": 0.95 }],
  "candidates": [{ "id": "lincoln-community-center", "title": "…", "…": "…" }]
}
```

Server-side pipeline:

1. Persist the student's turn **before** calling the model — a model failure never loses their words.
2. Call the interviewer/extractor.
3. Drop any entity below `0.6` confidence or with an empty evidence quote.
4. Merge entities (de-duplicated by type+name, higher confidence wins).
5. Reconcile coverage from entities, then recompute completeness, phase and readiness.
6. Persist entities, candidates and state.

`reason_for_question` is a short, product-safe rationale. Internal reasoning is never exposed.

---

## `POST /api/sessions/{id}/transcribe`

Audio → transcript. `multipart/form-data` with an `audio` field. `maxDuration` 60s.

Accepts `audio/webm`, `ogg`, `mp4`, `mpeg`, `wav`, `aac`; max 8 MB.

**200** → `{ "text": "When I volunteered at the Lincoln community center…" }`

**Audio is never persisted.** It exists in memory for the duration of this request and is then discarded.

| Status | Condition |
|---|---|
| 400 | No audio, or an empty blob |
| 413 | Recording over 8 MB |
| 415 | Unsupported format |
| 422 | No intelligible speech detected |

---

## `GET /api/sessions/{id}/stories`

Ranks every candidate experience. Deterministic, so it is safe to call repeatedly.

**200**

```json
{
  "stories": [{
    "id": "lincoln-community-center",
    "title": "Lincoln Community Center Volunteering",
    "scores": { "specificity": 8.4, "authenticity": 7.1, "reflection_depth": 9.2,
                "personal_growth": 8.0, "emotional_depth": 5.4, "prompt_relevance": 10,
                "evidence_strength": 9.1, "future_connection": 6.2,
                "college_connection": 8.0, "distinctiveness": 6.8 },
    "total": 63
  }],
  "selected": { "…": "the top-ranked story" },
  "comparison": { "winner": "…", "runnerUp": "…",
                  "reasons": ["Stronger reflection depth (+4.2)", "Stronger specificity (+3.1)"] }
}
```

`comparison` is `null` when only one experience surfaced.

---

## `POST /api/sessions/{id}/generate-blueprint`

Ranks the stories, generates a strategy for the strongest, validates the word budget, and persists everything. `maxDuration` 90s.

**200**

```json
{
  "blueprintId": "…",
  "blueprint": {
    "core_story": "Volunteering at the Lincoln Community Center and building a web application…",
    "central_message": "Technology is most powerful when it is human-centered…",
    "why_this_story_works": ["It demonstrates immediate initiative: the student didn't just observe…"],
    "story_strength": 63,
    "sections": [{
      "title": "Opening Scene",
      "word_count": 45,
      "purpose": "Ground the reader in a specific moment…",
      "include": ["The physical setting of the community center", "…"],
      "evidence": ["When I volunteered at the Lincoln community center last summer…"],
      "questions_to_answer": ["What did you see that others walked past?"],
      "narrative_approach": "Open in scene, present tense…",
      "transition": "Move from the observation to why it bothered you."
    }]
  },
  "wordLimit": 350,
  "total": 350,
  "ranked": ["…"]
}
```

**409 `not_ready`** when no candidate story exists yet.

The word budget is rebalanced and `assert`ed in the strategist **and** again in the route.

---

## `GET /api/sessions/{id}/blueprint`

Reads back a stored blueprint. Same shape minus `ranked`. **404** if none has been generated.

---

## `POST /api/tts`

**Body** → `{ "text": "Think about an experience that changed the way you see yourself." }`

**200** → `audio/wav` (24 kHz, 16-bit, mono; Gemini returns raw PCM which is wrapped in a RIFF header server-side).

**204** → no TTS available. This is not an error: the client falls back to the browser's `SpeechSynthesis`, so Ivy always has a voice.

---

## Error shape

```json
{ "error": "Ivy needs a language model API key. Add GOOGLE_GENERATIVE_AI_API_KEY to your .env and restart the dev server.",
  "code": "missing_api_key" }
```

| Code | Status | Meaning |
|---|---|---|
| `missing_api_key` | 503 | No model key configured |
| `model_failed` | 502 | Model call failed after retries |
| `invalid_input` | 400/413/415/422 | Request failed validation |
| `not_found` | 404 | Unknown session or blueprint |
| `database_unavailable` | 503 | Supabase unreachable |
| `not_ready` | 409 | Not enough story to proceed |
| `server_error` | 500 | Unexpected |

The browser client normalises all of these into an `IvyApiError` carrying `code`, and the UI renders a specific message and icon per code.
