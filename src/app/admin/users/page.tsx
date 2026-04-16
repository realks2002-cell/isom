import { redirect } from 'next/navigation';
import { createAdminClient, fromEmail } from '@/lib/supabase/admin';
import { isAdminAuthed } from '@/lib/admin-auth';
import { UserTable, type AdminUserRow } from './UserTable';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  if (!(await isAdminAuthed())) redirect('/admin');

  // Service Role로 전체 유저 + 이메일 + 평문 비번 조회
  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from('iso_profiles')
    .select('id, name, company_name, address, admin_memo, role, created_at, purchased_renders')
    .order('created_at', { ascending: false });

  // 유저별 총 렌더링 사용 횟수 (TODO: 유저 수 많아지면 DB RPC로 집계)
  const { data: renderCounts } = await admin
    .from('iso_renders')
    .select('user_id');
  const renderMap = new Map<string, number>();
  for (const r of renderCounts ?? []) {
    renderMap.set(r.user_id, (renderMap.get(r.user_id) ?? 0) + 1);
  }

  const { data: creds } = await admin
    .from('iso_user_credentials')
    .select('user_id, plain_password');

  const { data: authUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });

  const emailMap = new Map(authUsers.users.map((u) => [u.id, u.email || '']));
  const credMap = new Map((creds ?? []).map((c) => [c.user_id, c.plain_password]));

  const now = Date.now();
  const rows: AdminUserRow[] = (profiles ?? []).map((p) => {
    const created = new Date(p.created_at).getTime();
    const days = Math.floor((now - created) / 86400000);
    const purchased = p.purchased_renders ?? 0;
    const used = renderMap.get(p.id) ?? 0;
    return {
      id: p.id,
      loginId: fromEmail(emailMap.get(p.id) || ''),
      password: credMap.get(p.id) || '',
      name: p.name || '',
      companyName: p.company_name || '',
      address: p.address || '',
      adminMemo: p.admin_memo || '',
      role: p.role || 'user',
      createdAt: p.created_at,
      daysSince: days,
      renderPurchased: purchased,
      renderUsed: used,
      renderRemaining: purchased - used,
    };
  });

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">회원 관리</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500">총 {rows.length}명</span>
          <a
            href="/admin/portfolio"
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50"
          >
            포트폴리오
          </a>
          <a
            href="/admin/pricing"
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50"
          >
            요금제
          </a>
          <a
            href="/admin/logout"
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50"
          >
            로그아웃
          </a>
        </div>
      </div>
      <UserTable rows={rows} />
    </main>
  );
}
