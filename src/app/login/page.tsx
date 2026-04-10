import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AuthForm } from '@/components/auth/AuthForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft size={14} /> 홈으로
      </Link>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-black tracking-tight">ISOPLAN 3D</h1>
      </div>
      <Suspense>
        <AuthForm />
      </Suspense>
    </main>
  );
}
