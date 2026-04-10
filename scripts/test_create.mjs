import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = Object.fromEntries(
  fs.readFileSync('.env.local','utf8').split('\n').filter(l=>l&&!l.startsWith('#'))
    .map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1).replace(/^["']|["']$/g,'')]})
);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth:{autoRefreshToken:false,persistSession:false}
});

// Simulate createUser action
const loginId = 'admin';
const password = 'admin123';

const { data: created, error } = await admin.auth.admin.createUser({
  email: `${loginId}@isometrix.local`,
  password,
  email_confirm: true,
});
if (error) { console.log('createUser ERR:', error.message); process.exit(1); }
console.log('created:', created.user.id);

const { error: pe } = await admin.from('iso_profiles').update({
  name: '이강석', company_name: '비즈스타트', address: '용인', admin_memo: ''
}).eq('id', created.user.id);
console.log('profile update:', pe ? 'ERR: '+pe.message : 'OK');

const { error: ce } = await admin.from('iso_user_credentials').upsert({
  user_id: created.user.id, plain_password: password, updated_at: new Date().toISOString()
});
console.log('credentials:', ce ? 'ERR: '+ce.message : 'OK');

// cleanup
await admin.auth.admin.deleteUser(created.user.id);
console.log('cleanup done');
