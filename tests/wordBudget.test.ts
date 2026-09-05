import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assertBudget, fallbackSections, rebalance } from '../lib/domain/wordBudget'
import type { EssaySection } from '../lib/domain/types'

const section = (title: string, word_count: number): EssaySection => ({
  title,
  word_count,
  purpose: '',
  include: [],
  evidence: [],
  questions_to_answer: [],
  narrative_approach: '',
  transition: '',
})

const sum = (sections: EssaySection[]) => sections.reduce((total, s) => total + s.word_count, 0)

test('default allocation totals exactly 350', () => {
  const sections = fallbackSections(350)
  assert.equal(sum(sections), 350)
  assert.doesNotThrow(() => assertBudget(sections, 350))
})

test('leaves an already-exact allocation untouched', () => {
  const { sections, total, adjusted } = rebalance([section('a', 200), section('b', 150)], 350)
  assert.equal(total, 350)
  assert.equal(adjusted, false)
  assert.deepEqual(sections.map((s) => s.word_count), [200, 150])
})

test('scales an over-allocated blueprint down to exactly 350', () => {
  const { total } = rebalance(
    [section('a', 100), section('b', 200), section('c', 150), section('d', 50)],
    350,
  )
  assert.equal(total, 350)
})

test('scales an under-allocated blueprint up to exactly 350', () => {
  const { sections, total } = rebalance([section('a', 30), section('b', 40), section('c', 20)], 350)
  assert.equal(total, 350)
  assert.ok(sections.every((s) => s.word_count >= 5))
})

test('handles all-zero word counts without dividing by zero', () => {
  const { sections, total } = rebalance([section('a', 0), section('b', 0), section('c', 0)], 350)
  assert.equal(total, 350)
  assert.ok(sections.every((s) => s.word_count > 0))
})

test('preserves relative proportions when rescaling', () => {
  const { sections } = rebalance([section('big', 400), section('small', 100)], 350)
  assert.ok(sections[0].word_count > sections[1].word_count * 3)
})

test('never emits a section under 5 words', () => {
  const { sections, total } = rebalance([section('a', 1000), section('tiny', 1)], 350)
  assert.equal(total, 350)
  assert.ok(sections.every((s) => s.word_count >= 5))
})

test('empty section list falls back to the default six sections', () => {
  const { sections, total } = rebalance([], 350)
  assert.equal(total, 350)
  assert.equal(sections.length, 6)
})

test('assertBudget throws when the total is wrong', () => {
  assert.throws(() => assertBudget([section('a', 100)], 350), /Word budget invariant violated/)
})

test('works for a non-350 word limit', () => {
  assert.equal(rebalance([section('a', 10), section('b', 90)], 650).total, 650)
})

test('handles negative word counts from a malformed model response', () => {
  const { sections, total } = rebalance([section('a', -50), section('b', 100)], 350)
  assert.equal(total, 350)
  assert.ok(sections.every((s) => s.word_count >= 5))
})
