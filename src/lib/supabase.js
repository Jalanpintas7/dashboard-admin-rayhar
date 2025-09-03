import { createClient } from '@supabase/supabase-js'

// Menggunakan environment variables jika tersedia, fallback ke nilai default
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lrpsrlmlrgqivfczbzqp.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxycHNybG1scmdxaXZmY3pienFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjAxOTYsImV4cCI6MjA3MDc5NjE5Nn0.6FuahA3i5mZZHjLmOHnZdLn_g09fgfkmL9cPPyuOeJo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Export untuk penggunaan di komponen
export default supabase
