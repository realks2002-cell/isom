import { PublicLayout } from '@/components/layout/PublicLayout';

export const metadata = { title: '개인정보처리방침 | 이소플랜 3D' };

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-10 text-sm text-neutral-800 leading-relaxed">
        <h1 className="text-xl font-bold">개인정보처리방침</h1>
        <p className="mt-2 text-xs text-neutral-500">최종 수정일: 2026-04-09</p>

        <h2 className="mt-6 font-semibold">1. 수집하는 개인정보 항목</h2>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>계정 정보: 이메일 주소, 비밀번호(해시)</li>
          <li>프로필 정보: 이름, 상호명, 주소(선택)</li>
          <li>서비스 이용 정보: 업로드한 DXF 파일, 프로젝트 데이터, 마감재 선택 내역, AI 렌더링 결과 이미지</li>
          <li>기기 정보: 카메라로 촬영한 현장 사진(사용자가 직접 선택한 경우에만)</li>
        </ul>

        <h2 className="mt-6 font-semibold">2. 수집 목적</h2>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>회원 식별 및 로그인 인증</li>
          <li>인테리어 마감재 시뮬레이션 서비스 제공</li>
          <li>AI 기반 포토리얼 렌더링 생성</li>
          <li>프로젝트 저장 및 사용자 간 구분</li>
        </ul>

        <h2 className="mt-6 font-semibold">3. 보관 및 파기</h2>
        <p className="mt-2">
          회원 탈퇴 시 모든 개인정보와 프로젝트 데이터는 즉시 영구 삭제됩니다. 앱 내 &ldquo;계정 삭제&rdquo;
          기능을 통해 직접 삭제할 수 있습니다.
        </p>

        <h2 className="mt-6 font-semibold">4. 제3자 제공 및 위탁</h2>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Supabase (데이터 저장 및 인증): 미국</li>
          <li>Google Gemini API (AI 렌더링): 업로드된 평면 이미지를 일시적으로 처리하며 저장하지 않음</li>
          <li>Vercel (앱 호스팅): 미국</li>
        </ul>

        <h2 className="mt-6 font-semibold">5. 이용자의 권리</h2>
        <p className="mt-2">
          이용자는 언제든지 본인의 개인정보를 열람, 수정, 삭제할 수 있으며, &ldquo;계정 삭제&rdquo;를
          통해 모든 데이터를 즉시 파기할 수 있습니다.
        </p>

        <h2 className="mt-6 font-semibold">6. 카메라 및 사진 접근</h2>
        <p className="mt-2">
          iOS 앱은 사용자가 명시적으로 촬영 버튼을 누를 때에만 카메라에 접근하며, 촬영된 사진은
          AI 렌더링 참고 이미지로만 사용됩니다. 사진 앨범은 렌더링 결과 저장 시에만 접근합니다.
        </p>

        <h2 className="mt-6 font-semibold">7. 문의</h2>
        <p className="mt-2">개인정보 관련 문의: realks22@gmail.com</p>
      </div>
    </PublicLayout>
  );
}
