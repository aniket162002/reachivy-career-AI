import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { hasApiKey } from './provider'

/**
 * SpeechToTextProvider seam.
 *
 * Uses Gemini's multimodal audio input, which is on the same free tier as the
 * text models — no second provider or paid STT service needed. Swap the body of
 * `transcribe` to change providers; nothing above this file changes.
 *
 * Privacy: audio is held only for the duration of this call. It is passed
 * straight to the model and never written to disk or to the database.
 */

export class NoSpeechDetectedError extends Error {
  constructor() {
    super('No speech detected in audio')
    this.name = 'NoSpeechDetectedError'
  }
}

const MODEL = process.env.IVY_STT_MODEL ?? 'gemini-3.5-transcribe'

/** Marker the model returns for silence, so we can raise a specific error. */
const EMPTY_MARKER = '[NO_SPEECH]'

export async function transcribe(audio: Uint8Array, mimeType: string): Promise<string> {
  if (!hasApiKey()) throw new Error('MISSING_API_KEY')

  const { text } = await generateText({
    model: google(MODEL),
    temperature: 0,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Transcribe this audio of a high-school student answering an interview question.

Return ONLY the transcript text — no commentary, no speaker labels, no quotation marks.
Preserve the student's own wording; do not paraphrase, correct grammar, or embellish.
If the audio contains no intelligible speech, return exactly ${EMPTY_MARKER}`,
          },
          { type: 'file', data: audio, mediaType: mimeType },
        ],
      },
    ],
  })

  const transcript = text.trim()
  if (!transcript || transcript.includes(EMPTY_MARKER)) throw new NoSpeechDetectedError()

  return transcript
}
