import assert from 'node:assert/strict'
import { test } from 'node:test'
import { explainAdvantage, rankStories, scoreStory } from '../lib/domain/scoring'
import { SCORE_CRITERIA, type CandidateStory, type StoryEntity } from '../lib/domain/types'

const entity = (type: StoryEntity['type'], name: string, confidence: number): StoryEntity => ({
  type,
  name,
  summary: `${name} summary`,
  evidence: `the student described ${name} in their own words`,
  confidence,
})

const emptyStory = (id: string, title: string): CandidateStory => ({
  id,
  title,
  summary: '',
  experience: '',
  challenge: '',
  action: '',
  impact: '',
  reflection: '',
  future_connection: '',
})

const richStory: CandidateStory = {
  id: 'community-app',
  title: 'Community centre records app',
  summary:
    'I volunteered at the Lincoln community centre and built a small application to organise student records after I noticed staff losing paperwork.',
  experience:
    'When I volunteered at the Lincoln community centre in 2023, I noticed they were struggling to manage student records on paper.',
  challenge:
    'The staff were spending 3 hours every week re-entering the same information, and records were going missing because nobody owned the process.',
  action:
    'I decided to build a small application for organising the records, because I thought I could make the process easier for them.',
  impact:
    'After people started using what I built, the staff stopped losing paperwork and one coordinator told me it gave her an afternoon back each week.',
  reflection:
    'I realized technology wasn not only about coding. I used to think being good at technology meant being technically skilled, but now I understand it means understanding people needs and building things that are genuinely useful.',
  future_connection:
    'I want to study computer science alongside social policy so I can keep building tools for community organisations.',
}

const thinStory: CandidateStory = {
  ...emptyStory('sports', 'Sports leadership'),
  summary: 'I played on a team.',
  experience: 'I was on the team.',
  challenge: 'It was hard.',
  action: 'I tried.',
  impact: 'It went okay.',
  reflection: 'It was good.',
  future_connection: '',
}

test('every criterion stays within 0-10 and the total within 0-100', () => {
  const scored = scoreStory(richStory, [entity('value', 'empathy', 0.9)])
  for (const criterion of SCORE_CRITERIA) {
    const value = scored.scores[criterion]
    assert.ok(value >= 0 && value <= 10, `${criterion} out of range: ${value}`)
  }
  assert.ok(scored.total >= 0 && scored.total <= 100)
})

test('an empty story scores near zero', () => {
  const scored = scoreStory(emptyStory('blank', 'Blank'), [])
  assert.ok(scored.total < 20, `expected a low score, got ${scored.total}`)
})

test('a detailed story outscores a thin one', () => {
  const rich = scoreStory(richStory, [entity('value', 'empathy', 0.92), entity('skill', 'problem solving', 0.88)])
  const thin = scoreStory(thinStory, [])
  assert.ok(rich.total > thin.total, `${rich.total} should beat ${thin.total}`)
})

test('scoring is deterministic across runs', () => {
  const entities = [entity('value', 'initiative', 0.85)]
  assert.equal(scoreStory(richStory, entities).total, scoreStory(richStory, entities).total)
})

test('more supporting evidence raises evidence_strength', () => {
  const few = scoreStory(richStory, [entity('value', 'empathy', 0.9)])
  const many = scoreStory(richStory, [
    entity('value', 'empathy', 0.9),
    entity('value', 'initiative', 0.9),
    entity('skill', 'problem solving', 0.9),
    entity('skill', 'communication', 0.9),
    entity('perspective_shift', 'tech serves people', 0.9),
    entity('future_goal', 'study CS', 0.9),
  ])
  assert.ok(many.scores.evidence_strength > few.scores.evidence_strength)
})

test('an explicit college connection entity lifts that criterion', () => {
  const without = scoreStory(richStory, [])
  const withConnection = scoreStory(richStory, [entity('college_connection', 'Bryn Mawr praxis programme', 0.9)])
  assert.ok(withConnection.scores.college_connection > without.scores.college_connection)
})

test('rankStories returns candidates strongest first', () => {
  const ranked = rankStories([thinStory, richStory], [entity('value', 'empathy', 0.9)])
  assert.equal(ranked[0].id, 'community-app')
  assert.equal(ranked.length, 2)
  assert.ok(ranked[0].total >= ranked[1].total)
})

test('ranking an empty candidate list yields an empty array', () => {
  assert.deepEqual(rankStories([], []), [])
})

test('explainAdvantage names concrete criteria the winner leads on', () => {
  const ranked = rankStories([thinStory, richStory], [entity('value', 'empathy', 0.9)])
  const reasons = explainAdvantage(ranked[0], ranked[1])
  assert.ok(reasons.length > 0)
  assert.ok(reasons.every((r) => /^Stronger /.test(r)))
})

test('reflection markers raise reflection depth', () => {
  const flat = scoreStory({ ...richStory, reflection: 'It was fine.' }, [])
  assert.ok(scoreStory(richStory, []).scores.reflection_depth > flat.scores.reflection_depth)
})
