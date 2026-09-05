import { z } from 'zod'

/**
 * The nine evidence dimensions the essay prompt requires. Completeness, the
 * missing-evidence detector and the live strategy panel are all derived from
 * this single list so the UI can never drift from the interview engine.
 */
export const DIMENSIONS = [
  'specific_experience',
  'challenge',
  'action',
  'impact',
  'reflection',
  'values',
  'skills',
  'future_goal',
  'college_connection',
] as const

export type Dimension = (typeof DIMENSIONS)[number]

export const DIMENSION_LABELS: Record<Dimension, string> = {
  specific_experience: 'Specific experience',
  challenge: 'Challenge',
  action: 'Action',
  impact: 'Impact',
  reflection: 'Reflection',
  values: 'Values',
  skills: 'Skills',
  future_goal: 'Future goal',
  college_connection: 'College connection',
}

/** Interview phases, advanced by evidence rather than by question count. */
export const PHASES = [
  'discovery',
  'deep_dive',
  'reflection',
  'character',
  'skills',
  'future',
  'college_fit',
  'validation',
  'strategy',
] as const

export type Phase = (typeof PHASES)[number]

export const PHASE_LABELS: Record<Phase, string> = {
  discovery: 'Open story discovery',
  deep_dive: 'Deep dive',
  reflection: 'Reflection',
  character: 'Character & values',
  skills: 'Skills',
  future: 'Future direction',
  college_fit: 'College fit',
  validation: 'Filling gaps',
  strategy: 'Building strategy',
}

/**
 * A single extracted insight. Every insight carries the student's own words as
 * evidence — this is what lets the UI prove no fact was invented.
 */
export const entitySchema = z.object({
  type: z.enum(['value', 'skill', 'perspective_shift', 'emotion', 'future_goal', 'college_connection', 'experience']),
  name: z.string().min(1).max(120),
  summary: z.string().min(1).max(400),
  evidence: z.string().min(1).max(600),
  confidence: z.number().min(0).max(1),
})

export type StoryEntity = z.infer<typeof entitySchema>

export const candidateStorySchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(600),
  experience: z.string().max(600).default(''),
  challenge: z.string().max(600).default(''),
  action: z.string().max(600).default(''),
  impact: z.string().max(600).default(''),
  reflection: z.string().max(600).default(''),
  future_connection: z.string().max(600).default(''),
})

export type CandidateStory = z.infer<typeof candidateStorySchema>

/** Ten scoring criteria, 0-10 each, weighted into a 0-100 story strength. */
export const SCORE_CRITERIA = [
  'specificity',
  'authenticity',
  'reflection_depth',
  'personal_growth',
  'emotional_depth',
  'prompt_relevance',
  'evidence_strength',
  'future_connection',
  'college_connection',
  'distinctiveness',
] as const

export type ScoreCriterion = (typeof SCORE_CRITERIA)[number]

export type StoryScores = Record<ScoreCriterion, number>

export interface ScoredStory extends CandidateStory {
  scores: StoryScores
  total: number
}

export const essaySectionSchema = z.object({
  title: z.string().min(1).max(80),
  word_count: z.number().int().min(5).max(350),
  purpose: z.string().min(1).max(400),
  include: z.array(z.string().max(300)).max(8).default([]),
  evidence: z.array(z.string().max(400)).max(8).default([]),
  questions_to_answer: z.array(z.string().max(300)).max(8).default([]),
  narrative_approach: z.string().max(400).default(''),
  transition: z.string().max(300).default(''),
})

export type EssaySection = z.infer<typeof essaySectionSchema>

export const blueprintSchema = z.object({
  core_story: z.string().min(1).max(600),
  central_message: z.string().min(1).max(600),
  why_this_story_works: z.array(z.string().max(400)).min(1).max(6),
  story_strength: z.number().min(0).max(100),
  sections: z.array(essaySectionSchema).min(4).max(8),
})

export type Blueprint = z.infer<typeof blueprintSchema>

/** Server-authoritative conversation state, persisted per session. */
export interface ConversationState {
  covered: Record<Dimension, boolean>
  entities: StoryEntity[]
  candidates: CandidateStory[]
  missing: Dimension[]
  completeness: number
  phase: Phase
  readyForStrategy: boolean
}

export interface Turn {
  id: string
  speaker: 'ivy' | 'student'
  content: string
  source: 'voice' | 'text'
  created_at?: string
}

/** The default section allocation. Always validated to total the word limit. */
export const DEFAULT_ALLOCATION: Array<{ title: string; word_count: number }> = [
  { title: 'Opening Scene', word_count: 45 },
  { title: 'Life Experience / Challenge', word_count: 100 },
  { title: 'Reflection / Perspective Shift', word_count: 75 },
  { title: 'Character, Values & Skills', word_count: 55 },
  { title: 'College + Future Direction', word_count: 60 },
  { title: 'Closing', word_count: 15 },
]
