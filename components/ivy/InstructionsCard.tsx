'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Square, Volume2 } from 'lucide-react'
import { INSTRUCTIONS } from '@/lib/domain/seed'

interface Props {
  onListen: () => void
  onStop: () => void
  speaking: boolean
  prompt: string
}

/**
 * Instructions card with a working Listen button — it reads the instructions
 * aloud through the real TTS pipeline, and turns into a Stop control while
 * speaking so the student can interrupt.
 */
export function InstructionsCard({ onListen, onStop, speaking, prompt }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <section className="instructions" aria-labelledby="instructions-heading">
      <div className="instruction-head">
        <strong id="instructions-heading">Instructions</strong>
        <button
          type="button"
          className="listen"
          onClick={speaking ? onStop : onListen}
          aria-label={speaking ? 'Stop reading the instructions' : 'Listen to the instructions'}
        >
          {speaking ? <Square size={12} fill="currentColor" /> : <Volume2 size={13} />}
          {speaking ? 'Stop' : 'Listen'}
        </button>
      </div>

      <ol>
        {INSTRUCTIONS.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            className="instruction-more"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <p className="instruction-prompt-label">Your essay prompt</p>
            <blockquote>{prompt}</blockquote>
            <p>
              Ivy decides what to ask next from what you have already said, so there is no fixed number of questions.
              When she has enough of your story, she will build a structure with an exact word budget — you write the
              essay itself.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <button type="button" className="read-more" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
        {expanded ? 'Read less' : 'Read more'}
      </button>
    </section>
  )
}
