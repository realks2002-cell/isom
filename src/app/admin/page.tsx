import { redirect } from 'next/navigation';
import { isAdminAuthed } from '@/lib/admin-auth';
import { loginAction } from './login-action';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdminAuthed()) redirect('/admin/users');
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 p-4">
      <form
        action={loginAction}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-lg font-bold">관리자 로그인</h1>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-700">ID</label>
          <input
            name="username"
            required
            autoComplete="username"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-700">비밀번호</label>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            ID 또는 비밀번호가 올바르지 않습니다
          </p>
        )}
        <button
          type="submit"
          className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
        >
          로그인
        </button>
      </form>
    </main>
  );
}
