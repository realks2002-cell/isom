import Link from 'next/link';

export function DashboardHeader({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-[22px] font-black tracking-tight text-neutral-900">
            ISOPLAN
          </span>
          <span className="text-[11px] font-semibold tracking-[0.2em] text-[#d43e76]">
            3D
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="hidden text-[12px] tracking-wider text-neutral-400 sm:inline">
            {email}
          </span>
          <Link
            href="/account/delete"
            className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 hover:text-red-500"
          >
            계정삭제
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hover:text-[#d43e76]"
            >
              로그아웃
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
