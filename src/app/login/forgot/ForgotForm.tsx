'use client';

import { useState, useTransition } from 'react';

export function ForgotForm() {
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, recoveryEmail: email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || '요청 실패');
        return;
      }
      setSent(true);
    });
  };

  if (sent) {
    return (
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold text-neutral-900">
          요청이 접수되었습니다
        </p>
        <p className="mt-2 text-xs leading-relaxed text-neutral-500">
          입력하신 정보가 등록된 계정과 일치하면
          <br />
          임시 비밀번호가 이메일로 발송됩니다.
          <br />
          (현재는 개발 모드 — 서버 콘솔에 출력됩니다)
        </p>
        <a
          href="/login"
          className="mt-5 inline-block rounded-lg bg-neutral-900 px-5 py-2 text-xs font-semibold text-white hover:bg-[#d43e76]"
        >
          로그인으로
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-neutral-700">ID</span>
        <input
          required
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-neutral-700">
          가입 시 이메일
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
        />
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-semibold text-white hover:bg-[#d43e76] disabled:opacity-50"
      >
        {pending ? '처리 중...' : '임시 비밀번호 받기'}
      </button>
    </form>
  );
}
