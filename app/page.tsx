'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Loader2, RotateCcw } from 'lucide-react'
import { Composer, type ComposerBusy } from '@/components/ivy/Composer'
import { ConversationPanel } from '@/components/ivy/ConversationPanel'
import { ErrorBanner } from '@/components/ivy/ErrorBanner'
import { EssayBlueprint } from '@/components/ivy/EssayBlueprint'
import { Header } from '@/components/ivy/Header'
import { InstructionsCard } from '@/components/ivy/InstructionsCard'
import { IvyHero } from '@/components/ivy/IvyAssistant'
import { StoryReview } from '@/components/ivy/StoryReview'
import { StrategyPanel } from '@/components/ivy/StrategyPanel'
import { IvyApiError, api, type SessionMeta, type StoriesResponse } from '@/lib/api/client'
import { emptyCovered } from '@/lib/domain/completeness'
import { INSTRUCTIONS, SEED_SESSION } from '@/lib/domain/seed'
import type { Blueprint, ConversationState, Turn } from '@/lib/domain/types'
import { createClient } from '@/lib/supabase/client'
import { useRecorder } from '@/lib/voice/useRecorder'
import { useSpeech } from '@/lib/voice/useSpeech'

type Screen = 'conversation' | 'review' | 'blueprint'

const STORAGE_KEY = 'ivy.sessionId'

