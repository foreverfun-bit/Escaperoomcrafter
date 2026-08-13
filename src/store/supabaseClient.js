import { createClient } from '@supabase/supabase-js';

// Public by design: the anon/publishable key only grants what Row Level
// Security policies allow, scoped to the signed-in user (auth.uid()). It is
// safe to ship in client-side code.
const SUPABASE_URL = 'https://lhiisilyynyntopnfput.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_KKyTB9WOC7ShqHD6_rxGRg_EcFk1X4I';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
