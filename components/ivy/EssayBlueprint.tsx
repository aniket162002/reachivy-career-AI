'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Copy, Download, HelpCircle, Quote, Sparkles } from 'lucide-react'
import type { Blueprint } from '@/lib/domain/types'

interface Props {
  blueprint: Blueprint
  wordLimit: number
  onBack: () => void
}

/** Plain-text export of the strategy, for pasting into a doc. */
function toText(blueprint: Blueprint, wordLimit: number) {
  const lines = [
    `YOUR ${wordLimit}-WORD ESSAY BLUEPRINT`,
    '',
    `CORE STORY: ${blueprint.core_story}`,
    `CENTRAL MESSAGE: ${blueprint.central_message}`,
    '',
    'WHY THIS STORY WORKS',
    ...blueprint.why_this_story_works.map((reason) => `  - ${reason}`),
    '',
    'SECTIONS',
  ]

  for (const [index, section] of blueprint.sections.entries()) {
    lines.push(
      '',
      `${index + 1}. ${section.title} — ${section.word_count} words`,
      `   Purpose: ${section.purpose}`,
    )
    if (section.include.length) {
      lines.push('   What to include:', ...section.include.map((item) => `     - ${item}`))
    }
    if (section.evidence.length) {
      lines.push('   Your own words to draw on:', ...section.evidence.map((item) => `     - "${item}"`))
    }
    if (section.questions_to_answer.length) {
      lines.push('   Questions this section answers:', ...section.questions_to_answer.map((q) => `     - ${q}`))
    }
    if (section.narrative_approach) lines.push(`   Approach: ${section.narrative_approach}`)
    if (section.transition) lines.push(`   Transition: ${section.transition}`)
  }

  const total = blueprint.sections.reduce((sum, s) => sum + s.word_count, 0)
  lines.push('', `TOTAL: ${total} / ${wordLimit} words`)
  return lines.join('\n')
}

/**
 * Screen 5 — the final blueprint. Deliberately a STRATEGY, not an essay: each
 * section says what to cover and which of the student's own words to use, so
 * the writing stays theirs.
 */
export function EssayBlueprint({ blueprint, wordLimit, onBack }: Props) {
  const [copied, setCopied] = useState(false)
  const total = blueprint.sections.reduce((sum, section) => sum + section.word_count, 0)
  const exact = total === wordLimit

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toText(blueprint, wordLimit))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const download = () => {
    const blob = new Blob([JSON.stringify(blueprint, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'ivy-essay-blueprint.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="blueprint-card">
      <div className="card-title">
        <strong>Your {wordLimit}-Word Essay Blueprint</strong>
        <div className="blueprint-actions">
          <button type="button" className="copy-btn" onClick={copy}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy strategy'}
          </button>
          <button type="button" className="copy-btn" onClick={download}>
            <Download size={13} /> JSON
          </button>
        </div>
      </div>

      <div className="blueprint-summary">
        <div className="summary-main">
          <span className="eyebrow">Core story</span>
          <h2>{blueprint.core_story}</h2>

          <span className="eyebrow">Central message</span>
          <p className="central-message">{blueprint.central_message}</p>

          <span className="eyebrow">Why this story works</span>
          <ul className="why-list">
            {blueprint.why_this_story_works.map((reason) => (
              <li key={reason}>
                <Sparkles size={11} />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <div className="summary-side">
          <div className="strength-dial">
            <span className="strength-value">{blueprint.story_strength}</span>
            <span className="strength-label">Story strength</span>
            <div className="progress-track">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${blueprint.story_strength}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            </div>
            <p className="strength-note">Internal signal for choosing your strongest story — not an admissions score.</p>
          </div>

          <div className={exact ? 'budget-badge exact' : 'budget-badge'}>
            <b>{total}</b>
            <span>/ {wordLimit} words allocated</span>
            {exact && (
              <span className="budget-ok">
                <Check size={12} /> Verified exact
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="blueprint-list">
        {blueprint.sections.map((section, index) => (
          <motion.article
            key={`${section.title}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
          >
            <div className="blueprint-label">
              <span>
                <em>{index + 1}</em> {section.title}
              </span>
              <b>{section.word_count} words</b>
            </div>

            <p className="section-purpose">{section.purpose}</p>

            {section.include.length > 0 && (
              <div className="section-block">
                <span className="block-title">What to include</span>
                <ul>
                  {section.include.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {section.evidence.length > 0 && (
              <div className="section-block">
                <span className="block-title">Your own words to draw on</span>
                {section.evidence.map((item) => (
                  <blockquote key={item} className="evidence">
                    <Quote size={10} />
                    {item}
                  </blockquote>
                ))}
              </div>
            )}

            {section.questions_to_answer.length > 0 && (
              <div className="section-block">
                <span className="block-title">Questions this section must answer</span>
                <ul className="question-list">
                  {section.questions_to_answer.map((question) => (
                    <li key={question}>
                      <HelpCircle size={11} />
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {section.narrative_approach && (
              <p className="section-approach">
                <strong>Approach:</strong> {section.narrative_approach}
              </p>
            )}

            {section.transition && (
              <p className="section-transition">
                <strong>Transition out:</strong> {section.transition}
              </p>
            )}
          </motion.article>
        ))}
      </div>

      <div className="card-footer">
        <button type="button" className="secondary" onClick={onBack}>
          <ArrowLeft size={14} /> Review &amp; Edit Structure
        </button>
        <p className="integrity-note">
          This is a structure, not an essay. The writing — and every fact in it — stays yours.
        </p>
      </div>
    </div>
  )
}
