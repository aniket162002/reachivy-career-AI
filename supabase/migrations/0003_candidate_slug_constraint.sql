-- The partial unique index from 0002 cannot back an ON CONFLICT target, so the
-- candidate-story upsert failed. Replace it with a full unique constraint on
-- (session_id, slug). Every candidate the extractor produces carries a slug, so
-- backfill the few legacy rows from their primary key first.

update public.story_candidates
set slug = id::text
where slug is null;

alter table public.story_candidates
  alter column slug set not null;

drop index if exists public.story_candidates_session_slug_idx;

alter table public.story_candidates
  drop constraint if exists story_candidates_session_slug_key;

alter table public.story_candidates
  add constraint story_candidates_session_slug_key unique (session_id, slug);
