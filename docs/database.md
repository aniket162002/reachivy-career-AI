# Database

PostgreSQL via Supabase. Six domain tables plus a migrations ledger.

## Running migrations

```bash
npm run migrate
```

Idempotent: applied filenames are recorded in `_ivy_migrations` and skipped on re-runs. Each file runs in a transaction — a failure rolls that file back and stops the run.

Requires `POSTGRES_URL_NON_POOLING` (the direct connection, not the pooler) because DDL will not run through pgbouncer in transaction mode.

## Schema

### `essay_sessions`

One brainstorming session. Holds the server-authoritative conversation state, so a session can be resumed exactly where it left off.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | Null for now; reserved for Supabase Auth |
| `college_name` | text | e.g. `Bryn Mawr College` |
| `essay_title` | text | e.g. `Essay 1: Personal Story` |
| `prompt` | text | The essay prompt |
| `word_limit` | int | 350 for the demo |
| `status` | text | `capture` · `review` · `blueprint` |
| `started_at` / `completed_at` | timestamptz | |
| `conversation_completeness` | numeric | 0..1, recomputed each turn |
| `selected_story_id` | uuid | FK to the winning `story_candidates` row |
| `prompt_analysis` | jsonb | **Cached** — the analyzer runs once per session, not per turn |
| `covered` | jsonb | Server-owned dimension flags |
| `phase` | text | Derived from the first evidence gap |
| `ready_for_strategy` | bool | Gates the Review button |
| `updated_at` | timestamptz | Maintained by a trigger |

### `conversation_turns`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `session_id` | uuid FK | |
| `speaker` | text | `ivy` \| `student` |
| `content` | text | |
| `source` | text | `voice` \| `text` — distinguishes spoken from typed answers |
| `created_at` | timestamptz | Transcript ordering |

Indexed on `(session_id, created_at)`.

**Raw audio is never stored here or anywhere else** — only the transcript.

### `story_entities`

Every extracted insight, each tied to the student's own words. This is what makes evidence traceability real rather than a claim.

| Column | Type | Notes |
|---|---|---|
| `type` | text | `value` · `skill` · `perspective_shift` · `emotion` · `future_goal` · `college_connection` · `experience` |
| `name` | text | e.g. `Empathy` |
| `summary` | text | |
| `evidence` | text | **Verbatim student quote** — required, never null |
| `confidence` | numeric(4,3) | 0..1; anything below 0.6 is discarded before it reaches this table |
| `source_turn_id` | uuid | Which turn produced it |

Upserted by `(session_id, type, name)`; a new extraction only overwrites an existing row when its confidence is higher.

> `confidence` was originally an `integer` column. Migration `0002` converts it to `numeric(4,3)`, rescaling any legacy percentage values.

### `story_candidates`

Each distinct experience the student raised.

| Column | Type | Notes |
|---|---|---|
| `slug` | text | Stable id from the extractor, so repeated mentions update one row |
| `title` / `summary` | text | |
| `experience` · `challenge` · `action` · `impact` · `reflection` · `future_connection` | text | The narrative parts |
| `score` | int | 0..100 weighted total |
| `scores` | jsonb | All ten criteria, for the comparison view |
| `is_selected` | bool | The winner |

`unique (session_id, slug)` backs the upsert.

> Migration `0002` created this as a *partial* unique index (`where slug is not null`), which PostgREST cannot use as an `ON CONFLICT` target — the upsert failed at runtime. Migration `0003` backfills nulls, makes `slug` `NOT NULL`, and replaces the index with a full unique constraint.

### `essay_blueprints` / `essay_sections`

| `essay_blueprints` | |
|---|---|
| `core_story` · `central_message` | text |
| `why_story_works` | jsonb array |
| `total_words` | int — the verified total |

| `essay_sections` | |
|---|---|
| `position` | int — display order |
| `title` | text |
| `word_count` | int — **sums to exactly `word_limit`** |
| `purpose` · `content_guidance` · `transition_guidance` | text |
| `evidence_json` | jsonb — student quotes, questions to answer, narrative approach |

One blueprint per session: regenerating deletes the previous blueprint and its sections first.

## Realtime

Enabled on `conversation_turns`, `essay_sessions` and `story_entities`. The browser subscribes to turn inserts for its session, so an open tab reflects turns added from anywhere. Locally-sent turns are de-duplicated by id on arrival.

Migration `0002` adds these to `supabase_realtime` defensively — adding an already-published table is an error, so it checks `pg_publication_tables` first.

## Row-level security

RLS is enabled on all six tables. The prototype ships permissive `anon` policies because sessions are anonymous and keyed by `localStorage`.

**Before any real deployment**, replace them with owner-scoped policies once Supabase Auth is wired up:

```sql
drop policy sessions_anon_demo on public.essay_sessions;

create policy sessions_owner on public.essay_sessions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

Child tables would scope through their `session_id`. Note that route handlers use the service-role key and bypass RLS regardless — RLS protects the direct-from-browser Realtime and query paths.

## Migrations

| File | Purpose |
|---|---|
| `0002_session_state.sql` | Adds `prompt_analysis`, `covered`, `phase`, `ready_for_strategy`, `updated_at`; converts `confidence` to numeric; adds `slug`/`experience`/`scores` to candidates; indexes; `updated_at` trigger; Realtime publication |
| `0003_candidate_slug_constraint.sql` | Replaces the partial unique index with a real unique constraint so the candidate upsert works |

Base tables (`0001`) were provisioned before this implementation; their shape is documented above.
