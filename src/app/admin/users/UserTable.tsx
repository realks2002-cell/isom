'use client';

import { useState, useTransition } from 'react';
import { Eye, EyeOff, Pencil, Trash2, Plus, X } from 'lucide-react';
import { createUser, updateUser, deleteUser } from './actions';

export interface AdminUserRow {
  id: string;
  loginId: string;
  password: string;
  name: string;
  companyName: string;
  address: string;
  adminMemo: string;
  role: string;
  createdAt: string;
  daysSince: number;
}

export function UserTable({ rows }: { rows: AdminUserRow[] }) {
  const [showPw, setShowPw] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; row?: AdminUserRow } | null>(null);
  const [isPending, startTransition] = useTransition();

  const togglePw = (id: string) => setShowPw((s) => ({ ...s, [id]: !s[id] }));

  const handleDelete = (row: AdminUserRow) => {
    if (!confirm(`${row.loginId} 회원을 삭제하시겠습니까?\n관련 프로젝트도 모두 삭제됩니다.`)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set('userId', row.id);
      const result = await deleteUser(fd);
      if ('error' in result) alert(result.error);
    });
  };

  return (
    <>
      <div className="mb-3 flex justify-end">
        <button
          onClick={() => setModal({ mode: 'create' })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" /> 회원 추가
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-xs text-neutral-600">
            <tr>
              <th className="px-3 py-2 text-left font-medium">이름</th>
              <th className="px-3 py-2 text-left font-medium">ID</th>
              <th className="px-3 py-2 text-left font-medium">비밀번호</th>
              <th className="px-3 py-2 text-left font-medium">상호명</th>
              <th className="px-3 py-2 text-left font-medium">주소</th>
              <th className="px-3 py-2 text-left font-medium">생성일</th>
              <th className="px-3 py-2 text-left font-medium">가입기간</th>
              <th className="px-3 py-2 text-left font-medium">메모</th>
              <th className="px-3 py-2 text-right font-medium">액션</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-neutral-500">
                  회원이 없습니다
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-neutral-100">
                  <td className="px-3 py-2">
                    {r.name || '-'}
                    {r.role === 'admin' && (
                      <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                        admin
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono">{r.loginId}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono">
                        {showPw[r.id] ? r.password || '(없음)' : '••••••'}
                      </span>
                      <button
                        onClick={() => togglePw(r.id)}
                        className="text-neutral-400 hover:text-neutral-700"
                      >
                        {showPw[r.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2">{r.companyName || '-'}</td>
                  <td className="px-3 py-2 max-w-[200px] truncate">{r.address || '-'}</td>
                  <td className="px-3 py-2 text-xs text-neutral-600">
                    {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-3 py-2 text-xs">{r.daysSince}일</td>
                  <td className="px-3 py-2 max-w-[200px] truncate text-xs text-neutral-600">
                    {r.adminMemo || '-'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setModal({ mode: 'edit', row: r })}
                        className="rounded p-1.5 text-neutral-600 hover:bg-neutral-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        disabled={isPending}
                        className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <UserModal
          mode={modal.mode}
          row={modal.row}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

function UserModal({
  mode,
  row,
  onClose,
}: {
  mode: 'create' | 'edit';
  row?: AdminUserRow;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (mode === 'edit' && row) fd.set('userId', row.id);

    startTransition(async () => {
      const result =
        mode === 'create' ? await createUser(fd) : await updateUser(fd);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">
            {mode === 'create' ? '회원 추가' : '회원 수정'}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'create' && (
            <Field label="ID" name="loginId" placeholder="영문/숫자 2자 이상" required />
          )}
          {mode === 'edit' && row && (
            <div className="text-xs text-neutral-500">
              ID: <span className="font-mono">{row.loginId}</span>
            </div>
          )}
          <Field
            label={mode === 'edit' ? '비밀번호 (변경 시에만 입력)' : '비밀번호'}
            name="password"
            type="text"
            placeholder="6자 이상"
            required={mode === 'create'}
          />
          <Field label="이름" name="name" defaultValue={row?.name} />
          <Field label="상호명" name="companyName" defaultValue={row?.companyName} />
          <Field label="주소" name="address" defaultValue={row?.address} />
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">메모</label>
            <textarea
              name="adminMemo"
              defaultValue={row?.adminMemo}
              rows={3}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {isPending ? '처리 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  placeholder,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-neutral-700">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
      />
    </div>
  );
}
