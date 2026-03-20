import { createClient } from '@supabase/supabase-js';
export const SUPABASE_URL = 'https://ysdcsqsfnckeuafjyrbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZGNzcXNmbmNrZXVhZmp5cmJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1NzgzMTMsImV4cCI6MjA0ODE1NDMxM30.jMM5KYhxBapm5uxHYYkKZVxL-zWsmOxW3p-qKMf1a_I';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
