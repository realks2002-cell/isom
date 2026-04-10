'use server';

import { redirect } from 'next/navigation';
import {
  setAdminCookie,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
} from '@/lib/admin-auth';

export async function loginAction(formData: FormData) {
  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '');
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    redirect('/admin?error=1');
  }
  await setAdminCookie();
  redirect('/admin/users');
}
