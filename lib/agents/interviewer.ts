import { z } from 'zod'
import { DIMENSIONS, DIMENSION_LABELS, PHASE_LABELS, candidateStorySchema, entitySchema, type ConversationState, type Dimension, type Turn } from '../domain/types'
import { generateStructured, hasApiKey } from './provider'

/**
 * Adaptive Interviewer + Story Extractor.
 *
 * Combined into a single model call per turn: the model must understand what
 * the student just said in order to choose the next question, so extracting and
 * questioning together halves latency and keeps the two consistent with each
 * other. Deterministic logic (completeness, phase, readiness) is recomputed
 * server-side from the returned flags — the model only reports observations.
 */

export const turnResultSchema = z.object({
  assistant_message: z.string().min(10).max(600),
  /** Product-safe rationale. Never chain-of-thought. */
  reason_for_question: z.string().min(5).max(200),
  /** Dimensions the transcript now supports with real evidence. */
  newly_covered: z.array(z.enum(DIMENSIONS)).default([]),
  entities: z.array(entitySchema).max(10).default([]),
  candidate_stories: z.array(candidateStorySchema).max(4).default([]),
  /** True only if the student explicitly asked to stop or wrap up. */
  student_requested_finish: z.boolean().default(false),
})

export type TurnResult = z.infer<typeof turnResultSchema>

const SYSTEM = `You are Ivy, an AI essay brainstorming coach for high-school students.

Your goal is to help the student discover and articulate authentic personal
experiences relevant to the provided college essay prompt.

You are NOT writing the essay. You are not drafting sentences for it.

HOW TO ASK
- Ask ONE main question at a time. Never stack several questions.
- Respond naturally and briefly to what the student just said, then ask.
- Keep your whole message short — two or three sentences at most. It is read aloud.
- Prefer follow-ups that uncover: specific events, actions, choices, emotions,
  motivation, consequences, reflection, personal growth, values, skills,
  perspective shifts, future goals, and college fit.
- If the student is vague, gently ask for one concrete example or moment.
- If the student gives a strong experience, deepen it before switching topics.
- Do not sound like an interview form. Do not praise every answer.
- Do not write admissions clichés. Do not coach the student to misrepresent themselves.
- Target the single highest-value missing dimension you are given.

EXTRACTION RULES (strict)
- Extract ONLY what the transcript directly supports. Never fabricate.
- Every entity needs an "evidence" field quoting the student's own words,
  verbatim or near-verbatim. If you cannot quote it, do not extract it.
- Set confidence honestly. Below 0.6 means you are guessing — omit it instead.
- Do not infer sensitive personal traits (health, religion, sexuality, ethnicity,
  immigration status, family finances) even if hinted at.
- Mark a dimension as newly_covered ONLY when the student's own words establish
  it. Your question mentioning a topic does not cover it.
- Track each distinct experience the student raises as its own candidate story,
  with a stable short id (slug of the title). Re-use the same id across turns
  when updating the same story.`

interface TurnInput {
  essayPrompt: string
  college: string
  state: ConversationState
  history: Turn[]
  studentAnswer: string
}

/** Keeps the model's context bounded on long sessions. */
function renderTranscript(history: Turn[], answer: string): string {
  const recent = history.slice(-16)
  const older = history.length > 16 ? `[${history.length - 16} earlier turns summarised: the student has already discussed the topics listed under "already covered".]\n` : ''
  const lines = recent.map((t) => `${t.speaker === 'ivy' ? 'Ivy' : 'Student'}: ${t.content}`)
  return `${older}${lines.join('\n')}\nStudent: ${answer}`
}

function priorityMissing(missing: Dimension[]): Dimension | null {
  // DIMENSIONS is already in narrative order, so the first gap is the one to chase.
  return DIMENSIONS.find((d) => missing.includes(d)) ?? null
}

export async function runTurn(input: TurnInput): Promise<TurnResult> {
  if (!hasApiKey()) throw new Error('MISSING_API_KEY')

  const { state } = input
  const target = priorityMissing(state.missing)
  const covered = DIMENSIONS.filter((d) => state.covered[d]).map((d) => DIMENSION_LABELS[d])

  const prompt = `ESSAY PROMPT: ${input.essayPrompt}
COLLEGE: ${input.college}

CURRENT PHASE: ${PHASE_LABELS[state.phase]}
ALREADY COVERED: ${covered.join(', ') || 'nothing yet'}
STILL MISSING: ${state.missing.map((d) => DIMENSION_LABELS[d]).join(', ') || 'nothing'}
HIGHEST-VALUE GAP TO TARGET NEXT: ${target ? DIMENSION_LABELS[target] : 'none — confirm and wrap up warmly'}

KNOWN CANDIDATE STORIES: ${state.candidates.length ? state.candidates.map((c) => `${c.id} — ${c.title}`).join('; ') : 'none yet'}

TRANSCRIPT:
${renderTranscript(input.history, input.studentAnswer)}

Respond to what the student just said, then ask one focused question that closes the highest-value gap.`

  return generateStructured({
    schema: turnResultSchema,
    system: SYSTEM,
    prompt,
    temperature: 0.5,
  })
}
