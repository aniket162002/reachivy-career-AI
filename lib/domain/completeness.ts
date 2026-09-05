import { DIMENSIONS, type ConversationState, type Dimension, type Phase, type StoryEntity } from './types'

/**
 * Weights reflect how much each dimension matters to *this* essay prompt.
 * The narrative spine (experience/challenge/action/impact/reflection) carries
 * more weight than the closing dimensions, so a rich story with no college
 * angle still reads as substantially complete rather than stuck at 50%.
 */
const WEIGHTS: Record<Dimension, number> = {
  specific_experience: 1.4,
  challenge: 1.2,
  action: 1.2,
  impact: 1.1,
  reflection: 1.3,
  values: 1.0,
  skills: 0.9,
  future_goal: 1.0,
  college_connection: 0.9,
}

const TOTAL_WEIGHT = Object.values(WEIGHTS).reduce((a, b) => a + b, 0)

export function emptyCovered(): Record<Dimension, boolean> {
  return DIMENSIONS.reduce((acc, d) => ({ ...acc, [d]: false }), {}) as Record<Dimension, boolean>
}

/** Weighted completeness in 0..1. Deterministic — never taken from the model. */
export function computeCompleteness(covered: Record<Dimension, boolean>): number {
  const earned = DIMENSIONS.reduce((sum, d) => sum + (covered[d] ? WEIGHTS[d] : 0), 0)
  return Math.round((earned / TOTAL_WEIGHT) * 100) / 100
}

export function missingDimensions(covered: Record<Dimension, boolean>): Dimension[] {
  return DIMENSIONS.filter((d) => !covered[d])
}

/**
 * The interview may end only when the narrative spine plus at least one
 * supported value and one supported skill/perspective exist. Future goal and
 * college connection are required too — the prompt explicitly asks for them.
 */
const REQUIRED_TO_FINISH: Dimension[] = [
  'specific_experience',
  'challenge',
  'action',
  'impact',
  'reflection',
  'values',
  'future_goal',
  'college_connection',
]

export function isReadyForStrategy(covered: Record<Dimension, boolean>, entities: StoryEntity[]): boolean {
  const spine = REQUIRED_TO_FINISH.every((d) => covered[d])
  const hasSupportedValue = entities.some((e) => e.type === 'value' && e.confidence >= 0.6)
  const hasSupportedSkill = entities.some(
    (e) => (e.type === 'skill' || e.type === 'perspective_shift') && e.confidence >= 0.6,
  )
  return spine && hasSupportedValue && hasSupportedSkill
}

/**
 * Phase is derived from evidence, not from turn count — this is what makes the
 * interview adaptive rather than a fixed questionnaire.
 */
export function derivePhase(covered: Record<Dimension, boolean>, ready: boolean): Phase {
  if (ready) return 'strategy'
  if (!covered.specific_experience) return 'discovery'
  if (!covered.challenge || !covered.action || !covered.impact) return 'deep_dive'
  if (!covered.reflection) return 'reflection'
  if (!covered.values) return 'character'
  if (!covered.skills) return 'skills'
  if (!covered.future_goal) return 'future'
  if (!covered.college_connection) return 'college_fit'
  return 'validation'
}

/**
 * Merge newly extracted entities into existing state, de-duplicating by
 * type+name and keeping the higher-confidence evidence.
 */
export function mergeEntities(existing: StoryEntity[], incoming: StoryEntity[]): StoryEntity[] {
  const byKey = new Map<string, StoryEntity>()
  for (const entity of [...existing, ...incoming]) {
    const key = `${entity.type}:${entity.name.trim().toLowerCase()}`
    const prev = byKey.get(key)
    if (!prev || entity.confidence > prev.confidence) byKey.set(key, entity)
  }
  return [...byKey.values()]
}

/**
 * Entity types that are themselves proof a dimension is covered.
 *
 * The interviewer reports `newly_covered` separately from the entities it
 * extracts, and the two occasionally disagree — it will extract a well-evidenced
 * skill while forgetting to flag the skills dimension. Since a stored entity
 * already carries a verbatim quote and a confidence score, it is the stronger
 * signal, so coverage is reconciled from it here rather than left to the model.
 */
const ENTITY_IMPLIES: Partial<Record<StoryEntity['type'], Dimension>> = {
  value: 'values',
  skill: 'skills',
  perspective_shift: 'reflection',
  future_goal: 'future_goal',
  college_connection: 'college_connection',
  experience: 'specific_experience',
}

/** Applies the implications above, without ever un-setting a covered flag. */
export function reconcileCoverage(
  covered: Record<Dimension, boolean>,
  entities: StoryEntity[],
): Record<Dimension, boolean> {
  const next = { ...covered }
  for (const entity of entities) {
    const dimension = ENTITY_IMPLIES[entity.type]
    if (dimension && entity.confidence >= 0.6) next[dimension] = true
  }
  return next
}

/** Rebuild the whole derived state from covered flags + entities. */
export function deriveState(
  rawCovered: Record<Dimension, boolean>,
  entities: StoryEntity[],
  candidates: ConversationState['candidates'],
): ConversationState {
  const covered = reconcileCoverage(rawCovered, entities)
  const readyForStrategy = isReadyForStrategy(covered, entities)
  return {
    covered,
    entities,
    candidates,
    missing: missingDimensions(covered),
    completeness: computeCompleteness(covered),
    phase: derivePhase(covered, readyForStrategy),
    readyForStrategy,
  }
}