const EMPTY_STATE: ConversationState = {
  covered: emptyCovered(),
  entities: [],
  candidates: [],
  missing: [],
  completeness: 0,
  phase: 'discovery',
  readyForStrategy: false,
}

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} mins`
}

export default function Page() {
  const [session, setSession] = useState<SessionMeta | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const [state, setState] = useState<ConversationState>(EMPTY_STATE)
  const [screen, setScreen] = useState<Screen>('conversation')
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null)
  const [stories, setStories] = useState<StoriesResponse | null>(null)

  const [input, setInput] = useState('')
  const [busy, setBusy] = useState<ComposerBusy>('idle')
  const [booting, setBooting] = useState(true)
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState<{ message: string; code?: string } | null>(null)
  const [reason, setReason] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [speakingTurnId, setSpeakingTurnId] = useState<string | null>(null)

  const recorder = useRecorder()
  const speech = useSpeech()
  const retryRef = useRef<(() => void) | null>(null)

  const wordLimit = session?.wordLimit ?? SEED_SESSION.wordLimit

  /** Maps any thrown value onto the error banner. */
  const report = useCallback((err: unknown, retry?: () => void) => {
    retryRef.current = retry ?? null
    if (err instanceof IvyApiError) setError({ message: err.message, code: err.code })
    else setError({ message: err instanceof Error ? err.message : 'Something went wrong. Please try again.' })
  }, [])

  // ---- Session bootstrap (resume if we have one, else create) --------------

  const hydrate = useCallback(async (sessionId: string) => {
    const snapshot = await api.getState(sessionId)
    setSession(snapshot.session)
    setTurns(snapshot.turns)
    setState(snapshot.state)
    if (snapshot.blueprint) {
      setBlueprint(snapshot.blueprint)
      setScreen('blueprint')
    } else if (snapshot.session.status === 'review') {
      setScreen('review')
    }
    return snapshot
  }, [])

  const startSession = useCallback(async () => {
    const created = await api.createSession()
    window.localStorage.setItem(STORAGE_KEY, created.sessionId)
    await hydrate(created.sessionId)
  }, [hydrate])

  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      setBooting(true)
      const existing = window.localStorage.getItem(STORAGE_KEY)

      try {
        if (existing) {
          try {
            await hydrate(existing)
            return
          } catch (err) {
            // A stale id from a wiped database: fall through to a new session.
            if (!(err instanceof IvyApiError && err.code === 'not_found')) throw err
            window.localStorage.removeItem(STORAGE_KEY)
          }
        }
        await startSession()
      } catch (err) {
        if (!cancelled) report(err, () => window.location.reload())
      } finally {
        if (!cancelled) setBooting(false)
      }
    }

    boot()
    return () => {
      cancelled = true
    }
  }, [hydrate, startSession, report])

  // ---- Session timer -------------------------------------------------------

  useEffect(() => {
    if (!session) return
    const started = new Date(session.startedAt).getTime()
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - started) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [session])

  // ---- Realtime: keep the transcript live across tabs/devices --------------

  useEffect(() => {
    if (!session) return

    const supabase = createClient()
    const channel = supabase
      .channel(`ivy-session-${session.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversation_turns', filter: `session_id=eq.${session.id}` },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new as unknown as Turn
          // Local sends already appended this turn; only add what we lack.
          setTurns((current) => (current.some((turn) => turn.id === row.id) ? current : [...current, row]))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session])

  // ---- Voice ---------------------------------------------------------------

  const speakTurn = useCallback(
    (text: string, turnId?: string) => {
      setSpeakingTurnId(turnId ?? null)
      void speech.speak(text).finally(() => setSpeakingTurnId(null))
    },
    [speech],
  )

  const listenToInstructions = useCallback(() => {
    speakTurn(`Instructions. ${INSTRUCTIONS.join(' ')}`)
  }, [speakTurn])

  // ---- Conversation turn ---------------------------------------------------

  const submit = useCallback(
    async (answer: string, source: 'voice' | 'text') => {
      const trimmed = answer.trim()
      if (!trimmed || !session) return

      setError(null)
      setBusy('thinking')
      setInput('')

      // Optimistic student turn so the transcript feels immediate.
      const optimisticId = `pending-${Date.now()}`
      setTurns((current) => [...current, { id: optimisticId, speaker: 'student', content: trimmed, source }])

      try {
        const result = await api.sendMessage(session.id, trimmed, source)

        setTurns((current) => {
          const withoutOptimistic = current.filter((turn) => turn.id !== optimisticId)
          const next = [...withoutOptimistic]
          // Realtime may have already delivered either turn.
          for (const turn of [result.studentTurn, result.ivyTurn]) {
            if (!next.some((existing) => existing.id === turn.id)) next.push(turn)
          }
          return next
        })

        setState({
          covered: Object.fromEntries(
            Object.keys(emptyCovered()).map((key) => [key, result.covered_dimensions.includes(key as never)]),
          ) as ConversationState['covered'],
          entities: result.entities,
          candidates: result.candidates,
          missing: result.missing_dimensions,
          completeness: result.completeness,
          phase: result.phase,
          readyForStrategy: result.ready_for_strategy,
        })

        setReason(result.reason_for_question)
        speakTurn(result.assistant_message, result.ivyTurn.id)
      } catch (err) {
        // Roll the optimistic turn back and hand the text back to the student.
        setTurns((current) => current.filter((turn) => turn.id !== optimisticId))
        setInput(trimmed)
        report(err, () => void submit(trimmed, source))
      } finally {
        setBusy('idle')
      }
    },
    [session, speakTurn, report],
  )

  // ---- Microphone ----------------------------------------------------------

  const startListening = useCallback(async () => {
    setError(null)
    // Ivy stops talking the moment the student starts — barge-in.
    speech.stop()
    const started = await recorder.start()
    if (!started && recorder.error) setError({ message: recorder.error, code: 'mic' })
  }, [recorder, speech])

  useEffect(() => {
    if (recorder.error) setError({ message: recorder.error, code: 'mic' })
  }, [recorder.error])

  const stopListening = useCallback(async () => {
    const blob = await recorder.stop()
    if (!blob || !session) return

    setBusy('transcribing')
    try {
      const { text } = await api.transcribe(session.id, blob)
      await submit(text, 'voice')
    } catch (err) {
      report(err)
      setBusy('idle')
    }
  }, [recorder, session, submit, report])

  // ---- Screen transitions --------------------------------------------------

  const goToReview = useCallback(async () => {
    if (!session) return
    setError(null)
    try {
      setStories(await api.getStories(session.id))
      setScreen('review')
    } catch (err) {
      report(err, () => void goToReview())
    }
  }, [session, report])

  const buildBlueprint = useCallback(async () => {
    if (!session) return
    setError(null)
    setBuilding(true)
    try {
      const result = await api.generateBlueprint(session.id)
      setBlueprint(result.blueprint)
      setScreen('blueprint')
    } catch (err) {
      report(err, () => void buildBlueprint())
    } finally {
      setBuilding(false)
    }
  }, [session, report])

  const newSession = useCallback(async () => {
    speech.stop()
    recorder.cancel()
    setBooting(true)
    setError(null)
    setTurns([])
    setState(EMPTY_STATE)
    setBlueprint(null)
    setStories(null)
    setScreen('conversation')
    try {
      await startSession()
    } catch (err) {
      report(err)
    } finally {
      setBooting(false)
    }
  }, [startSession, speech, recorder, report])

  // ---- Derived -------------------------------------------------------------

  const statusLine = useMemo(() => {
    if (busy === 'transcribing') return 'Understanding your story'
    if (busy === 'thinking') return 'Finding the strongest follow-up'
    if (recorder.isListening) return null
    return null
  }, [busy, recorder.isListening])

  const answered = turns.filter((turn) => turn.speaker === 'student').length
  const exploredCount = Object.values(state.covered).filter(Boolean).length
  const hasConversation = answered > 0

  const ivyState = recorder.isListening
    ? 'listening'
    : busy !== 'idle'
      ? 'thinking'
      : speech.speaking
        ? 'speaking'
        : 'idle'

  if (booting) {
    return (
      <main className="ivy-app boot">
        <div className="boot-inner">
          <IvyHero state="thinking" />
          <p>Preparing your brainstorming session…</p>
        </div>
      </main>
    )
  }

  return (
    <main className="ivy-app">
      <Header
        college={session?.college ?? SEED_SESSION.college}
        essayTitle={session?.essayTitle ?? SEED_SESSION.essayTitle}
        wordLimit={wordLimit}
        elapsed={formatClock(elapsed)}
      />

      <div className="workspace">
        <div className="title-row">
          <div>
            <span className="eyebrow">Voice-led essay coaching</span>
            <h1>Find the story only you can tell.</h1>
          </div>
          <button type="button" className="reset" onClick={newSession}>
            <RotateCcw size={13} /> New session
          </button>
        </div>

        <AnimatePresence>
          {error && (
            <ErrorBanner
              message={error.message}
              code={error.code}
              onDismiss={() => setError(null)}
              onRetry={retryRef.current ?? undefined}
            />
          )}
        </AnimatePresence>

        {screen === 'conversation' && (
          <>
            <InstructionsCard
              onListen={listenToInstructions}
              onStop={speech.stop}
              speaking={speech.speaking}
              prompt={session?.prompt ?? SEED_SESSION.prompt}
            />

            <div className="strategy-card">
              <div className="card-title">
                <strong>Let&apos;s start building the essay structure</strong>
                <span className="explored">
                  {exploredCount} / {Object.keys(state.covered).length} areas explored
                </span>
                <span className="time">{formatClock(elapsed)}</span>
              </div>

              <div className={hasConversation ? 'strategy-body' : 'strategy-body empty'}>
                <div className="strategy-transcript">
                  {hasConversation ? (
                    <ConversationPanel
                      turns={turns}
                      status={statusLine}
                      onReplay={(text) => speakTurn(text)}
                      speakingId={speakingTurnId}
                    />
                  ) : (
                    <div className="empty-state">
                      <IvyHero state={ivyState} level={recorder.level} />
                      {turns.map((turn) => (
                        <motion.p
                          key={turn.id}
                          className="empty-line"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {turn.content}
                        </motion.p>
                      ))}
                      {statusLine && <p className="empty-status">{statusLine}…</p>}
                    </div>
                  )}

                  <Composer
                    value={input}
                    onChange={setInput}
                    onSend={() => void submit(input, 'text')}
                    onMicStart={() => void startListening()}
                    onMicStop={() => void stopListening()}
                    onMicCancel={recorder.cancel}
                    listening={recorder.isListening}
                    requestingPermission={recorder.status === 'requesting_permission'}
                    level={recorder.level}
                    seconds={recorder.seconds}
                    busy={busy}
                  />
                </div>

                {hasConversation && <StrategyPanel state={state} />}
              </div>

              <div className="card-footer">
                {reason && <p className="reason">Ivy is asking this because: {reason.toLowerCase()}</p>}
                <button
                  type="button"
                  className="primary"
                  onClick={() => void goToReview()}
                  disabled={!state.readyForStrategy}
                  title={
                    state.readyForStrategy
                      ? 'Review what Ivy heard'
                      : 'Keep talking with Ivy — there is not enough of your story yet.'
                  }
                >
                  Review &amp; Edit Structure <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}

        {screen === 'review' && (
          <StoryReview
            state={state}
            stories={stories?.stories ?? []}
            comparison={stories?.comparison ?? null}
            onBuild={() => void buildBlueprint()}
            building={building}
            wordLimit={wordLimit}
          />
        )}

        {screen === 'blueprint' && blueprint && (
          <EssayBlueprint blueprint={blueprint} wordLimit={wordLimit} onBack={() => setScreen('review')} />
        )}
      </div>

      <footer>
        <span>Ivy helps you find your story. She never invents it.</span>
        <span>{answered} responses captured</span>
      </footer>
    </main>
  )
}
