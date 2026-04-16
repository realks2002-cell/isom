import { Hero } from '@/components/landing/Hero';
import { PortfolioGrid } from '@/components/landing/PortfolioGrid';
import { LibraryBar } from '@/components/landing/LibraryBar';
import { PublicLayout } from '@/components/layout/PublicLayout';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  return (
    <PublicLayout>
      <Hero />
      <PortfolioGrid />
      <LibraryBar />
    </PublicLayout>
  );
}
