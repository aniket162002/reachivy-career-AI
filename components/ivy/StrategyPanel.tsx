'use client'

import { motion } from 'framer-motion'
import { Quote, Sparkles } from 'lucide-react'
import { DIMENSION_LABELS, type ConversationState, type StoryEntity } from '@/lib/domain/types'

interface Props {
  state: ConversationState
}

/** Groups entities by type once, so each block below is a cheap lookup. */
function group(entities: StoryEntity[]) {
  return entities.reduce<Record<string, StoryEntity[]>>((acc, entity) => {
    ;(acc[entity.type] ??= []).push(entity)
    return acc
  }, {})
}

/** A chip whose tooltip carries the student's own words as proof. */
function EvidenceChip({ entity }: { entity: StoryEntity }) {
  return (
    <motion.span
      className="chip"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      title={`${Math.round(entity.confidence * 100)}% confidence — evidence: "${entity.evidence}"`}
    >
      {entity.name}
      <b>{Math.round(entity.confidence * 100)}%</b>
    </motion.span>
  )
}

function Block({ title, children, empty }: { title: string; children?: React.ReactNode; empty?: string }) {
  return (
    <div className="strategy-block">
      <span className="block-title">{title}</span>
      {children ?? <p className="exploring">{empty ?? 'Still exploring…'}</p>}
    </div>
  )
}

/**
 * Live Essay Strategy.
 *
 * Updates as evidence arrives, and shows only what the transcript supports —
 * every value and skill carries its confidence and the student's own quote.
 * Empty sections show an exploring state rather than a blank panel.
 */
export function StrategyPanel({ state }: Props) {
  const byType = group(state.entities)
  const story = state.candidates[0]
  const shift = byType.perspective_shift?.[0]
  const goal = byType.future_goal?.[0]
  const percent = Math.round(state.completeness * 100)

  return (
    <aside className="insights" aria-label="Live essay strategy">
      <div className="insights-head">
        <span className="eyebrow">Live essay strategy</span>
        <span className="completeness" aria-label={`Story discovery ${percent} percent complete`}>
          {percent}%
        </span>
      </div>

      <div className="progress-track" aria-hidden="true">
        <motion.div
          className="progress-fill"
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <Block title="Potential core story" empty="Tell Ivy about a moment that mattered.">
        {story && (
          <>
            <h3>{story.title}</h3>
            {story.summary && <p className="block-body">{story.summary}</p>}
          </>
        )}
      </Block>

      <Block title="Current theme">
        {shift && (
          <p className="block-body theme-line">
            <Sparkles size={12} /> {shift.summary}
          </p>
        )}
      </Block>

      <Block title="Values identified">
        {byType.value?.length ? (
          <div className="chips">
            {byType.value.map((entity) => (
              <EvidenceChip key={entity.name} entity={entity} />
            ))}
          </div>
        ) : undefined}
      </Block>

      <Block title="Skills identified">
        {byType.skill?.length ? (
          <div className="chips">
            {byType.skill.map((entity) => (
              <EvidenceChip key={entity.name} entity={entity} />
            ))}
          </div>
        ) : undefined}
      </Block>

      {shift && (
        <Block title="Perspective shift">
          <blockquote className="shift-quote">
            <Quote size={11} />
            {shift.evidence}
          </blockquote>
        </Block>
      )}

      {goal && (
        <Block title="Future direction">
          <p className="block-body">{goal.summary}</p>
        </Block>
      )}

      <Block title="Still missing" empty="Nothing — your story is complete.">
        {state.missing.length > 0 ? (
          <ul className="missing-list">
            {state.missing.map((dimension) => (
              <li key={dimension}>{DIMENSION_LABELS[dimension]}</li>
            ))}
          </ul>
        ) : undefined}
      </Block>
    </aside>
  )
}
