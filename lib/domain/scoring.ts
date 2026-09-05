import { SCORE_CRITERIA, type CandidateStory, type ScoredStory, type ScoreCriterion, type StoryEntity, type StoryScores } from './types'

/**
 * Story scoring engine.
 *
 * Deterministic and evidence-based: every criterion is computed from what the
 * student actually said, not from a model's opinion. This keeps ranking stable
 * across runs and makes "why story A beat story B" explainable.
 *
 * The resulting 0-100 number is an INTERNAL selection signal. It is not an
 * admissions quality judgement and is surfaced only as a rough strength meter.
 */

const WEIGHTS: Record<ScoreCriterion, number> = {
  specificity: 1.3,
  authenticity: 1.2,
  reflection_depth: 1.3,
  personal_growth: 1.2,
  emotional_depth: 0.9,
  prompt_relevance: 1.3,
  evidence_strength: 1.1,
  future_connection: 1.0,
  college_connection: 0.8,
  distinctiveness: 0.9,
}

const MAX_WEIGHTED = SCORE_CRITERIA.reduce((sum, c) => sum + WEIGHTS[c] * 10, 0)

/** Depth proxy: longer, more concrete text carries more usable detail. */
function depth(text: string, ceiling = 240): number {
  const clean = text.trim()
  if (!clean) return 0
  return Math.min(10, Math.round((clean.length / ceiling) * 10 * 10) / 10)
}

/** Concrete nouns, numbers and proper nouns signal specificity over generality. */
function specificityOf(text: string): number {
  if (!text.trim()) return 0
  const numbers = (text.match(/\b\d+\b/g) ?? []).length
  const propers = (text.match(/\b[A-Z][a-z]{2,}\b/g) ?? []).length
  const concrete = (text.match(/\b(when|after|during|one day|that morning|the first time|because)\b/gi) ?? []).length
  return Math.min(10, depth(text) * 0.5 + numbers * 1.2 + propers * 0.8 + concrete * 1.1)
}

function reflectionDepthOf(text: string): number {
  if (!text.trim()) return 0
  const markers = (text.match(/\b(realized|learned|understood|changed|now i|used to|before|instead|taught me)\b/gi) ?? []).length
  return Math.min(10, depth(text, 200) * 0.6 + markers * 1.6)
}

function emotionalDepthOf(story: CandidateStory, entities: StoryEntity[]): number {
  const emotions = entities.filter((e) => e.type === 'emotion')
  const text = `${story.challenge} ${story.impact} ${story.reflection}`
  const markers = (text.match(/\b(afraid|nervous|proud|frustrated|hurt|excited|anxious|grateful|ashamed|relieved)\b/gi) ?? []).length
  return Math.min(10, emotions.length * 2.2 + markers * 1.8)
}

/** Averaged confidence of supporting entities — how well-evidenced the story is. */
function evidenceStrengthOf(entities: StoryEntity[]): number {
  if (entities.length === 0) return 0
  const avg = entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length
  const breadth = Math.min(1, entities.length / 6)
  return Math.round(avg * 10 * (0.6 + 0.4 * breadth) * 10) / 10
}

/** How many of the prompt's required dimensions this story actually touches. */
function promptRelevanceOf(story: CandidateStory, entities: StoryEntity[]): number {
  const parts = [story.experience, story.challenge, story.action, story.impact, story.reflection, story.future_connection]
  const filled = parts.filter((p) => p.trim().length > 15).length
  const hasValue = entities.some((e) => e.type === 'value')
  const hasSkill = entities.some((e) => e.type === 'skill' || e.type === 'perspective_shift')
  return Math.min(10, (filled / parts.length) * 7 + (hasValue ? 1.5 : 0) + (hasSkill ? 1.5 : 0))
}

/** Penalises the most common well-worn essay framings. */
function distinctivenessOf(story: CandidateStory): number {
  const text = `${story.title} ${story.summary}`.toLowerCase()
  const cliches = ['winning the game', 'mission trip', 'moving to a new school', 'sports injury', 'grandparent passed', 'model un']
  const hits = cliches.filter((c) => text.includes(c)).length
  const uniqueDetail = specificityOf(story.summary)
  return Math.max(0, Math.min(10, 5 + uniqueDetail * 0.5 - hits * 2.5))
}

export function scoreStory(story: CandidateStory, entities: StoryEntity[]): ScoredStory {
  const scores: StoryScores = {
    specificity: specificityOf(`${story.experience} ${story.action} ${story.impact}`),
    // Authenticity rewards first-person concrete recall over abstract summary.
    authenticity: Math.min(10, depth(story.summary, 180) * 0.7 + ((story.summary.match(/\bI\b/g) ?? []).length * 0.9)),
    reflection_depth: reflectionDepthOf(story.reflection),
    personal_growth: Math.min(10, (reflectionDepthOf(story.reflection) + depth(story.impact, 200)) / 2),
    emotional_depth: emotionalDepthOf(story, entities),
    prompt_relevance: promptRelevanceOf(story, entities),
    evidence_strength: evidenceStrengthOf(entities),
    future_connection: depth(story.future_connection, 160),
    college_connection: entities.some((e) => e.type === 'college_connection') ? 8 : depth(story.future_connection, 320),
    distinctiveness: distinctivenessOf(story),
  }

  const weighted = SCORE_CRITERIA.reduce((sum, c) => sum + scores[c] * WEIGHTS[c], 0)
  const total = Math.round((weighted / MAX_WEIGHTED) * 100)

  // Round each criterion for clean display.
  for (const c of SCORE_CRITERIA) scores[c] = Math.round(scores[c] * 10) / 10

  return { ...story, scores, total }
}

/** Rank all candidates, strongest first. */
export function rankStories(candidates: CandidateStory[], entities: StoryEntity[]): ScoredStory[] {
  return candidates.map((c) => scoreStory(c, entities)).sort((a, b) => b.total - a.total)
}

/** Plain-language reasons story A outranks story B, for the comparison view. */
export function explainAdvantage(winner: ScoredStory, runnerUp: ScoredStory): string[] {
  return SCORE_CRITERIA.map((c) => ({ c, delta: winner.scores[c] - runnerUp.scores[c] }))
    .filter((x) => x.delta > 1)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3)
    .map((x) => `Stronger ${x.c.replace(/_/g, ' ')} (+${Math.round(x.delta * 10) / 10})`)
}
