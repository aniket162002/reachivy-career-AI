import { NextResponse } from 'next/server'
import { fail, handleRouteError } from '@/lib/api/respond'
import { loadSession } from '@/lib/domain/repository'
import { explainAdvantage, rankStories } from '@/lib/domain/scoring'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/sessions/[id]/stories
 *
 * Ranks every candidate experience the student raised and explains why the top
 * one wins. Scoring is deterministic, so this is safe to call repeatedly.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const session = await loadSession(id)
    if (!session) return fail('not_found', 'That brainstorming session could not be found.', 404)

    const ranked = rankStories(session.state.candidates, session.state.entities)

    return NextResponse.json({
      stories: ranked,
      selected: ranked[0] ?? null,
      // Only meaningful when the student surfaced more than one experience.
      comparison:
        ranked.length > 1
          ? { winner: ranked[0].title, runnerUp: ranked[1].title, reasons: explainAdvantage(ranked[0], ranked[1]) }
          : null,
    })
  } catch (error) {
    return handleRouteError(error, 'sessions.stories')
  }
}
