import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client for route handlers only.
 *
 * This key bypasses RLS and must never reach the browser. It is read from a
 * non-NEXT_PUBLIC env var so Next cannot inline it into client bundles.
 */

let cached: SupabaseClient | undefined

export function serviceClient(): SupabaseClient {
  if (cached) return cached

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

  if (!url || !key) {
    throw new Error('Supabase server credentials are not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}

export function hasSupabase(): boolean {
  return Boolean(
    (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY),
  )
}
