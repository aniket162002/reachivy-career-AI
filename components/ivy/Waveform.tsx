'use client'

import { useEffect, useRef } from 'react'

/**
 * Scrolling waveform driven by measured microphone amplitude.
 *
 * Keeps a rolling history of levels so the bars scroll right-to-left like a
 * real recorder, instead of every bar jumping together.
 */
interface Props {
  level: number
  active: boolean
  bars?: number
}

export function Waveform({ level, active, bars = 28 }: Props) {
  const historyRef = useRef<number[]>(Array(bars).fill(0))
  const nodesRef = useRef<(HTMLSpanElement | null)[]>([])
  const rafRef = useRef<number | null>(null)
  const levelRef = useRef(level)

  levelRef.current = level

  useEffect(() => {
    if (!active) {
      historyRef.current = Array(bars).fill(0)
      nodesRef.current.forEach((node) => node && (node.style.height = '3px'))
      return
    }

    let last = 0
    const tick = (time: number) => {
      // Advance the history ~20x/second so the scroll reads clearly.
      if (time - last > 50) {
        last = time
        historyRef.current = [...historyRef.current.slice(1), levelRef.current]
        historyRef.current.forEach((value, index) => {
          const node = nodesRef.current[index]
          if (node) node.style.height = `${Math.max(3, Math.min(30, 3 + value * 30))}px`
        })
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [active, bars])

  return (
    <div className="waveform" aria-hidden="true">
      {Array.from({ length: bars }).map((_, index) => (
        <span
          key={index}
          ref={(node) => {
            nodesRef.current[index] = node
          }}
        />
      ))}
    </div>
  )
}
