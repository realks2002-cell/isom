import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/landing/TopBar';
import { Footer } from '@/components/landing/Footer';

export async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <TopBar isAuthed={!!user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
