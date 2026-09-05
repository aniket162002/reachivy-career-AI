import { DEFAULT_ALLOCATION, type EssaySection } from './types'

/**
 * Word-budget validator.
 *
 * The LLM is never trusted to do arithmetic. Whatever allocation it proposes is
 * rebalanced here so the sections provably sum to the target word limit.
 */

export interface BudgetResult {
  sections: EssaySection[]
  total: number
  adjusted: boolean
}

/**
 * Largest-remainder apportionment: scale every section proportionally to the
 * target, then hand out the leftover words to the sections with the biggest
 * fractional parts. This preserves the model's intended shape while landing
 * exactly on the target.
 */
export function rebalance(sections: EssaySection[], target: number): BudgetResult {
  if (sections.length === 0) {
    return { sections: fallbackSections(target), total: target, adjusted: true }
  }

  const rawTotal = sections.reduce((sum, s) => sum + (Number.isFinite(s.word_count) ? s.word_count : 0), 0)
  if (rawTotal === target) return { sections, total: target, adjusted: false }

  // Even weighting if the model returned nonsense (zeros/negatives).
  const weights = rawTotal > 0 ? sections.map((s) => Math.max(0, s.word_count)) : sections.map(() => 1)
  const weightTotal = weights.reduce((a, b) => a + b, 0)

  const exact = weights.map((w) => (w / weightTotal) * target)
  // Floor at 5 words so no section becomes meaningless after scaling.
  const floored = exact.map((v) => Math.max(5, Math.floor(v)))
  let remainder = target - floored.reduce((a, b) => a + b, 0)

  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)
    .map((x) => x.i)

  const counts = [...floored]
  // Distribute (or reclaim) whole words one at a time, cycling by fraction rank.
  let cursor = 0
  while (remainder !== 0 && cursor < order.length * target) {
    const idx = order[cursor % order.length]
    if (remainder > 0) {
      counts[idx] += 1
      remainder -= 1
    } else if (counts[idx] > 5) {
      counts[idx] -= 1
      remainder += 1
    }
    cursor += 1
  }

  const balanced = sections.map((s, i) => ({ ...s, word_count: counts[i] }))
  const total = counts.reduce((a, b) => a + b, 0)
  return { sections: balanced, total, adjusted: true }
}

/** Default six-section allocation, scaled if the word limit is not 350. */
export function fallbackSections(target: number): EssaySection[] {
  const base: EssaySection[] = DEFAULT_ALLOCATION.map((s) => ({
    title: s.title,
    word_count: s.word_count,
    purpose: '',
    include: [],
    evidence: [],
    questions_to_answer: [],
    narrative_approach: '',
    transition: '',
  }))
  if (target === 350) return base
  return rebalance(base, target).sections
}

/** Throws if a blueprint would ever leave the server with a wrong total. */
export function assertBudget(sections: EssaySection[], target: number): void {
  const total = sections.reduce((sum, s) => sum + s.word_count, 0)
  if (total !== target) {
    throw new Error(`Word budget invariant violated: ${total} != ${target}`)
  }
}
