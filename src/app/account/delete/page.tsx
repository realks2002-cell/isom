import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AccountDeletePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/');

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-xl font-bold">계정 삭제</h1>
      <p className="mt-3 text-sm text-neutral-700">
        계정을 삭제하면 아래 데이터가 <b>영구적으로</b> 삭제되며 복구할 수 없습니다.
      </p>
      <ul className="mt-3 list-disc pl-5 text-sm text-neutral-700 space-y-1">
        <li>모든 프로젝트 및 폴더</li>
        <li>업로드한 DXF 파일과 썸네일</li>
        <li>AI 렌더링 결과 이미지</li>
        <li>프로필 정보 및 로그인 계정</li>
      </ul>

      <form
        action="/api/account/delete"
        method="post"
        className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4"
      >
        <p className="text-sm text-red-800">
          정말로 <b>{user.email}</b> 계정을 삭제하시겠습니까?
        </p>
        <div className="mt-4 flex gap-2 justify-end">
          <Link
            href="/dashboard"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
          >
            취소
          </Link>
          <button
            type="submit"
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            계정 영구 삭제
          </button>
        </div>
      </form>
    </main>
  );
}
