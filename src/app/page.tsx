import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from '@/components/auth/LoginForm';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">인테리어 마감재 시뮬레이터</h1>
          <p className="mt-2 text-sm text-neutral-600">
            ID와 비밀번호로 로그인하세요
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
