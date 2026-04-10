'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient, toEmail } from '@/lib/supabase/admin';
import { isAdminAuthed } from '@/lib/admin-auth';

type ActionResult = { ok: true } | { error: string };

async function checkAdmin(): Promise<string | null> {
  if (!(await isAdminAuthed())) return '관리자 권한 필요';
  return null;
}

const ID_REGEX = /^[a-z0-9_-]{2,}$/i;

export async function createUser(formData: FormData): Promise<ActionResult> {
  const authErr = await checkAdmin();
  if (authErr) return { error: authErr };

  const loginId = String(formData.get('loginId') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const name = String(formData.get('name') || '').trim() || null;
  const companyName = String(formData.get('companyName') || '').trim() || null;
  const address = String(formData.get('address') || '').trim() || null;
  const adminMemo = String(formData.get('adminMemo') || '').trim() || null;

  if (!ID_REGEX.test(loginId)) return { error: 'ID 형식 오류 (영문/숫자/_/- 2자 이상)' };
  if (password.length < 6) return { error: '비밀번호 6자 이상' };

  const admin = createAdminClient();

  const { data: created, error } = await admin.auth.admin.createUser({
    email: toEmail(loginId),
    password,
    email_confirm: true,
  });
  if (error || !created?.user) {
    return {
      error: error?.message.includes('already') ? '이미 존재하는 ID' : error?.message || '생성 실패',
    };
  }

  const userId = created.user.id;

  const { error: pe } = await admin
    .from('iso_profiles')
    .update({ name, company_name: companyName, address, admin_memo: adminMemo })
    .eq('id', userId);
  if (pe) return { error: `프로필 저장 실패: ${pe.message}` };

  const { error: ce } = await admin
    .from('iso_user_credentials')
    .upsert({ user_id: userId, plain_password: password, updated_at: new Date().toISOString() });
  if (ce) return { error: `비번 저장 실패: ${ce.message}` };

  revalidatePath('/admin/users');
  return { ok: true };
}

export async function updateUser(formData: FormData): Promise<ActionResult> {
  const authErr = await checkAdmin();
  if (authErr) return { error: authErr };

  const userId = String(formData.get('userId') || '');
  const password = String(formData.get('password') || '');
  const name = String(formData.get('name') || '').trim() || null;
  const companyName = String(formData.get('companyName') || '').trim() || null;
  const address = String(formData.get('address') || '').trim() || null;
  const adminMemo = String(formData.get('adminMemo') || '').trim() || null;

  if (!userId) return { error: 'userId 필요' };

  const admin = createAdminClient();

  const { error: pe } = await admin
    .from('iso_profiles')
    .update({ name, company_name: companyName, address, admin_memo: adminMemo })
    .eq('id', userId);
  if (pe) return { error: `프로필 저장 실패: ${pe.message}` };

  if (password && password.length >= 6) {
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) return { error: `비번 변경 실패: ${error.message}` };
    const { error: ce } = await admin
      .from('iso_user_credentials')
      .upsert({ user_id: userId, plain_password: password, updated_at: new Date().toISOString() });
    if (ce) return { error: `비번 저장 실패: ${ce.message}` };
  } else if (password && password.length > 0) {
    return { error: '비밀번호 6자 이상' };
  }

  revalidatePath('/admin/users');
  return { ok: true };
}

export async function deleteUser(formData: FormData): Promise<ActionResult> {
  const authErr = await checkAdmin();
  if (authErr) return { error: authErr };

  const userId = String(formData.get('userId') || '');
  if (!userId) return { error: 'userId 필요' };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: `삭제 실패: ${error.message}` };

  revalidatePath('/admin/users');
  return { ok: true };
}
