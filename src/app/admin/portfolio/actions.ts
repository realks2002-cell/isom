'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminAuthed } from '@/lib/admin-auth';

type ActionResult = { ok: true; id?: string } | { error: string };

async function guard() {
  if (!(await isAdminAuthed())) return '관리자 권한 필요';
  return null;
}

function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function uploadThumbIfPresent(
  admin: ReturnType<typeof createAdminClient>,
  file: File | null
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = file.name.split('.').pop() || 'png';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage
    .from('iso-portfolio')
    .upload(path, buf, { contentType: file.type || 'image/png', upsert: false });
  if (error) throw new Error(`썸네일 업로드 실패: ${error.message}`);
  const { data } = admin.storage.from('iso-portfolio').getPublicUrl(path);
  return data.publicUrl;
}

export async function createPortfolio(formData: FormData): Promise<ActionResult> {
  const err = await guard();
  if (err) return { error: err };

  const title = String(formData.get('title') || '').trim();
  if (!title) return { error: '제목 필요' };

  const subtitle = String(formData.get('subtitle') || '').trim() || null;
  const status = String(formData.get('status') || 'active');
  const layerCount = Number(formData.get('layer_count') || 0);
  const sortOrder = Number(formData.get('sort_order') || 0);
  const isActive = formData.get('is_active') === 'on';
  const tags = parseTags(String(formData.get('tags') || ''));
  const thumb = formData.get('thumbnail') as File | null;

  const admin = createAdminClient();
  let thumbnailUrl: string | null = null;
  try {
    thumbnailUrl = await uploadThumbIfPresent(admin, thumb);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const { error: dbErr } = await admin.from('iso_portfolio_items').insert({
    title,
    subtitle,
    status,
    thumbnail_url: thumbnailUrl,
    layer_count: layerCount,
    tags,
    sort_order: sortOrder,
    is_active: isActive,
  });
  if (dbErr) return { error: dbErr.message };

  revalidatePath('/admin/portfolio');
  revalidatePath('/');
  redirect('/admin/portfolio');
}

export async function updatePortfolio(formData: FormData): Promise<ActionResult> {
  const err = await guard();
  if (err) return { error: err };

  const id = String(formData.get('id') || '');
  if (!id) return { error: 'id 필요' };

  const title = String(formData.get('title') || '').trim();
  const subtitle = String(formData.get('subtitle') || '').trim() || null;
  const status = String(formData.get('status') || 'active');
  const layerCount = Number(formData.get('layer_count') || 0);
  const sortOrder = Number(formData.get('sort_order') || 0);
  const isActive = formData.get('is_active') === 'on';
  const tags = parseTags(String(formData.get('tags') || ''));
  const thumb = formData.get('thumbnail') as File | null;

  const admin = createAdminClient();

  const patch: Record<string, unknown> = {
    title,
    subtitle,
    status,
    layer_count: layerCount,
    tags,
    sort_order: sortOrder,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };

  try {
    const thumbUrl = await uploadThumbIfPresent(admin, thumb);
    if (thumbUrl) patch.thumbnail_url = thumbUrl;
  } catch (e) {
    return { error: (e as Error).message };
  }

  const { error: dbErr } = await admin
    .from('iso_portfolio_items')
    .update(patch)
    .eq('id', id);
  if (dbErr) return { error: dbErr.message };

  revalidatePath('/admin/portfolio');
  revalidatePath('/');
  redirect('/admin/portfolio');
}

export async function deletePortfolio(formData: FormData): Promise<ActionResult> {
  const err = await guard();
  if (err) return { error: err };
  const id = String(formData.get('id') || '');
  if (!id) return { error: 'id 필요' };

  const admin = createAdminClient();
  const { error: dbErr } = await admin
    .from('iso_portfolio_items')
    .delete()
    .eq('id', id);
  if (dbErr) return { error: dbErr.message };

  revalidatePath('/admin/portfolio');
  revalidatePath('/');
  return { ok: true };
}
