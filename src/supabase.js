import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://axlatjpkymkpxnizqhvt.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4bGF0anBreW1rcHhuaXpxaHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTM4NDMsImV4cCI6MjA5NTAyOTg0M30.XTF6d6FY61TJ-C5B1z_U0SkhZkAwca4trxn9zALD5Wc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: {
    headers: {
      'Accept-Language': 'en-US',
    },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})