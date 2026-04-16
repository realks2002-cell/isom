import Link from 'next/link';

export function TopBar({ isAuthed = false }: { isAuthed?: boolean }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-[22px] font-black tracking-tight text-neutral-900">
            ISOPLAN
          </span>
          <span className="text-[11px] font-semibold tracking-[0.2em] text-[#d43e76]">
            3D JOURNAL
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#featured" className="text-[13px] font-semibold uppercase tracking-wider text-neutral-700 hover:text-[#d43e76]">
            Featured
          </a>
          <a href="#showcases" className="text-[13px] font-semibold uppercase tracking-wider text-neutral-700 hover:text-[#d43e76]">
            Showcases
          </a>
          <a href="#engine" className="text-[13px] font-semibold uppercase tracking-wider text-neutral-700 hover:text-[#d43e76]">
            Engine
          </a>
          <a href="/pricing" className="text-[13px] font-semibold uppercase tracking-wider text-neutral-700 hover:text-[#d43e76]">
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {isAuthed && (
            <Link
              href="/dashboard"
              className="text-[13px] font-semibold text-neutral-700 hover:text-[#d43e76]"
            >
              Dashboard
            </Link>
          )}
          <a
            href="/login"
            className="text-[13px] font-semibold text-neutral-700 hover:text-[#d43e76]"
          >
            로그인
          </a>
          <a
            href="/login?mode=signup"
            className="bg-neutral-900 px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-white hover:bg-[#d43e76]"
          >
            회원가입
          </a>
        </div>
      </div>
    </header>
  );
}
