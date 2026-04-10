import Link from 'next/link';
import { ArrowLeft, Folder } from 'lucide-react';

export function FolderBreadcrumb({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-neutral-600">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 rounded-md p-1.5 hover:bg-neutral-100"
        aria-label="대시보드로"
      >
        <ArrowLeft size={16} />
      </Link>
      <Link href="/dashboard" className="hover:text-neutral-900">
        내 프로젝트
      </Link>
      <span className="text-neutral-400">/</span>
      <div className="flex items-center gap-1.5 text-neutral-900 font-medium">
        <Folder size={14} className="text-neutral-500" />
        {name}
      </div>
    </div>
  );
}
