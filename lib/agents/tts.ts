/**
 * TextToSpeechProvider seam.
 *
 * Gemini's TTS models return raw PCM rather than a container, so we wrap the
 * samples in a WAV header before handing them to the browser. Returns null on
 * any failure so the caller can fall back to browser speech synthesis — Ivy is
 * never left mute.
 */

const MODEL = process.env.IVY_TTS_MODEL ?? 'gemini-3.1-flash-tts-preview'
/** Warm, unhurried voice; suits a coaching tone. */
const VOICE = process.env.IVY_TTS_VOICE ?? 'Aoede'

/** Gemini TTS output format: 24 kHz, 16-bit, mono PCM. */
const SAMPLE_RATE = 24_000
const BITS_PER_SAMPLE = 16
const CHANNELS = 1

/** Wraps raw little-endian PCM in a minimal 44-byte RIFF/WAVE header. */
function pcmToWav(pcm: Uint8Array): Uint8Array {
  const blockAlign = (CHANNELS * BITS_PER_SAMPLE) / 8
  const byteRate = SAMPLE_RATE * blockAlign
  const buffer = new ArrayBuffer(44 + pcm.length)
  const view = new DataView(buffer)

  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
  }

  ascii(0, 'RIFF')
  view.setUint32(4, 36 + pcm.length, true)
  ascii(8, 'WAVE')
  ascii(12, 'fmt ')
  view.setUint32(16, 16, true) // PCM fmt chunk size
  view.setUint16(20, 1, true) // audio format: PCM
  view.setUint16(22, CHANNELS, true)
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, BITS_PER_SAMPLE, true)
  ascii(36, 'data')
  view.setUint32(40, pcm.length, true)

  const out = new Uint8Array(buffer)
  out.set(pcm, 44)
  return out
}

/**
 * The AI SDK does not expose Gemini's speech modality, so this calls the
 * generateContent endpoint directly.
 */
export async function synthesize(text: string): Promise<Uint8Array | null> {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!key) return null

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
        },
      }),
    },
  )

  if (!response.ok) {
    console.error('[ivy:tts] model returned', response.status)
    return null
  }

  const payload = await response.json()
  const base64 = payload?.candidates?.[0]?.content?.parts?.find(
    (part: { inlineData?: { data?: string } }) => part?.inlineData?.data,
  )?.inlineData?.data

  if (!base64) return null

  return pcmToWav(new Uint8Array(Buffer.from(base64, 'base64')))
}
