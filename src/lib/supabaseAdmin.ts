import 'server-only'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined) ?? ''
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined) ?? ''

// Cliente Supabase con Service Role: solo en servidor
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)