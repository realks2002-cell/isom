import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get('projectId');

  let query = supabase
    .from('iso_renders')
    .select('id, public_url, style, quality, created_at, share_token')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ renders: data ?? [] });
}
