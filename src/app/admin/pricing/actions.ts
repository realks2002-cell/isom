'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminAuthed } from '@/lib/admin-auth';

type ActionResult = { ok: true } | { error: string };

async function guard() {
  if (!(await isAdminAuthed())) return '관리자 권한 필요';
  return null;
}

export async function updatePlan(formData: FormData): Promise<ActionResult> {
  const err = await guard();
  if (err) return { error: err };

  const id = String(formData.get('id') || '');
  if (!id) return { error: 'id 필요' };

  const name = String(formData.get('name') || '').trim();
  const price = Number(formData.get('price') || 0);
  const renderLimit = Number(formData.get('render_limit') || 0);
  const projectLimit = Number(formData.get('project_limit') || -1);
  const isPopular = formData.get('is_popular') === 'on';
  const isActive = formData.get('is_active') === 'on';
  const featuresRaw = String(formData.get('features') || '');
  const features = featuresRaw.split('\n').map((s) => s.trim()).filter(Boolean);

  const admin = createAdminClient();
  const { error: dbErr } = await admin
    .from('iso_pricing_plans')
    .update({
      name,
      price,
      render_limit: renderLimit,
      project_limit: projectLimit,
      is_popular: isPopular,
      is_active: isActive,
      features,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (dbErr) return { error: dbErr.message };

  revalidatePath('/admin/pricing');
  revalidatePath('/');
  return { ok: true };
}

export async function createPlan(formData: FormData): Promise<ActionResult> {
  const err = await guard();
  if (err) return { error: err };

  const name = String(formData.get('name') || '').trim();
  if (!name) return { error: '이름 필요' };
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const price = Number(formData.get('price') || 0);
  const renderLimit = Number(formData.get('render_limit') || 0);
  const projectLimit = Number(formData.get('project_limit') || -1);
  const featuresRaw = String(formData.get('features') || '');
  const features = featuresRaw.split('\n').map((s) => s.trim()).filter(Boolean);

  const admin = createAdminClient();
  const { error: dbErr } = await admin
    .from('iso_pricing_plans')
    .insert({ name, slug, price, render_limit: renderLimit, project_limit: projectLimit, features });

  if (dbErr) return { error: dbErr.message };

  revalidatePath('/admin/pricing');
  revalidatePath('/');
  return { ok: true };
}

export async function deletePlan(formData: FormData): Promise<ActionResult> {
  const err = await guard();
  if (err) return { error: err };

  const id = String(formData.get('id') || '');
  if (!id) return { error: 'id 필요' };

  const admin = createAdminClient();
  const { error: dbErr } = await admin.from('iso_pricing_plans').delete().eq('id', id);
  if (dbErr) return { error: dbErr.message };

  revalidatePath('/admin/pricing');
  revalidatePath('/');
  return { ok: true };
}
