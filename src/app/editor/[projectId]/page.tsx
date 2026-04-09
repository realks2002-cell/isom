import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DxfUploader } from '@/components/dxf/DxfUploader';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import type { FloorPlan } from '@/types/room';

export default async function EditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: project } = await supabase
    .from('iso_projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (!project) notFound();

  const floorPlan = project.rooms_data as FloorPlan;
  const hasRooms = floorPlan?.rooms?.length > 0;

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-neutral-200 bg-white h-14 px-4 flex items-center gap-3">
        <Link href="/dashboard" className="p-2 -ml-2 hover:bg-neutral-100 rounded-lg">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-medium text-sm">{project.name}</h1>
        {hasRooms && (
          <span className="ml-auto text-xs text-neutral-500">
            공간 {floorPlan.rooms.length}개 · 문 {floorPlan.doors.length} · 창 {floorPlan.windows.length}
          </span>
        )}
      </header>

      {!hasRooms ? (
        <DxfUploader projectId={projectId} />
      ) : (
        <EditorCanvas
          floorPlan={floorPlan}
          projectId={projectId}
          projectName={project.name}
          initialCamera={project.camera_state}
        />
      )}
    </div>
  );
}
