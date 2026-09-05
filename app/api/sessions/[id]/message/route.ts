import { NextResponse } from 'next/server'
import { z } from 'zod'
import { runTurn } from '@/lib/agents/interviewer'
import { fail, handleRouteError } from '@/lib/api/respond'
import { deriveState, mergeEntities } from '@/lib/domain/completeness'
import {
  appendTurn,
  loadSession,
  loadTurns,
  saveCandidates,
  saveEntities,
  saveState,
} from '@/lib/domain/repository'
import type { CandidateStory, Dimension } from '@/lib/domain/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Interview turns involve a model round-trip; give them room on slow free tiers.
export const maxDuration = 60

const bodySchema = z.object({
  answer: z.string().min(1).max(4000),
  source: z.enum(['voice', 'text']).default('text'),
})

/**
 * POST /api/sessions/[id]/message
 *
 * One adaptive interview turn:
 *   persist student answer -> extract + question (LLM) -> merge into state ->
 *   recompute completeness/phase/readiness server-side -> persist -> respond.
 *
 * The model reports observations; the server owns all derived state.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const body = bodySchema.parse(await request.json())

    const session = await loadSession(id)
    if (!session) return fail('not_found', 'That brainstorming session could not be found.', 404)

    const history = await loadTurns(id)

    // Persist the student's words before calling the model, so nothing is lost
    // if the model call fails and the student retries.
    const studentTurn = await appendTurn(id, 'student', body.answer.trim(), body.source)

    const result = await runTurn({
      essayPrompt: session.prompt,
      college: session.college_name,
      state: session.state,
      history,
      studentAnswer: body.answer.trim(),
    })

    // Merge model observations into server-owned state.
    const covered = { ...session.state.covered }
    for (const dimension of result.newly_covered) covered[dimension as Dimension] = true

    // Discard low-confidence extractions rather than showing unsupported claims.
    const trustworthy = result.entities.filter((e) => e.confidence >= 0.6 && e.evidence.trim().length > 0)
    const entities = mergeEntities(session.state.entities, trustworthy)

    const candidates: CandidateStory[] = [...session.state.candidates]
    for (const incoming of result.candidate_stories) {
      const index = candidates.findIndex((c) => c.id === incoming.id)
      if (index >= 0) candidates[index] = { ...candidates[index], ...incoming }
      else candidates.push(incoming)
    }

    const state = deriveState(covered, entities, candidates)
    // The student may choose to stop early even with gaps remaining.
    const readyForStrategy = state.readyForStrategy || result.student_requested_finish

    const ivyTurn = await appendTurn(id, 'ivy', result.assistant_message, 'text')

    await Promise.all([
      saveEntities(id, trustworthy, studentTurn.id),
      saveCandidates(id, result.candidate_stories),
      saveState(id, { ...state, readyForStrategy }, readyForStrategy ? 'review' : 'capture'),
    ])

    return NextResponse.json({
      studentTurn,
      ivyTurn,
      assistant_message: result.assistant_message,
      reason_for_question: result.reason_for_question,
      phase: state.phase,
      // Send the reconciled flags, so the client mirrors the server exactly.
      covered_dimensions: Object.entries(state.covered)
        .filter(([, isCovered]) => isCovered)
        .map(([dimension]) => dimension),
      missing_dimensions: state.missing,
      completeness: state.completeness,
      ready_for_strategy: readyForStrategy,
      entities: state.entities,
      candidates: state.candidates,
    })
  } catch (error) {
    return handleRouteError(error, 'sessions.message')
  }
}
