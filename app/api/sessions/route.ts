import { NextResponse } from 'next/server'
import { z } from 'zod'
import { analyzePrompt } from '@/lib/agents/promptAnalyzer'
import { handleRouteError } from '@/lib/api/respond'
import { appendTurn, createSession, savePromptAnalysis } from '@/lib/domain/repository'
import { SEED_SESSION } from '@/lib/domain/seed'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  college: z.string().min(1).max(120).default(SEED_SESSION.college),
  essayTitle: z.string().min(1).max(160).default(SEED_SESSION.essayTitle),
  prompt: z.string().min(20).max(2000).default(SEED_SESSION.prompt),
  wordLimit: z.number().int().min(50).max(2000).default(SEED_SESSION.wordLimit),
})

/**
 * POST /api/sessions — start a brainstorming session.
 *
 * Analyses the essay prompt once, stores the analysis on the session, and seeds
 * the transcript with Ivy's greeting plus her opening question.
 */
export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => ({}))
    const body = bodySchema.parse(raw)

    const sessionId = await createSession(body)

    // Falls back to a sensible default question if no model key is configured,
    // so a session always starts even without an LLM.
    const analysis = await analyzePrompt(body.prompt, body.wordLimit, body.college)
    await savePromptAnalysis(sessionId, analysis)

    const greeting = await appendTurn(
      sessionId,
      'ivy',
      "Hey! I'm Ivy. I'll help you discover the strongest story for this essay. We won't write the essay yet — first, I'd like to understand you.",
      'text',
    )
    const opening = await appendTurn(sessionId, 'ivy', analysis.opening_question, 'text')

    return NextResponse.json({ sessionId, analysis, turns: [greeting, opening] }, { status: 201 })
  } catch (error) {
    return handleRouteError(error, 'sessions.create')
  }
}
