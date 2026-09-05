'use client'

import { motion } from 'framer-motion'

/**
 * The Ivy assistant mark. Its animation reflects the real voice state rather
 * than looping decoratively:
 *   idle      soft pulse
 *   listening bars respond to measured microphone amplitude
 *   thinking  slow gradient drift
 *   speaking  active waveform
 */
export type IvyState = 'idle' | 'listening' | 'thinking' | 'speaking'

interface Props {
  state?: IvyState
  /** Measured input amplitude 0..1, used while listening. */
  level?: number
  size?: number
}

const BAR_COUNT = 5
/** Resting heights, tallest in the middle, as a fraction of the inner circle. */
const RESTING = [0.34, 0.52, 0.68, 0.52, 0.34]

export function IvyMark({ state = 'idle', level = 0, size = 26 }: Props) {
  const inner = size - 6

  return (
    <span
      className="ivy-mark"
      style={{ width: size, height: size }}
      role="img"
      aria-label={
        state === 'listening'
          ? 'Ivy is listening'
          : state === 'thinking'
            ? 'Ivy is thinking'
            : state === 'speaking'
              ? 'Ivy is speaking'
              : 'Ivy'
      }
    >
      <motion.span
        className="ivy-mark-ring"
        animate={
          state === 'thinking'
            ? { rotate: 360 }
            : state === 'listening'
              ? { scale: 1 + level * 0.18 }
              : state === 'speaking'
                ? { scale: [1, 1.05, 1] }
                : { scale: [1, 1.03, 1] }
        }
        transition={
          state === 'thinking'
            ? { duration: 3.2, repeat: Infinity, ease: 'linear' }
            : state === 'listening'
              ? { type: 'spring', stiffness: 320, damping: 22 }
              : { duration: state === 'speaking' ? 1.1 : 2.8, repeat: Infinity, ease: 'easeInOut' }
        }
      />
      <span className="ivy-mark-face" style={{ width: inner, height: inner }}>
        {Array.from({ length: BAR_COUNT }).map((_, index) => {
          const resting = RESTING[index] * inner
          const height =
            state === 'listening'
              ? // Centre bars react most, so the shape reads as a voice.
                resting + level * inner * 0.55 * (1 - Math.abs(index - 2) * 0.22)
              : resting

          return (
            <motion.i
              key={index}
              animate={
                state === 'speaking'
                  ? { height: [resting * 0.6, resting * 1.35, resting * 0.75, resting] }
                  : state === 'listening'
                    ? { height }
                    : { height: resting }
              }
              transition={
                state === 'speaking'
                  ? { duration: 0.75, repeat: Infinity, delay: index * 0.09, ease: 'easeInOut' }
                  : { type: 'spring', stiffness: 400, damping: 26 }
              }
              style={{ height: resting }}
            />
          )
        })}
      </span>
    </span>
  )
}

/**
 * Large hero version of the assistant shown in the empty conversation state.
 */
export function IvyHero({ state = 'idle', level = 0 }: Props) {
  return (
    <div className="ivy-hero">
      <motion.div
        className="ivy-hero-halo"
        animate={
          state === 'listening'
            ? { scale: 1 + level * 0.3, opacity: 0.55 + level * 0.35 }
            : state === 'thinking'
              ? { scale: [1, 1.08, 1], opacity: [0.35, 0.6, 0.35] }
              : { scale: [1, 1.05, 1], opacity: [0.3, 0.45, 0.3] }
        }
        transition={
          state === 'listening'
            ? { type: 'spring', stiffness: 260, damping: 20 }
            : { duration: state === 'thinking' ? 1.8 : 3.4, repeat: Infinity, ease: 'easeInOut' }
        }
      />
      <IvyMark state={state} level={level} size={74} />
    </div>
  )
}
