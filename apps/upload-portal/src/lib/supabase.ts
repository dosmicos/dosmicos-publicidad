import { createClient } from '@supabase/supabase-js'

const fallbackSupabaseUrl = 'https://ysdcsqsfnckeuafjyrbc.supabase.co'
const fallbackSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZGNzcXNmbmNrZXVhZmp5cmJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NzQyODksImV4cCI6MjA2NTM1MDI4OX0.LA-Z6t1uSQrVvZsPimxy65uPSEAf3sOHzOQD_zdt-mI'

function normalizeEnvValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return undefined

  return trimmed
}

const projectId = normalizeEnvValue(import.meta.env.VITE_SUPABASE_PROJECT_ID)
const publishableKey = normalizeEnvValue(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)

export const SUPABASE_URL = (
  normalizeEnvValue(import.meta.env.VITE_SUPABASE_URL) ||
  (projectId ? `https://${projectId}.supabase.co` : fallbackSupabaseUrl)
).replace(/\/+$/, '')

export const SUPABASE_ANON_KEY =
  normalizeEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  publishableKey ||
  fallbackSupabaseAnonKey

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Faltan las variables de entorno de Supabase')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
