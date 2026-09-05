'use client'

import { motion } from 'framer-motion'
import { AlertCircle, KeyRound, MicOff, RefreshCw, WifiOff, X } from 'lucide-react'

interface Props {
  message: string
  code?: string
  onDismiss: () => void
  onRetry?: () => void
}

/** Chooses an icon that matches the failure so the state reads at a glance. */
function iconFor(code?: string) {
  switch (code) {
    case 'missing_api_key':
      return KeyRound
    case 'network':
    case 'database_unavailable':
      return WifiOff
    case 'mic':
      return MicOff
    default:
      return AlertCircle
  }
}

/**
 * One friendly, specific error surface. Every failure path in the app routes
 * here rather than throwing an unstyled error or failing silently.
 */
export function ErrorBanner({ message, code, onDismiss, onRetry }: Props) {
  const Icon = iconFor(code)

  return (
    <motion.div
      className={code === 'missing_api_key' ? 'error-banner setup' : 'error-banner'}
      role="alert"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
    >
      <Icon size={15} />
      <div className="error-body">
        <p>{message}</p>
        {code === 'missing_api_key' && (
          <p className="error-hint">
            Get a free key at <code>aistudio.google.com/apikey</code>, add{' '}
            <code>GOOGLE_GENERATIVE_AI_API_KEY=your-key</code> to <code>.env</code>, then restart the dev server.
          </p>
        )}
      </div>

      {onRetry && (
        <button type="button" className="ghost-btn" onClick={onRetry} aria-label="Try again">
          <RefreshCw size={13} />
        </button>
      )}
      <button type="button" className="ghost-btn" onClick={onDismiss} aria-label="Dismiss this message">
        <X size={14} />
      </button>
    </motion.div>
  )
}
