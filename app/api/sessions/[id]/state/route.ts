import { NextResponse } from 'next/server'
import { fail, handleRouteError } from '@/lib/api/respond'
import { loadBlueprint, loadSession, loadTurns } from '@/lib/domain/repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/sessions/[id]/state
 *
 * Full session hydration — used on first load and for session resume. Returns
 * everything the UI needs to render any screen without a second request.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const session = await loadSession(id)
    if (!session) return fail('not_found', 'That brainstorming session could not be found.', 404)

    const [turns, blueprint] = await Promise.all([loadTurns(id), loadBlueprint(id)])

    return NextResponse.json({
      session: {
        id: session.id,
        college: session.college_name,
        essayTitle: session.essay_title,
        prompt: session.prompt,
        wordLimit: session.word_limit,
        status: session.status,
        startedAt: session.started_at,
        completedAt: session.completed_at,
      },
      analysis: session.prompt_analysis,
      state: session.state,
      turns,
      blueprint,
    })
  } catch (error) {
    return handleRouteError(error, 'sessions.state')
  }
}
