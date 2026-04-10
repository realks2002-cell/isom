import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i), l.slice(i+1).replace(/^["']|["']$/g,'')]; })
);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const EMAIL = 'realks22@gmail.com';
const PASSWORD = 'Ks2002';

// Check if exists
const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
let user = list.users.find(u => u.email === EMAIL);

if (!user) {
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL, password: PASSWORD, email_confirm: true,
  });
  if (error) { console.error('createUser:', error.message); process.exit(1); }
  user = data.user;
  console.log('Created user:', user.id);
} else {
  console.log('User exists:', user.id);
  const { error } = await admin.auth.admin.updateUserById(user.id, { password: PASSWORD });
  if (error) console.error('updatePw:', error.message);
}

// Profile -> admin
const { error: pe } = await admin.from('iso_profiles').update({
  name: '마스터', role: 'admin',
}).eq('id', user.id);
if (pe) console.error('profile:', pe.message);

// Credentials
const { error: ce } = await admin.from('iso_user_credentials').upsert({
  user_id: user.id, plain_password: PASSWORD, updated_at: new Date().toISOString(),
});
if (ce) console.error('cred:', ce.message);

// Verify
const { data: prof } = await admin.from('iso_profiles').select('id,name,role').eq('id', user.id).single();
console.log('Profile:', prof);
console.log('DONE');
