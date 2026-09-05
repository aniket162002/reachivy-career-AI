import { NextResponse } from 'next/server'
import { generateBlueprint } from '@/lib/agents/strategist'
import { fail, handleRouteError } from '@/lib/api/respond'
import { loadSession, loadTurns, saveBlueprint, saveRanking } from '@/lib/domain/repository'
import { rankStories } from '@/lib/domain/scoring'
import { assertBudget } from '@/lib/domain/wordBudget'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Blueprint generation is the single heaviest model call in the app.
export const maxDuration = 90

/**
 * POST /api/sessions/[id]/generate-blueprint
 *
 * Ranks the candidate stories, generates a strategy for the strongest one, and
 * persists the blueprint. The word budget is validated twice — inside the
 * strategist and again here — so a wrong total can never reach the client.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const session = await loadSession(id)
    if (!session) return fail('not_found', 'That brainstorming session could not be found.', 404)

    if (session.state.candidates.length === 0) {
      return fail(
        'not_ready',
        'There is not enough of your story yet to build a strategy. Keep talking with Ivy a little longer.',
        409,
      )
    }

    const ranked = rankStories(session.state.candidates, session.state.entities)
    await saveRanking(id, ranked)

    const turns = await loadTurns(id)

    const blueprint = await generateBlueprint({
      essayPrompt: session.prompt,
      college: session.college_name,
      wordLimit: session.word_limit,
      story: ranked[0],
      entities: session.state.entities,
      history: turns,
    })

    // Defence in depth: never serve a blueprint that misses the word limit.
    assertBudget(blueprint.sections, session.word_limit)

    const blueprintId = await saveBlueprint(id, blueprint)

    return NextResponse.json({
      blueprintId,
      blueprint,
      wordLimit: session.word_limit,
      total: blueprint.sections.reduce((sum, s) => sum + s.word_count, 0),
      ranked,
    })
  } catch (error) {
    return handleRouteError(error, 'sessions.generateBlueprint')
  }
}
