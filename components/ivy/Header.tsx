'use client'

import { ChevronDown, Clock3 } from 'lucide-react'
import { IvyMark } from './IvyAssistant'

interface Props {
  college: string
  essayTitle: string
  wordLimit: number
  elapsed: string
}

/**
 * Top bar: logo, session title, college + essay context, word-count pill,
 * session timer and student avatar.
 */
export function Header({ college, essayTitle, wordLimit, elapsed }: Props) {
  return (
    <header className="topbar">
      <div className="brand">
        <IvyMark size={22} />
        <strong>New Essay Brainstorming</strong>
        <span className="crumb">
          {college}, {essayTitle}
        </span>
        <span className="word-pill">{wordLimit} words</span>
      </div>

      <div className="top-actions">
        <span className="top-timer">
          <Clock3 size={13} aria-hidden="true" />
          <span className="sr-only">Session time elapsed</span>
          {elapsed}
        </span>
        <div className="avatar" aria-label="Your profile">
          A
        </div>
        <ChevronDown size={13} aria-hidden="true" />
      </div>
    </header>
  )
}
