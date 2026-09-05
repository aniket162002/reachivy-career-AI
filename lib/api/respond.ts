import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { MissingApiKeyError, ModelCallError } from '../agents/provider'

/**
 * Shared route-handler error mapping, so every endpoint returns the same shape
 * and the UI can render a specific, friendly message rather than a generic
 * failure. `code` is what the client switches on.
 */

export interface ApiError {
  error: string
  code:
    | 'missing_api_key'
    | 'model_failed'
    | 'invalid_input'
    | 'not_found'
    | 'database_unavailable'
    | 'not_ready'
    | 'server_error'
}

export function fail(code: ApiError['code'], message: string, status: number) {
  return NextResponse.json({ error: message, code } satisfies ApiError, { status })
}

export function handleRouteError(error: unknown, context: string) {
  if (error instanceof ZodError) {
    return fail('invalid_input', 'That request was not in the expected format.', 400)
  }

  if (error instanceof MissingApiKeyError || (error instanceof Error && error.message === 'MISSING_API_KEY')) {
    return fail(
      'missing_api_key',
      'Ivy needs a language model API key. Add GOOGLE_GENERATIVE_AI_API_KEY to your .env and restart the dev server.',
      503,
    )
  }

  if (error instanceof ModelCallError) {
    return fail('model_failed', 'Ivy could not think that through just now. Please try again in a moment.', 502)
  }

  const message = error instanceof Error ? error.message : String(error)

  if (/supabase|database|relation|connection/i.test(message)) {
    console.error(`[ivy:${context}] database error`, message)
    return fail('database_unavailable', 'We could not reach your session storage. Your answer was not lost — try again.', 503)
  }

  console.error(`[ivy:${context}]`, message)
  return fail('server_error', 'Something went wrong on our side. Please try again.', 500)
}
