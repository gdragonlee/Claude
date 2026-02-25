import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('[Supabase] URL:', supabaseUrl);
console.log('[Supabase] KEY:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : '누락');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] 환경 변수 누락!');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    storageKey: 'duty-manager-auth',
    flowType: 'implicit',
  },
});
