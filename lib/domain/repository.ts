import { serviceClient } from '../supabase/server'
import type { PromptAnalysis } from '../agents/promptAnalyzer'
import { deriveState, emptyCovered } from './completeness'
import type { Blueprint, CandidateStory, ConversationState, Dimension, ScoredStory, StoryEntity, Turn } from './types'

/**
 * Persistence layer. All session reads/writes go through here so route handlers
 * stay thin and the derived-state rules live in exactly one place.
 */

export interface SessionRecord {
  id: string
  college_name: string
  essay_title: string
  prompt: string
  word_limit: number
  status: string
  started_at: string
  completed_at: string | null
  selected_story_id: string | null
  prompt_analysis: PromptAnalysis | null
  state: ConversationState
}

export interface NewSessionInput {
  college: string
  essayTitle: string
  prompt: string
  wordLimit: number
}

export async function createSession(input: NewSessionInput): Promise<string> {
  const { data, error } = await serviceClient()
    .from('essay_sessions')
    .insert({
      college_name: input.college,
      essay_title: input.essayTitle,
      prompt: input.prompt,
      word_limit: input.wordLimit,
      status: 'capture',
      conversation_completeness: 0,
      covered: emptyCovered(),
      phase: 'discovery',
      ready_for_strategy: false,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Could not create session: ${error.message}`)
  return data.id as string
}

export async function savePromptAnalysis(sessionId: string, analysis: PromptAnalysis): Promise<void> {
  const { error } = await serviceClient()
    .from('essay_sessions')
    .update({ prompt_analysis: analysis })
    .eq('id', sessionId)
  if (error) throw new Error(`Could not save prompt analysis: ${error.message}`)
}

/** Loads the session plus everything needed to rebuild conversation state. */
export async function loadSession(sessionId: string): Promise<SessionRecord | null> {
  const db = serviceClient()

  const { data: session, error } = await db.from('essay_sessions').select('*').eq('id', sessionId).maybeSingle()
  if (error) throw new Error(`Could not load session: ${error.message}`)
  if (!session) return null

  const [{ data: entityRows }, { data: candidateRows }] = await Promise.all([
    db.from('story_entities').select('*').eq('session_id', sessionId),
    db.from('story_candidates').select('*').eq('session_id', sessionId),
  ])

  const entities: StoryEntity[] = (entityRows ?? []).map((row) => ({
    type: row.type,
    name: row.name,
    summary: row.summary,
    evidence: row.evidence,
    confidence: Number(row.confidence ?? 0),
  }))

  const candidates: CandidateStory[] = (candidateRows ?? []).map((row) => ({
    id: row.slug ?? row.id,
    title: row.title,
    summary: row.summary,
    experience: row.experience ?? '',
    challenge: row.challenge ?? '',
    action: row.action ?? '',
    impact: row.impact ?? '',
    reflection: row.reflection ?? '',
    future_connection: row.future_connection ?? '',
  }))

  const covered = { ...emptyCovered(), ...(session.covered ?? {}) } as Record<Dimension, boolean>

  return {
    id: session.id,
    college_name: session.college_name,
    essay_title: session.essay_title,
    prompt: session.prompt,
    word_limit: session.word_limit,
    status: session.status,
    started_at: session.started_at,
    completed_at: session.completed_at,
    selected_story_id: session.selected_story_id,
    prompt_analysis: session.prompt_analysis,
    // Always recompute derived fields rather than trusting stored copies.
    state: deriveState(covered, entities, candidates),
  }
}

export async function loadTurns(sessionId: string): Promise<Turn[]> {
  const { data, error } = await serviceClient()
    .from('conversation_turns')
    .select('id, speaker, content, source, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Could not load turns: ${error.message}`)
  return (data ?? []) as Turn[]
}

export async function appendTurn(
  sessionId: string,
  speaker: 'ivy' | 'student',
  content: string,
  source: 'voice' | 'text',
): Promise<Turn> {
  const { data, error } = await serviceClient()
    .from('conversation_turns')
    .insert({ session_id: sessionId, speaker, content, source })
    .select('id, speaker, content, source, created_at')
    .single()

  if (error) throw new Error(`Could not save turn: ${error.message}`)
  return data as Turn
}

/** Upserts extracted entities, keyed by session + type + name. */
export async function saveEntities(sessionId: string, entities: StoryEntity[], sourceTurnId?: string): Promise<void> {
  if (entities.length === 0) return
  const db = serviceClient()

  const { data: existing } = await db.from('story_entities').select('id, type, name, confidence').eq('session_id', sessionId)
  const byKey = new Map((existing ?? []).map((r) => [`${r.type}:${r.name.toLowerCase()}`, r]))

  const inserts: Record<string, unknown>[] = []
  for (const entity of entities) {
    const key = `${entity.type}:${entity.name.trim().toLowerCase()}`
    const prev = byKey.get(key)
    const payload = {
      session_id: sessionId,
      type: entity.type,
      name: entity.name,
      summary: entity.summary,
      evidence: entity.evidence,
      confidence: entity.confidence,
      source_turn_id: sourceTurnId ?? null,
    }
    if (!prev) {
      inserts.push(payload)
    } else if (entity.confidence > Number(prev.confidence ?? 0)) {
      // Only overwrite when the new evidence is stronger.
      await db.from('story_entities').update(payload).eq('id', prev.id)
    }
  }

  if (inserts.length > 0) {
    const { error } = await db.from('story_entities').insert(inserts)
    if (error) throw new Error(`Could not save entities: ${error.message}`)
  }
}

/** Upserts candidate stories by their stable extractor slug. */
export async function saveCandidates(sessionId: string, candidates: CandidateStory[]): Promise<void> {
  if (candidates.length === 0) return
  const db = serviceClient()

  const rows = candidates.map((c) => ({
    session_id: sessionId,
    slug: c.id,
    title: c.title,
    summary: c.summary,
    experience: c.experience,
    challenge: c.challenge,
    action: c.action,
    impact: c.impact,
    reflection: c.reflection,
    future_connection: c.future_connection,
    is_selected: false,
  }))

  const { error } = await db.from('story_candidates').upsert(rows, { onConflict: 'session_id,slug' })
  if (error) throw new Error(`Could not save candidate stories: ${error.message}`)
}

export async function saveState(sessionId: string, state: ConversationState, status?: string): Promise<void> {
  const { error } = await serviceClient()
    .from('essay_sessions')
    .update({
      covered: state.covered,
      phase: state.phase,
      ready_for_strategy: state.readyForStrategy,
      conversation_completeness: state.completeness,
      ...(status ? { status } : {}),
    })
    .eq('id', sessionId)

  if (error) throw new Error(`Could not save state: ${error.message}`)
}

/** Persists the ranked scores and marks the winning story selected. */
export async function saveRanking(sessionId: string, ranked: ScoredStory[]): Promise<void> {
  if (ranked.length === 0) return
  const db = serviceClient()

  for (const [index, story] of ranked.entries()) {
    await db
      .from('story_candidates')
      .update({ score: story.total, scores: story.scores, is_selected: index === 0 })
      .eq('session_id', sessionId)
      .eq('slug', story.id)
  }

  const { data } = await db
    .from('story_candidates')
    .select('id')
    .eq('session_id', sessionId)
    .eq('slug', ranked[0].id)
    .maybeSingle()

  if (data?.id) {
    await db.from('essay_sessions').update({ selected_story_id: data.id }).eq('id', sessionId)
  }
}

export async function saveBlueprint(sessionId: string, blueprint: Blueprint): Promise<string> {
  const db = serviceClient()

  // One blueprint per session: replace any previous generation.
  const { data: old } = await db.from('essay_blueprints').select('id').eq('session_id', sessionId)
  for (const row of old ?? []) {
    await db.from('essay_sections').delete().eq('blueprint_id', row.id)
  }
  await db.from('essay_blueprints').delete().eq('session_id', sessionId)

  const total = blueprint.sections.reduce((sum, s) => sum + s.word_count, 0)

  const { data, error } = await db
    .from('essay_blueprints')
    .insert({
      session_id: sessionId,
      core_story: blueprint.core_story,
      central_message: blueprint.central_message,
      why_story_works: blueprint.why_this_story_works,
      total_words: total,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Could not save blueprint: ${error.message}`)

  const sections = blueprint.sections.map((section, index) => ({
    blueprint_id: data.id,
    position: index,
    title: section.title,
    word_count: section.word_count,
    purpose: section.purpose,
    content_guidance: section.include.join('\n'),
    evidence_json: {
      evidence: section.evidence,
      questions_to_answer: section.questions_to_answer,
      narrative_approach: section.narrative_approach,
    },
    transition_guidance: section.transition,
  }))

  const { error: sectionError } = await db.from('essay_sections').insert(sections)
  if (sectionError) throw new Error(`Could not save sections: ${sectionError.message}`)

  await db
    .from('essay_sessions')
    .update({ status: 'blueprint', completed_at: new Date().toISOString() })
    .eq('id', sessionId)

  return data.id as string
}

/** Reads back a stored blueprint for the blueprint screen / resume. */
export async function loadBlueprint(sessionId: string): Promise<(Blueprint & { id: string }) | null> {
  const db = serviceClient()

  const { data: blueprint } = await db
    .from('essay_blueprints')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!blueprint) return null

  const { data: sections } = await db
    .from('essay_sections')
    .select('*')
    .eq('blueprint_id', blueprint.id)
    .order('position', { ascending: true })

  const { data: selected } = await db
    .from('story_candidates')
    .select('score')
    .eq('session_id', sessionId)
    .eq('is_selected', true)
    .maybeSingle()

  return {
    id: blueprint.id,
    core_story: blueprint.core_story,
    central_message: blueprint.central_message,
    why_this_story_works: blueprint.why_story_works ?? [],
    story_strength: Number(selected?.score ?? 0),
    sections: (sections ?? []).map((row) => ({
      title: row.title,
      word_count: row.word_count,
      purpose: row.purpose,
      include: row.content_guidance ? String(row.content_guidance).split('\n').filter(Boolean) : [],
      evidence: row.evidence_json?.evidence ?? [],
      questions_to_answer: row.evidence_json?.questions_to_answer ?? [],
      narrative_approach: row.evidence_json?.narrative_approach ?? '',
      transition: row.transition_guidance ?? '',
    })),
  }
}
