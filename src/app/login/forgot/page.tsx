import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ForgotForm } from './ForgotForm';

export default function ForgotPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12">
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft size={14} /> 로그인으로
      </Link>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-black tracking-tight">비밀번호 찾기</h1>
        <p className="mt-2 text-xs text-neutral-500">
          가입 시 등록한 ID 와 이메일을 입력하면
          <br />
          임시 비밀번호를 이메일로 보내드립니다
        </p>
      </div>
      <ForgotForm />
    </main>
  );
}
