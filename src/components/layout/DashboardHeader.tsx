import Link from 'next/link';

export function DashboardHeader({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-sm">
          인테리어 시뮬레이터
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-600 hidden sm:inline">{email}</span>
          <Link
            href="/account/delete"
            className="text-xs text-neutral-500 hover:text-red-600"
          >
            계정삭제
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-xs text-neutral-600 hover:text-neutral-900"
            >
              로그아웃
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
