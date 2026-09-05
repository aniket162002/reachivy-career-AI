'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'

/**
 * Ivy's voice.
 *
 * Prefers server-side TTS (a real, consistent voice). If the server has no TTS
 * available it falls back to the browser's SpeechSynthesis, so the Listen button
 * and spoken replies always do something real rather than being decorative.
 *
 * `stop` supports barge-in: the student can interrupt Ivy mid-sentence.
 */
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)
  // Guards against a stale request finishing after a newer one started.
  const tokenRef = useRef(0)

  const release = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
    audioRef.current = null
  }, [])

  const stop = useCallback(() => {
    tokenRef.current += 1
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    release()
    setSpeaking(false)
  }, [release])

  useEffect(() => stop, [stop])

  const speakInBrowser = useCallback((text: string, token: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setSpeaking(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.05
    // Prefer a natural-sounding English voice when the platform offers one.
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find((v) => /samantha|female|zira|google us english/i.test(v.name) && v.lang.startsWith('en'))
    if (preferred) utterance.voice = preferred
    utterance.onend = () => {
      if (tokenRef.current === token) setSpeaking(false)
    }
    utterance.onerror = () => {
      if (tokenRef.current === token) setSpeaking(false)
    }
    window.speechSynthesis.speak(utterance)
  }, [])

  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return
      stop()
      const token = ++tokenRef.current
      setSpeaking(true)

      let blob: Blob | null = null
      try {
        blob = await api.speak(text)
      } catch {
        blob = null
      }

      // A newer utterance started while we were fetching — abandon this one.
      if (tokenRef.current !== token) return

      if (!blob) {
        speakInBrowser(text, token)
        return
      }

      const url = URL.createObjectURL(blob)
      urlRef.current = url
      const audio = new Audio(url)
      audioRef.current = audio

      audio.onended = () => {
        if (tokenRef.current !== token) return
        release()
        setSpeaking(false)
      }
      audio.onerror = () => {
        if (tokenRef.current !== token) return
        release()
        speakInBrowser(text, token)
      }

      try {
        await audio.play()
      } catch {
        // Autoplay policy blocked playback; the browser voice usually still works.
        if (tokenRef.current === token) speakInBrowser(text, token)
      }
    },
    [release, speakInBrowser, stop],
  )

  return { speak, stop, speaking }
}
