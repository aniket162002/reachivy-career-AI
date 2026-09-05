'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Mic, Send, Square, X } from 'lucide-react'
import { PRIVACY_NOTE } from '@/lib/domain/seed'
import { Waveform } from './Waveform'

export type ComposerBusy = 'idle' | 'transcribing' | 'thinking'

interface Props {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onMicStart: () => void
  onMicStop: () => void
  onMicCancel: () => void
  listening: boolean
  requestingPermission: boolean
  level: number
  seconds: number
  busy: ComposerBusy
  disabled?: boolean
}

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Voice-first composer. The microphone is the primary control; typing is an
 * always-available fallback. While recording, the input is replaced by the
 * listening state (waveform, timer, stop) exactly as the reference describes.
 */
export function Composer({
  value,
  onChange,
  onSend,
  onMicStart,
  onMicStop,
  onMicCancel,
  listening,
  requestingPermission,
  level,
  seconds,
  busy,
  disabled = false,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Grow the textarea with its content, up to a cap.
  useEffect(() => {
    const node = textareaRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.min(96, node.scrollHeight)}px`
  }, [value])

  const blocked = disabled || busy !== 'idle'

  return (
    <div className="composer-wrap">
      <AnimatePresence mode="wait" initial={false}>
        {listening ? (
          <motion.div
            key="listening"
            className="composer listening-bar"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
          >
            <span className="listening-label" aria-live="polite">
              <span className="rec-dot" />
              Listening…
            </span>
            <Waveform level={level} active />
            <span className="listening-time">{formatClock(seconds)}</span>
            <button type="button" className="ghost-btn" onClick={onMicCancel} aria-label="Discard this recording">
              <X size={14} />
            </button>
            <button type="button" className="stop-btn" onClick={onMicStop}>
              <Square size={11} fill="currentColor" /> Stop
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            className="composer"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
          >
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  onSend()
                }
              }}
              placeholder={busy === 'transcribing' ? 'Transcribing…' : 'Write your response here...'}
              aria-label="Your response"
              rows={1}
              disabled={blocked}
            />

            <button
              type="button"
              className="mic"
              onClick={onMicStart}
              disabled={blocked || requestingPermission}
              aria-label="Answer with your voice"
              title="Answer with your voice"
            >
              {requestingPermission || busy === 'transcribing' ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <Mic size={16} />
              )}
            </button>

            <button
              type="button"
              className="send"
              onClick={onSend}
              disabled={blocked || value.trim().length === 0}
              aria-label="Send your response"
            >
              {busy === 'thinking' ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="privacy-note">{PRIVACY_NOTE}</p>
    </div>
  )
}
