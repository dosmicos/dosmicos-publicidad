import { createClient } from '@supabase/supabase-js'

const fallbackSupabaseUrl = 'https://ysdcsqsfnckeuafjyrbc.supabase.co'
const fallbackSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZGNzcXNmbmNrZXVhZmp5cmJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NzQyODksImV4cCI6MjA2NTM1MDI4OX0.LA-Z6t1uSQrVvZsPimxy65uPSEAf3sOHzOQD_zdt-mI'

const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (projectId ? `https://${projectId}.supabase.co` : fallbackSupabaseUrl)

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  publishableKey ||
  fallbackSupabaseAnonKey

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
