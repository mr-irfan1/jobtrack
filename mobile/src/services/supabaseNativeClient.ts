import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://glqefugspetxvyqggosd.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscWVmdWdzcGV0eHZ5cWdnb3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNTA1MTAsImV4cCI6MjA1NTkyNjUxMH0.E38lO_fG8_tG3C-2d4p27iY7C3-B_e6eF8d8iY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
