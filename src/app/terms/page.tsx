import { PublicLayout } from '@/components/layout/PublicLayout';

export const metadata = { title: '이용약관 | 이소플랜 3D' };

export default function TermsPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-10 text-sm text-neutral-800 leading-relaxed">
        <h1 className="text-xl font-bold">이용약관</h1>
        <p className="mt-2 text-xs text-neutral-500">최종 수정일: 2026-04-09</p>

        <h2 className="mt-6 font-semibold">1. 서비스 소개</h2>
        <p className="mt-2">
          이소플랜 3D(&ldquo;서비스&rdquo;)는 건축/인테리어 업체가 고객에게 마감재 시뮬레이션 결과를
          보여주기 위한 프레젠테이션 도구입니다. 정확한 치수 측정 도구가 아닙니다.
        </p>

        <h2 className="mt-6 font-semibold">2. 계정</h2>
        <p className="mt-2">
          이용자는 본인 명의로 계정을 생성하며, 계정 보안은 이용자 본인이 책임집니다.
        </p>

        <h2 className="mt-6 font-semibold">3. 저작권 및 콘텐츠</h2>
        <p className="mt-2">
          이용자가 업로드한 DXF 파일, 프로젝트 데이터, AI 렌더링 결과물의 저작권은 해당 이용자에게 있습니다.
          서비스 제공사는 서비스 운영 목적에 한해 데이터를 처리합니다.
        </p>

        <h2 className="mt-6 font-semibold">4. 금지 사항</h2>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>타인의 저작물을 무단으로 업로드하는 행위</li>
          <li>서비스를 리버스 엔지니어링, 자동화 스크립트로 남용하는 행위</li>
          <li>AI 렌더링을 통해 위법/유해 콘텐츠를 생성하는 행위</li>
        </ul>

        <h2 className="mt-6 font-semibold">5. 서비스의 변경 및 중단</h2>
        <p className="mt-2">
          서비스 제공사는 사전 공지 후 서비스 내용을 변경하거나 중단할 수 있습니다.
        </p>

        <h2 className="mt-6 font-semibold">6. 면책</h2>
        <p className="mt-2">
          본 서비스는 시각적 참고용으로 제공되며, 실제 시공 결과와 차이가 있을 수 있습니다.
          이로 인한 분쟁에 대해 서비스 제공사는 책임지지 않습니다.
        </p>

        <h2 className="mt-6 font-semibold">7. 문의</h2>
        <p className="mt-2">문의: realks22@gmail.com</p>
      </div>
    </PublicLayout>
  );
}
