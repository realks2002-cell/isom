import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/landing/TopBar';
import { Hero } from '@/components/landing/Hero';
import { PortfolioGrid } from '@/components/landing/PortfolioGrid';
import { LibraryBar } from '@/components/landing/LibraryBar';
import { Footer } from '@/components/landing/Footer';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <TopBar isAuthed={!!user} />
      <main className="flex-1">
        <Hero />
        <PortfolioGrid />
        <LibraryBar />
      </main>
      <Footer />
    </div>
  );
}
