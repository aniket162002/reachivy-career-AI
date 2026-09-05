/**
 * Development seed session, as specified by the assignment.
 * Used as the default when a new session is created without overrides.
 */
export const SEED_SESSION = {
  college: 'Bryn Mawr College',
  essayTitle: 'Essay 1: Personal Story',
  wordLimit: 350,
  prompt:
    'How has your life experience contributed to your personal story—your character, values, perspectives, or skills—and what you want to pursue at Bryn Mawr College?',
} as const

export const INSTRUCTIONS = [
  'This is a short, focused voice session designed to understand your story.',
  'Ivy will ask questions about your experiences, values, perspectives, skills and goals.',
  'Based only on your answers, Ivy will create a strong essay strategy aligned with the prompt.',
  'Ivy will not invent experiences or write a fake story for you.',
] as const

export const PRIVACY_NOTE =
  'Your voice is used to understand your response. Raw audio is not retained after processing.'
