'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Real microphone capture via MediaRecorder, plus a live amplitude signal for
 * the waveform. No fake states: `level` is measured from the actual input.
 *
 * Privacy: the recorded Blob is handed to the caller and dropped. The audio
 * stream's tracks are stopped as soon as recording ends, so the browser's
 * recording indicator turns off and nothing is retained.
 */

export type RecorderStatus = 'idle' | 'requesting_permission' | 'listening' | 'denied' | 'unsupported' | 'error'

/** Picks a container the browser can actually produce and our STT accepts. */
function pickMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}

export function useRecorder() {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [level, setLevel] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resolveRef = useRef<((blob: Blob | null) => void) | null>(null)

  /** Tears down every audio resource. Safe to call repeatedly. */
  const cleanup = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null

    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    audioContextRef.current?.close().catch(() => {})
    audioContextRef.current = null

    recorderRef.current = null
    setLevel(0)
  }, [])

  useEffect(() => cleanup, [cleanup])

  const start = useCallback(async () => {
    setError(null)

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setStatus('unsupported')
      setError('Voice recording is not supported in this browser. You can type your response instead.')
      return false
    }

    setStatus('requesting_permission')

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
    } catch (err) {
      const name = err instanceof Error ? err.name : ''
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setStatus('denied')
        setError('Microphone access is blocked. You can enable it in your browser settings or continue by typing.')
      } else if (name === 'NotFoundError') {
        setStatus('error')
        setError('No microphone was found. You can continue by typing your response.')
      } else {
        setStatus('error')
        setError('We could not start your microphone. You can continue by typing your response.')
      }
      return false
    }

    streamRef.current = stream
    chunksRef.current = []

    const mimeType = pickMimeType()
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    recorderRef.current = recorder

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
      chunksRef.current = []
      cleanup()
      setStatus('idle')
      resolveRef.current?.(blob.size > 0 ? blob : null)
      resolveRef.current = null
    }

    // Amplitude metering drives the waveform from real input, not a fake loop.
    try {
      const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const context = new AudioContextCtor()
      audioContextRef.current = context
      const analyser = context.createAnalyser()
      analyser.fftSize = 512
      context.createMediaStreamSource(stream).connect(analyser)

      const data = new Uint8Array(analyser.frequencyBinCount)
      const sample = () => {
        analyser.getByteTimeDomainData(data)
        // RMS around the 128 midpoint gives a stable 0..1 loudness figure.
        let sumSquares = 0
        for (const value of data) {
          const centred = (value - 128) / 128
          sumSquares += centred * centred
        }
        setLevel(Math.min(1, Math.sqrt(sumSquares / data.length) * 3.2))
        rafRef.current = requestAnimationFrame(sample)
      }
      rafRef.current = requestAnimationFrame(sample)
    } catch {
      // Metering is cosmetic; recording still works without it.
    }

    setSeconds(0)
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)

    recorder.start()
    setStatus('listening')
    return true
  }, [cleanup])

  /** Stops recording and resolves with the captured audio. */
  const stop = useCallback((): Promise<Blob | null> => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      cleanup()
      setStatus('idle')
      return Promise.resolve(null)
    }
    return new Promise((resolve) => {
      resolveRef.current = resolve
      recorder.stop()
    })
  }, [cleanup])

  /** Abandons the recording without producing a blob. */
  const cancel = useCallback(() => {
    const recorder = recorderRef.current
    resolveRef.current = null
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null
      recorder.stop()
    }
    chunksRef.current = []
    cleanup()
    setStatus('idle')
  }, [cleanup])

  return { status, level, seconds, error, start, stop, cancel, isListening: status === 'listening' }
}
