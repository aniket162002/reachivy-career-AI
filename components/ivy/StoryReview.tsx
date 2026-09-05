'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Loader2, Quote, Trash2 } from 'lucide-react'
import type { ConversationState, ScoredStory, StoryEntity } from '@/lib/domain/types'

interface Props {
  state: ConversationState
  stories: ScoredStory[]
  comparison: { winner: string; runnerUp: string; reasons: string[] } | null
  onBuild: () => void
  building: boolean
  wordLimit: number
}

interface Row {
  label: string
  content: string
  evidence?: string
  confidence?: number
}

/** Builds the structured review rows from the selected story plus its evidence. */
function buildRows(state: ConversationState, story: ScoredStory | undefined): Row[] {
  const find = (type: StoryEntity['type']) => state.entities.find((e) => e.type === type)
  const list = (type: StoryEntity['type']) => state.entities.filter((e) => e.type === type)

  const rows: Row[] = []
  const push = (label: string, content: string, entity?: StoryEntity) => {
    if (content?.trim()) rows.push({ label, content, evidence: entity?.evidence, confidence: entity?.confidence })
  }

  if (story) {
    push('Core experience', story.experience || story.summary)
    push('Challenge', story.challenge)
    push('Action', story.action)
    push('Impact', story.impact)
    push('Reflection', story.reflection)
  }

  const values = list('value')
  if (values.length) {
    rows.push({
      label: 'Values',
      content: values.map((v) => v.name).join(', '),
      evidence: values[0].evidence,
      confidence: values[0].confidence,
    })
  }

  const skills = list('skill')
  if (skills.length) {
    rows.push({
      label: 'Skills',
      content: skills.map((s) => s.name).join(', '),
      evidence: skills[0].evidence,
      confidence: skills[0].confidence,
    })
  }

  const shift = find('perspective_shift')
  if (shift) push('Perspective shift', shift.summary, shift)

  const goal = find('future_goal')
  if (goal) push('Future goal', goal.summary, goal)
  else if (story?.future_connection) push('Future goal', story.future_connection)

  const college = find('college_connection')
  if (college) push('College connection', college.summary, college)

  return rows
}

/**
 * "Your Story So Far" — the structured review between conversation and
 * blueprint. Every row shows what was extracted, how confident Ivy is, and the
 * student's own words behind it. Review is optional: nothing here blocks the
 * workflow, but the student can confirm or remove any item.
 */
export function StoryReview({ state, stories, comparison, onBuild, building, wordLimit }: Props) {
  const rows = buildRows(state, stories[0])
  const [removed, setRemoved] = useState<Set<string>>(new Set())
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set())

  const toggle = (set: Set<string>, key: string, update: (next: Set<string>) => void) => {
    const next = new Set(set)
    next.has(key) ? next.delete(key) : next.add(key)
    update(next)
  }

  const visible = rows.filter((row) => !removed.has(row.label))

  return (
    <div className="review-card">
      <div className="card-title">
        <strong>Your Story So Far</strong>
        <span>Everything below came from what you said. Confirm or remove anything that feels off.</span>
      </div>

      {stories.length > 1 && comparison && (
        <div className="story-compare">
          <span className="block-title">Ivy compared your experiences</span>
          <div className="compare-rows">
            {stories.slice(0, 3).map((story, index) => (
              <div key={story.id} className={index === 0 ? 'compare-row winner' : 'compare-row'}>
                <span className="compare-title">{story.title}</span>
                <span className="compare-score">{story.total}</span>
                {index === 0 && <span className="compare-tag">Strongest</span>}
              </div>
            ))}
          </div>
          <p className="compare-why">
            <strong>{comparison.winner}</strong> is stronger: {comparison.reasons.join(' · ').toLowerCase()}
          </p>
        </div>
      )}

      <div className="review-list">
        {visible.length === 0 && (
          <p className="exploring review-empty">
            Nothing has been extracted yet. Keep talking with Ivy and your story will build up here.
          </p>
        )}

        {visible.map((row, index) => (
          <motion.div
            key={row.label}
            className="review-item"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
          >
            <button
              type="button"
              className={confirmed.has(row.label) ? 'check checked' : 'check'}
              onClick={() => toggle(confirmed, row.label, setConfirmed)}
              aria-pressed={confirmed.has(row.label)}
              aria-label={`Confirm ${row.label}`}
            >
              {confirmed.has(row.label) && <Check size={13} />}
            </button>

            <div className="review-body">
              <div className="review-head">
                <span className="eyebrow">{row.label}</span>
                {row.confidence !== undefined && (
                  <span className="confidence">{Math.round(row.confidence * 100)}% confidence</span>
                )}
              </div>
              <p>{row.content}</p>
              {row.evidence && (
                <blockquote className="evidence">
                  <Quote size={10} />
                  {row.evidence}
                </blockquote>
              )}
            </div>

            <button
              type="button"
              className="icon-btn"
              onClick={() => toggle(removed, row.label, setRemoved)}
              aria-label={`Remove ${row.label}`}
            >
              <Trash2 size={13} />
            </button>
          </motion.div>
        ))}
      </div>

      <div className="card-footer">
        <button type="button" className="primary" onClick={onBuild} disabled={building || rows.length === 0}>
          {building ? (
            <>
              <Loader2 size={14} className="spin" /> Building your {wordLimit}-word blueprint…
            </>
          ) : (
            <>
              Build My Essay Strategy <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
