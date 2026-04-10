import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = Object.fromEntries(
  fs.readFileSync('.env.local','utf8').split('\n').filter(l=>l&&!l.startsWith('#'))
    .map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1).replace(/^["']|["']$/g,'')]})
);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {auth:{autoRefreshToken:false,persistSession:false}});
const { data: list } = await admin.auth.admin.listUsers({page:1,perPage:1000});
const u = list.users.find(x => x.email === 'admin@isometrix.local');
if (u) { await admin.auth.admin.deleteUser(u.id); console.log('deleted'); } else console.log('no admin user');
