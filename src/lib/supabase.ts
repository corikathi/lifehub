import { createClient } from '@supabase/supabase-js'

// Der publishable key ist für den Browser gedacht. Die Sicherheit kommt aus
// den Row-Level-Security-Regeln in supabase/schema.sql, nicht aus dem Key.
const SUPABASE_URL = 'https://pckagsswwdbjgbjznanc.supabase.co'
const SUPABASE_KEY = 'sb_publishable_vyIMfW4G38Zi-lwxmOVzYw_CV-sMv72'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
