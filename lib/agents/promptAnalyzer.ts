import { z } from 'zod'
import { DIMENSIONS } from '../domain/types'
import { generateStructured, hasApiKey } from './provider'

/**
 * Prompt Analyzer.
 *
 * Runs once per session, before the interview starts, to work out what the
 * essay prompt is actually asking for. Cached on the session so it costs one
 * model call per session rather than one per turn.
 */

export const promptAnalysisSchema = z.object({
  word_limit: z.number().int().min(50).max(2000),
  required_dimensions: z.array(z.enum(DIMENSIONS)).min(3),
  recommended_story_type: z.string().max(200),
  desired_narrative_arc: z.array(z.string().max(120)).min(3).max(8),
  opening_question: z.string().min(15).max(300),
})

export type PromptAnalysis = z.infer<typeof promptAnalysisSchema>

const SYSTEM = `You analyse college essay prompts for an essay-brainstorming coach.

Given an essay prompt and word limit, determine which categories of student
evidence must be gathered for a strong response, what narrative shape suits the
prompt, and the single best opening interview question.

The opening question must be warm, open-ended and specific enough to prompt a
real memory rather than an abstract answer. It must not assume any facts about
the student.`

/** Deterministic fallback so the app still runs with no API key configured. */
export function fallbackAnalysis(wordLimit: number): PromptAnalysis {
  return {
    word_limit: wordLimit,
    required_dimensions: [...DIMENSIONS],
    recommended_story_type: 'transformational personal experience',
    desired_narrative_arc: ['specific experience', 'challenge/action', 'reflection', 'growth', 'future direction'],
    opening_question: 'Think about an experience that changed the way you see yourself. What comes to mind?',
  }
}

export async function analyzePrompt(prompt: string, wordLimit: number, college: string): Promise<PromptAnalysis> {
  if (!hasApiKey()) return fallbackAnalysis(wordLimit)
  try {
    const analysis = await generateStructured({
      schema: promptAnalysisSchema,
      system: SYSTEM,
      prompt: `Essay prompt: ${prompt}\nWord limit: ${wordLimit}\nCollege: ${college}`,
      temperature: 0.2,
    })
    // The word limit is a hard product constraint, never the model's to change.
    return { ...analysis, word_limit: wordLimit }
  } catch {
    return fallbackAnalysis(wordLimit)
  }
}
