import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// L'URL de base est utilisée pour le client, sans le "/rest/v1/" à la fin
const supabaseUrl = 'https://jaiemokktvpdgehsdpuo.supabase.co'
const supabaseKey = 'sb_publishable_0N2Uh7853MdU_MQ71JnPjQ_va1c0i03'

export const supabase = createClient(supabaseUrl, supabaseKey)
