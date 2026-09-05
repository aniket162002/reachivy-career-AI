import { NextResponse } from 'next/server'
import { fail, handleRouteError } from '@/lib/api/respond'
import { loadBlueprint, loadSession } from '@/lib/domain/repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET /api/sessions/[id]/blueprint — read back a previously generated blueprint. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const session = await loadSession(id)
    if (!session) return fail('not_found', 'That brainstorming session could not be found.', 404)

    const blueprint = await loadBlueprint(id)
    if (!blueprint) return fail('not_found', 'No blueprint has been generated for this session yet.', 404)

    return NextResponse.json({
      blueprint,
      wordLimit: session.word_limit,
      total: blueprint.sections.reduce((sum, s) => sum + s.word_count, 0),
    })
  } catch (error) {
    return handleRouteError(error, 'sessions.blueprint')
  }
}
