import { NextResponse } from 'next/server'
import { z } from 'zod'
import { handleRouteError } from '@/lib/api/respond'
import { hasApiKey } from '@/lib/agents/provider'
import { synthesize } from '@/lib/agents/tts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const bodySchema = z.object({
  text: z.string().min(1).max(2000),
})

/**
 * POST /api/tts
 *
 * Returns WAV audio for Ivy's voice. If no key is configured, or the TTS model
 * is unavailable on the free tier, responds 204 — the client then falls back to
 * the browser's built-in speech synthesis, so Ivy always has a voice.
 */
export async function POST(request: Request) {
  try {
    const { text } = bodySchema.parse(await request.json())

    if (!hasApiKey()) return new NextResponse(null, { status: 204 })

    const wav = await synthesize(text)
    if (!wav) return new NextResponse(null, { status: 204 })

    return new NextResponse(wav as BodyInit, {
      headers: {
        'content-type': 'audio/wav',
        'cache-control': 'no-store',
      },
    })
  } catch (error) {
    // TTS is an enhancement, never a blocker: degrade to the browser voice.
    if (error instanceof Error && !/invalid/i.test(error.message)) {
      console.error('[ivy:tts]', error.message)
      return new NextResponse(null, { status: 204 })
    }
    return handleRouteError(error, 'tts')
  }
}
