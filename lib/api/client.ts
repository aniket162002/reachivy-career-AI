import type { PromptAnalysis } from '../agents/promptAnalyzer'
import type { Blueprint, ConversationState, Dimension, ScoredStory, StoryEntity, Turn } from '../domain/types'

/**
 * Typed browser client for the Ivy API.
 *
 * Every failure is normalised into `IvyApiError` carrying the server's `code`,
 * so components render one specific friendly message instead of guessing.
 */

export class IvyApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'IvyApiError'
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, init)
  } catch {
    // Thrown when the network is down or the dev server is not running.
    throw new IvyApiError('You appear to be offline. Check your connection and try again.', 'network', 0)
  }

  if (response.status === 204) return undefined as T

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new IvyApiError(
      payload?.error ?? 'Something went wrong. Please try again.',
      payload?.code ?? 'server_error',
      response.status,
    )
  }

  return payload as T
}

export interface SessionMeta {
  id: string
  college: string
  essayTitle: string
  prompt: string
  wordLimit: number
  status: string
  startedAt: string
  completedAt: string | null
}

export interface SessionSnapshot {
  session: SessionMeta
  analysis: PromptAnalysis | null
  state: ConversationState
  turns: Turn[]
  blueprint: (Blueprint & { id: string }) | null
}

export interface MessageResponse {
  studentTurn: Turn
  ivyTurn: Turn
  assistant_message: string
  reason_for_question: string
  phase: ConversationState['phase']
  covered_dimensions: Dimension[]
  missing_dimensions: Dimension[]
  completeness: number
  ready_for_strategy: boolean
  entities: StoryEntity[]
  candidates: ConversationState['candidates']
}

export interface StoriesResponse {
  stories: ScoredStory[]
  selected: ScoredStory | null
  comparison: { winner: string; runnerUp: string; reasons: string[] } | null
}

export interface BlueprintResponse {
  blueprintId?: string
  blueprint: Blueprint
  wordLimit: number
  total: number
  ranked?: ScoredStory[]
}

export const api = {
  createSession(body?: { college?: string; essayTitle?: string; prompt?: string; wordLimit?: number }) {
    return request<{ sessionId: string; analysis: PromptAnalysis; turns: Turn[] }>('/api/sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    })
  },

  getState(sessionId: string) {
    return request<SessionSnapshot>(`/api/sessions/${sessionId}/state`)
  },

  sendMessage(sessionId: string, answer: string, source: 'voice' | 'text') {
    return request<MessageResponse>(`/api/sessions/${sessionId}/message`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ answer, source }),
    })
  },

  transcribe(sessionId: string, audio: Blob) {
    const form = new FormData()
    form.append('audio', audio)
    return request<{ text: string }>(`/api/sessions/${sessionId}/transcribe`, { method: 'POST', body: form })
  },

  getStories(sessionId: string) {
    return request<StoriesResponse>(`/api/sessions/${sessionId}/stories`)
  },

  generateBlueprint(sessionId: string) {
    return request<BlueprintResponse>(`/api/sessions/${sessionId}/generate-blueprint`, { method: 'POST' })
  },

  getBlueprint(sessionId: string) {
    return request<BlueprintResponse>(`/api/sessions/${sessionId}/blueprint`)
  },

  /** Returns null when the server has no TTS available; caller falls back. */
  async speak(text: string): Promise<Blob | null> {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (response.status === 204 || !response.ok) return null
    return response.blob()
  },
}
