'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Mode = 'login' | 'signup';

// ID를 내부 가상 이메일로 변환 (Supabase Auth는 email 필수)
const ID_DOMAIN = '@isometrix.local';
const toEmail = (id: string) => `${id.trim().toLowerCase()}${ID_DOMAIN}`;

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^[a-z0-9_-]{2,}$/i.test(userId.trim())) {
      setError('ID는 영문/숫자/_/- 조합 2자 이상이어야 합니다');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다');
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const email = toEmail(userId);

      if (mode === 'signup') {
        // Admin API 경유 (이메일 검증 우회)
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, password }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || '회원가입 실패');
          return;
        }
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(
          error.message === 'Invalid login credentials'
            ? 'ID 또는 비밀번호가 올바르지 않습니다'
            : error.message
        );
        return;
      }

      router.refresh();
      router.push('/dashboard');
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl bg-white p-6 shadow-sm border border-neutral-200"
    >
      <div>
        <label className="block text-sm font-semibold text-neutral-900 mb-1">ID</label>
        <input
          type="text"
          required
          autoComplete="username"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          placeholder="6자 이상"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-neutral-900 mb-1">비밀번호</label>
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          placeholder="6자 이상"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-neutral-900 text-white py-2.5 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
      >
        {isPending ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'login' ? 'signup' : 'login');
          setError(null);
        }}
        className="w-full text-xs text-neutral-600 hover:text-neutral-900"
      >
        {mode === 'login' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
      </button>
    </form>
  );
}
