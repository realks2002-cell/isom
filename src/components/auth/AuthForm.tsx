'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Mode = 'login' | 'signup';
const ID_DOMAIN = '@isometrix.local';
const toEmail = (id: string) => `${id.trim().toLowerCase()}${ID_DOMAIN}`;

export function AuthForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const initialMode: Mode = sp.get('mode') === 'signup' ? 'signup' : 'login';

  const [mode, setMode] = useState<Mode>(initialMode);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

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
    if (mode === 'signup') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail)) {
        setError('이메일 형식이 올바르지 않습니다');
        return;
      }
      if (phone.replace(/\D/g, '').length < 9) {
        setError('전화번호를 입력해주세요');
        return;
      }
    }

    start(async () => {
      const supabase = createClient();
      if (mode === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, password, phone, recoveryEmail }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || '회원가입 실패');
          return;
        }
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: toEmail(userId),
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
    <div className="w-full max-w-sm">
      <div className="mb-6 flex border-b border-neutral-200">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError(null);
          }}
          className={`flex-1 pb-3 text-sm font-semibold ${
            mode === 'login'
              ? 'border-b-2 border-neutral-900 text-neutral-900'
              : 'text-neutral-400'
          }`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setError(null);
          }}
          className={`flex-1 pb-3 text-sm font-semibold ${
            mode === 'signup'
              ? 'border-b-2 border-neutral-900 text-neutral-900'
              : 'text-neutral-400'
          }`}
        >
          회원가입
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <Field label="ID">
          <input
            type="text"
            required
            autoComplete="username"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="영문/숫자 2자 이상"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </Field>
        <Field label="비밀번호">
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6자 이상"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </Field>

        {mode === 'signup' && (
          <>
            <Field label="전화번호">
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-1234-5678"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
              />
            </Field>
            <Field label="이메일 (비번 찾기용)">
              <input
                type="email"
                required
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
              />
            </Field>
          </>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-semibold text-white hover:bg-[#d43e76] disabled:opacity-50"
        >
          {pending ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>

        {mode === 'login' && (
          <div className="text-center">
            <Link
              href="/login/forgot"
              className="text-xs text-neutral-500 hover:text-[#d43e76]"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>
        )}
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-neutral-700">{label}</span>
      {children}
    </label>
  );
}
