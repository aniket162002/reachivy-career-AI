import { NextResponse } from 'next/server'
import { NoSpeechDetectedError, transcribe } from '@/lib/agents/stt'
import { fail, handleRouteError } from '@/lib/api/respond'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Guards against oversized uploads; ~1 minute of Opus audio is well under this. */
const MAX_BYTES = 8 * 1024 * 1024

const ALLOWED = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/aac']

/**
 * POST /api/sessions/[id]/transcribe
 *
 * Accepts a recorded audio blob and returns a transcript. The audio is never
 * persisted — it exists only in memory for the duration of this request, which
 * is what the privacy note in the UI promises.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await params

  try {
    const form = await request.formData()
    const file = form.get('audio')

    if (!(file instanceof Blob)) {
      return fail('invalid_input', 'No audio was received. Please try recording again.', 400)
    }
    if (file.size === 0) {
      return fail('invalid_input', "We didn't catch any audio. Try again or type your response.", 400)
    }
    if (file.size > MAX_BYTES) {
      return fail('invalid_input', 'That recording was too long. Try answering in a shorter take.', 413)
    }

    // Browsers append codec params, e.g. "audio/webm;codecs=opus".
    const mimeType = (file.type || 'audio/webm').split(';')[0].trim()
    if (!ALLOWED.includes(mimeType)) {
      return fail('invalid_input', 'That audio format is not supported. Try again or type your response.', 415)
    }

    const audio = new Uint8Array(await file.arrayBuffer())
    const text = await transcribe(audio, mimeType)

    return NextResponse.json({ text })
  } catch (error) {
    if (error instanceof NoSpeechDetectedError) {
      return fail('invalid_input', "We couldn't hear that clearly. Try again or type your response.", 422)
    }
    return handleRouteError(error, 'sessions.transcribe')
  }
}
