import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import type { z } from 'zod'

/**
 * LanguageModelProvider seam.
 *
 * Everything above this file speaks in terms of `generateStructured`, so
 * swapping Gemini for OpenAI/Groq/OpenRouter is a one-file change. Model ids
 * come from env so the free tier can be re-pointed without a code edit.
 */

export class MissingApiKeyError extends Error {
  constructor() {
    super('No language model API key configured')
    this.name = 'MissingApiKeyError'
  }
}

export class ModelCallError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'ModelCallError'
  }
}

export function hasApiKey(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
}

/** Fast model for turn-by-turn interview work; free tier on Google AI Studio. */
const FAST_MODEL = process.env.IVY_FAST_MODEL ?? 'gemini-3.5-flash-lite'
/** Slightly stronger model for the one-shot strategy generation. */
const STRATEGY_MODEL = process.env.IVY_STRATEGY_MODEL ?? 'gemini-3.5-flash'

interface StructuredOptions<T> {
  schema: z.ZodType<T>
  system: string
  prompt: string
  /** Use the stronger model — for blueprint generation. */
  heavy?: boolean
  /** Lower is more deterministic; extraction wants near-zero. */
  temperature?: number
}

const RETRYABLE = /rate|429|503|timeout|overload|unavailable|ECONNRESET|fetch failed/i

/**
 * Structured generation with bounded retry. Transient failures (rate limits on
 * the free tier are common) get two backed-off retries; schema violations do
 * not, since retrying malformed output rarely helps and costs latency.
 */
export async function generateStructured<T>({
  schema,
  system,
  prompt,
  heavy = false,
  temperature = 0.3,
}: StructuredOptions<T>): Promise<T> {
  if (!hasApiKey()) throw new MissingApiKeyError()

  const model = google(heavy ? STRATEGY_MODEL : FAST_MODEL)
  let lastError: unknown

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { object } = await generateObject({ model, schema, system, prompt, temperature })
      return object
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : String(error)
      if (!RETRYABLE.test(message) || attempt === 2) break
      // Exponential backoff: 700ms, 1400ms.
      await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)))
    }
  }

  throw new ModelCallError(
    lastError instanceof Error ? lastError.message : 'Model call failed',
    lastError,
  )
}
