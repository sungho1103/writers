"use client";

interface Props {
  authorName: string;
  email: string;
  onReset: () => void;
}

export default function SubmissionComplete({ authorName, email, onReset }: Props) {
  return (
    <div className="text-center py-16 px-6">
      <div className="w-20 h-20 bg-[#f5f0e8] rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-10 h-10 text-[#7c5c3a]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-[#2c2c2c] mb-3">
        원고 접수가 완료되었습니다
      </h2>
      <p className="text-[#5a5a5a] mb-2">
        <span className="font-medium">{authorName}</span> 님, 소중한 원고를 보내주셔서 감사합니다.
      </p>
      <p className="text-sm text-[#8a8a8a] mb-8">
        접수하신 내용을 검토 후 <span className="font-medium text-[#5a5a5a]">{email}</span>로 연락드리겠습니다.
        <br />
        보통 영업일 기준 2~3일 내로 답변을 드립니다.
      </p>
      <div className="bg-[#f5f0e8] rounded-xl p-6 max-w-md mx-auto mb-8 text-left">
        <h3 className="text-sm font-semibold text-[#7c5c3a] mb-3">접수 후 진행 안내</h3>
        <ol className="space-y-2 text-sm text-[#5a5a5a]">
          <li className="flex gap-2">
            <span className="font-bold text-[#7c5c3a]">1.</span>
            <span>원고 접수 확인 및 내부 검토</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-[#7c5c3a]">2.</span>
            <span>AI 기반 원고 분석 (오탈자, 문체, 작업량 등)</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-[#7c5c3a]">3.</span>
            <span>담당 편집자 배정 및 견적 안내</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-[#7c5c3a]">4.</span>
            <span>계약 체결 및 작업 시작</span>
          </li>
        </ol>
      </div>
      <button
        onClick={onReset}
        className="text-sm text-[#7c5c3a] hover:underline"
      >
        새 원고 투고하기
      </button>
    </div>
  );
}
