-- Hello Ivy — session state persistence
--
-- The base tables (essay_sessions, conversation_turns, story_candidates,
-- story_entities, essay_blueprints, essay_sections) already exist. This
-- migration adds the server-authoritative conversation state so a session can
-- be resumed exactly where it left off, plus the cached prompt analysis so the
-- analyzer runs once per session rather than once per turn.

alter table public.essay_sessions
  add column if not exists prompt_analysis jsonb,
  add column if not exists covered jsonb not null default '{}'::jsonb,
  add column if not exists phase text not null default 'discovery',
  add column if not exists ready_for_strategy boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

-- confidence was created as integer; the extractor emits 0..1 floats.
alter table public.story_entities
  alter column confidence type numeric(4, 3) using (
    case
      when confidence is null then null
      when confidence > 1 then confidence / 100.0
      else confidence
    end
  );

alter table public.story_entities
  add column if not exists created_at timestamptz not null default now();

-- Candidate stories carry a stable slug id from the extractor so repeated
-- mentions of the same experience update one row instead of duplicating.
alter table public.story_candidates
  add column if not exists slug text,
  add column if not exists experience text,
  add column if not exists scores jsonb;

create unique index if not exists story_candidates_session_slug_idx
  on public.story_candidates (session_id, slug)
  where slug is not null;

create index if not exists conversation_turns_session_created_idx
  on public.conversation_turns (session_id, created_at);

create index if not exists story_entities_session_idx
  on public.story_entities (session_id);

create index if not exists essay_sections_blueprint_position_idx
  on public.essay_sections (blueprint_id, position);

-- Keep updated_at fresh so resume ordering is reliable.
create or replace function public.touch_essay_session()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists essay_sessions_touch on public.essay_sessions;
create trigger essay_sessions_touch
  before update on public.essay_sessions
  for each row execute function public.touch_essay_session();

-- Realtime: the browser subscribes to turn inserts and session updates so the
-- transcript and live strategy panel stay in sync across tabs/devices.
-- Adding a table twice is an error, so only add what is not already published.
do $$
declare
  t text;
begin
  foreach t in array array['conversation_turns', 'essay_sessions', 'story_entities']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
