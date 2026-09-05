'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Volume2 } from 'lucide-react'
import type { Turn } from '@/lib/domain/types'
import { IvyMark } from './IvyAssistant'

interface Props {
  turns: Turn[]
  /** Contextual status line, e.g. "Understanding your story…". Null when idle. */
  status: string | null
  onReplay: (text: string) => void
  speakingId: string | null
  compact?: boolean
}

/**
 * Vertical transcript. Ivy's turns carry the assistant mark and a replay
 * control; the student's carry an avatar, matching the reference layout.
 */
export function ConversationPanel({ turns, status, onReplay, speakingId, compact = false }: Props) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns.length, status])

  return (
    <div className={compact ? 'transcript compact' : 'transcript'} role="log" aria-live="polite" aria-label="Conversation with Ivy">
      <AnimatePresence initial={false}>
        {turns.map((turn) => (
          <motion.div
            key={turn.id}
            className={`turn ${turn.speaker}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {turn.speaker === 'ivy' ? (
              <IvyMark size={20} state={speakingId === turn.id ? 'speaking' : 'idle'} />
            ) : (
              <span className="student-mark" aria-hidden="true">
                A
              </span>
            )}

            <div className="turn-body">
              <p>{turn.content}</p>
              {turn.speaker === 'ivy' && (
                <button
                  type="button"
                  className="replay"
                  onClick={() => onReplay(turn.content)}
                  aria-label="Hear this question again"
                >
                  <Volume2 size={11} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {status && (
        <motion.div
          className="turn ivy status-turn"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          aria-live="polite"
        >
          <IvyMark size={20} state="thinking" />
          <div className="turn-body">
            <p className="thinking-text">
              {status}
              <span className="dots">
                <i />
                <i />
                <i />
              </span>
            </p>
          </div>
        </motion.div>
      )}

      <div ref={endRef} />
    </div>
  )
}
