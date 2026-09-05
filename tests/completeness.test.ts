import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  computeCompleteness,
  derivePhase,
  deriveState,
  emptyCovered,
  isReadyForStrategy,
  mergeEntities,
  missingDimensions,
  reconcileCoverage,
} from '../lib/domain/completeness'
import { DIMENSIONS, type StoryEntity } from '../lib/domain/types'

const entity = (type: StoryEntity['type'], name: string, confidence: number): StoryEntity => ({
  type,
  name,
  summary: `${name} summary`,
  evidence: `student said something about ${name}`,
  confidence,
})

const allCovered = () =>
  DIMENSIONS.reduce((acc, d) => ({ ...acc, [d]: true }), {}) as ReturnType<typeof emptyCovered>

test('empty state scores zero completeness', () => {
  assert.equal(computeCompleteness(emptyCovered()), 0)
})

test('fully covered state scores 1', () => {
  assert.equal(computeCompleteness(allCovered()), 1)
})

test('completeness increases monotonically as dimensions are covered', () => {
  const covered = emptyCovered()
  let previous = 0
  for (const dimension of DIMENSIONS) {
    covered[dimension] = true
    const score = computeCompleteness(covered)
    assert.ok(score > previous, `${dimension} should raise completeness`)
    previous = score
  }
})

test('missingDimensions lists exactly what is uncovered', () => {
  const covered = emptyCovered()
  covered.specific_experience = true
  covered.challenge = true
  const missing = missingDimensions(covered)
  assert.ok(!missing.includes('specific_experience'))
  assert.equal(missing.length, DIMENSIONS.length - 2)
})

test('is not ready for strategy with an empty transcript', () => {
  assert.equal(isReadyForStrategy(emptyCovered(), []), false)
})

test('is not ready when the spine is complete but no value is evidenced', () => {
  assert.equal(isReadyForStrategy(allCovered(), []), false)
})

test('is not ready when a value exists but no skill or perspective does', () => {
  const entities = [entity('value', 'empathy', 0.9)]
  assert.equal(isReadyForStrategy(allCovered(), entities), false)
})

test('is ready once spine, a value and a skill are all evidenced', () => {
  const entities = [entity('value', 'empathy', 0.9), entity('skill', 'problem solving', 0.8)]
  assert.equal(isReadyForStrategy(allCovered(), entities), true)
})

test('a perspective shift satisfies the skill requirement', () => {
  const entities = [entity('value', 'empathy', 0.9), entity('perspective_shift', 'tech is for people', 0.8)]
  assert.equal(isReadyForStrategy(allCovered(), entities), true)
})

test('low-confidence entities do not satisfy readiness', () => {
  const entities = [entity('value', 'empathy', 0.4), entity('skill', 'coding', 0.4)]
  assert.equal(isReadyForStrategy(allCovered(), entities), false)
})

test('phase follows the first evidence gap, not the turn count', () => {
  const covered = emptyCovered()
  assert.equal(derivePhase(covered, false), 'discovery')

  covered.specific_experience = true
  assert.equal(derivePhase(covered, false), 'deep_dive')

  covered.challenge = true
  covered.action = true
  covered.impact = true
  assert.equal(derivePhase(covered, false), 'reflection')

  covered.reflection = true
  assert.equal(derivePhase(covered, false), 'character')

  covered.values = true
  assert.equal(derivePhase(covered, false), 'skills')

  covered.skills = true
  assert.equal(derivePhase(covered, false), 'future')

  covered.future_goal = true
  assert.equal(derivePhase(covered, false), 'college_fit')

  covered.college_connection = true
  assert.equal(derivePhase(covered, false), 'validation')
})

test('readiness overrides phase to strategy', () => {
  assert.equal(derivePhase(emptyCovered(), true), 'strategy')
})

test('mergeEntities de-duplicates by type and name, keeping higher confidence', () => {
  const merged = mergeEntities(
    [entity('value', 'Empathy', 0.7)],
    [entity('value', 'empathy', 0.9), entity('skill', 'empathy', 0.6)],
  )
  const values = merged.filter((e) => e.type === 'value')
  assert.equal(values.length, 1)
  assert.equal(values[0].confidence, 0.9)
  // Same name, different type stays separate.
  assert.equal(merged.length, 2)
})

test('deriveState recomputes every derived field consistently', () => {
  const entities = [entity('value', 'empathy', 0.9), entity('skill', 'coding', 0.8)]
  const state = deriveState(allCovered(), entities, [])
  assert.equal(state.completeness, 1)
  assert.deepEqual(state.missing, [])
  assert.equal(state.readyForStrategy, true)
  assert.equal(state.phase, 'strategy')
})

test('reconcileCoverage infers a dimension from a well-evidenced entity', () => {
  // The interviewer extracted a skill but forgot to flag the skills dimension.
  const covered = reconcileCoverage(emptyCovered(), [entity('skill', 'software development', 0.9)])
  assert.equal(covered.skills, true)
  assert.equal(covered.values, false)
})

test('reconcileCoverage ignores low-confidence entities', () => {
  const covered = reconcileCoverage(emptyCovered(), [entity('skill', 'guessing', 0.4)])
  assert.equal(covered.skills, false)
})

test('reconcileCoverage never un-sets an already covered dimension', () => {
  const covered = reconcileCoverage(allCovered(), [])
  assert.ok(DIMENSIONS.every((d) => covered[d]))
})

test('deriveState reaches readiness from entities alone when flags lag behind', () => {
  const covered = emptyCovered()
  // The narrative spine was flagged, but values/skills/goal/college were not —
  // only their entities came through.
  for (const d of ['specific_experience', 'challenge', 'action', 'impact'] as const) covered[d] = true

  const state = deriveState(covered, [
    entity('perspective_shift', 'tech serves people', 0.95),
    entity('value', 'empathy', 0.9),
    entity('skill', 'software development', 0.9),
    entity('future_goal', 'study CS and policy', 0.9),
    entity('college_connection', 'Praxis programme', 0.95),
  ], [])

  assert.equal(state.readyForStrategy, true)
  assert.equal(state.completeness, 1)
})
