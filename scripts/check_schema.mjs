import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = Object.fromEntries(
  fs.readFileSync('.env.local','utf8').split('\n').filter(l=>l&&!l.startsWith('#'))
    .map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1).replace(/^["']|["']$/g,'')]})
);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth:{autoRefreshToken:false,persistSession:false}
});

// 1) profiles columns
const { data: p, error: pe } = await admin.from('iso_profiles').select('id,name,address,admin_memo,role,created_at').limit(1);
console.log('iso_profiles query:', pe ? 'ERR: '+pe.message : 'OK', p?.length || 0, 'rows');

// 2) credentials table
const { data: c, error: ce } = await admin.from('iso_user_credentials').select('user_id').limit(1);
console.log('iso_user_credentials:', ce ? 'ERR: '+ce.message : 'OK', c?.length || 0, 'rows');

// 3) listUsers
try {
  const { data: l, error: le } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  console.log('listUsers:', le ? 'ERR: '+le.message : 'OK', l?.users?.length || 0, 'users');
} catch(e) { console.log('listUsers threw:', e.message); }
