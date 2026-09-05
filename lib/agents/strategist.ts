import { DEFAULT_ALLOCATION, blueprintSchema, type Blueprint, type ScoredStory, type StoryEntity, type Turn } from '../domain/types'
import { assertBudget, rebalance } from '../domain/wordBudget'
import { generateStructured, hasApiKey } from './provider'

/**
 * Final Strategist.
 *
 * Produces the essay STRATEGY — never the essay itself. The model proposes a
 * section allocation; the server rebalances it so the totals are provably exact.
 */

const SYSTEM = `You are Ivy, an AI essay strategist for high-school students.

You produce an essay STRUCTURE and STRATEGY. You must NOT write the essay, and
must not draft finished sentences the student could paste into a draft.

For each section, describe what the student should cover, which of their OWN
statements to draw on, and what questions that section must answer.

HARD RULES
- Use only facts the student actually stated. Never invent experiences, family
  circumstances, achievements, extracurriculars, emotions, or values.
- Every "evidence" entry must quote or closely paraphrase the student's own words
  from the transcript provided.
- "include" entries are guidance about what to cover, not written prose.
- Word counts should follow the recommended allocation unless a different shape
  clearly serves this story better. They will be rebalanced to total exactly the
  word limit, so approximate proportions are fine.
- "why_this_story_works" must give concrete, specific reasons grounded in the
  student's material — not generic admissions platitudes.`

interface StrategyInput {
  essayPrompt: string
  college: string
  wordLimit: number
  story: ScoredStory
  entities: StoryEntity[]
  history: Turn[]
}

function renderEvidence(entities: StoryEntity[]): string {
  if (entities.length === 0) return 'none recorded'
  return entities
    .map((e) => `- [${e.type}] ${e.name} (confidence ${Math.round(e.confidence * 100)}%) — evidence: "${e.evidence}"`)
    .join('\n')
}

export async function generateBlueprint(input: StrategyInput): Promise<Blueprint> {
  if (!hasApiKey()) throw new Error('MISSING_API_KEY')

  const studentWords = input.history
    .filter((t) => t.speaker === 'student')
    .map((t) => `- "${t.content}"`)
    .join('\n')

  const allocation = DEFAULT_ALLOCATION.map((s) => `${s.title}: ${s.word_count} words`).join('\n')

  const raw = await generateStructured({
    schema: blueprintSchema,
    system: SYSTEM,
    heavy: true,
    temperature: 0.4,
    prompt: `ESSAY PROMPT: ${input.essayPrompt}
COLLEGE: ${input.college}
WORD LIMIT: ${input.wordLimit}

SELECTED STORY
Title: ${input.story.title}
Summary: ${input.story.summary}
Experience: ${input.story.experience}
Challenge: ${input.story.challenge}
Action: ${input.story.action}
Impact: ${input.story.impact}
Reflection: ${input.story.reflection}
Future connection: ${input.story.future_connection}

EXTRACTED EVIDENCE
${renderEvidence(input.entities)}

THE STUDENT'S OWN WORDS (the only permitted source of facts)
${studentWords || 'none recorded'}

RECOMMENDED ALLOCATION (adapt only if it clearly serves this story better)
${allocation}

Produce the essay strategy.`,
  })

  // Never trust model arithmetic: rebalance to hit the word limit exactly.
  const { sections } = rebalance(raw.sections, input.wordLimit)
  assertBudget(sections, input.wordLimit)

  return {
    ...raw,
    sections,
    // Use the deterministic score, not the model's guess at its own quality.
    story_strength: input.story.total,
  }
}
