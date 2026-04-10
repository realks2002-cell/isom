import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-300">
      <div className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <p className="text-[22px] font-black tracking-tight text-white">
              ISOPLAN <span className="text-[#d43e76]">3D</span>
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-neutral-400">
              DXF 한 장으로 시작하는 인테리어 시뮬레이션.
              <br />
              현장에서, 스마트폰으로, 실시간으로.
            </p>
            <form className="mt-6 flex max-w-sm">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 border border-neutral-700 bg-neutral-900 px-3 py-2 text-[13px] text-white placeholder:text-neutral-500 focus:border-[#d43e76] focus:outline-none"
              />
              <button
                type="submit"
                className="bg-[#d43e76] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-[#b93366]"
              >
                Subscribe
              </button>
            </form>
          </div>

          <FooterColumn
            title="Explore"
            links={[
              { label: 'Featured', href: '#featured' },
              { label: 'Showcases', href: '#showcases' },
              { label: 'Engine', href: '#engine' },
              { label: 'Pricing', href: '#pricing' },
            ]}
          />
          <FooterColumn
            title="Account"
            links={[
              { label: '로그인', href: '/login' },
              { label: '회원가입', href: '/login?mode=signup' },
              { label: 'Dashboard', href: '/dashboard' },
            ]}
          />
          <FooterColumn
            title="Legal"
            links={[
              { label: '이용약관', href: '/terms' },
              { label: '개인정보처리방침', href: '/privacy' },
              { label: 'Contact', href: 'mailto:hello@isoplan3d.com' },
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-neutral-800 pt-6 text-[11px] text-neutral-500 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} ISOPLAN 3D. All rights reserved.</p>
          <p className="uppercase tracking-wider">
            Built in Seoul · Powered by in-house rendering engine
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
        {title}
      </p>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-[13px] text-neutral-400 hover:text-[#d43e76]"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
