import { createClient } from '@supabase/supabase-js';
export const SUPABASE_URL = "https://ysdcsqsfnckeuafjyrbc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZGNzcXNmbmNrZXVhZmp5cmJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NzQyODksImV4cCI6MjA2NTM1MDI4OX0.LA-Z6t1uSQrVvZsPimxy65uPSEAf3sOHzOQD_zdt-mI";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
