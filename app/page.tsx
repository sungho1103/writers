import SubmissionForm from "@/components/SubmissionForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#faf8f4]">
      {/* Header */}
      <header className="border-b border-[#e0d9d0] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#2c2c2c] tracking-tight">
              글마루 편집출판
            </h1>
            <p className="text-xs text-[#8a8a8a] mt-0.5">원고 편집 · 출판 의뢰 전문</p>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-[#5a5a5a]">
            <a href="#services" className="hover:text-[#7c5c3a] transition-colors">
              서비스 소개
            </a>
            <a href="#process" className="hover:text-[#7c5c3a] transition-colors">
              진행 과정
            </a>
            <a href="#form" className="hover:text-[#7c5c3a] transition-colors">
              원고 투고
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#f5f0e8] to-[#faf8f4] py-16 sm:py-24 text-center px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium text-[#7c5c3a] tracking-widest uppercase mb-4">
            Book Publishing Studio
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#2c2c2c] leading-snug mb-5">
            당신의 원고를 책으로
            <br />
            완성시켜 드립니다
          </h2>
          <p className="text-base sm:text-lg text-[#5a5a5a] leading-relaxed mb-8">
            편집, 교정교열, 커버디자인, 전자책 제작까지.
            <br className="hidden sm:block" />
            전문 편집팀이 원고의 처음부터 끝까지 함께합니다.
          </p>
          <a
            href="#form"
            className="inline-block bg-[#7c5c3a] hover:bg-[#6a4e30] text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors shadow-sm"
          >
            지금 원고 투고하기
          </a>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-center text-2xl font-bold text-[#2c2c2c] mb-10">제공 서비스</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { icon: "📖", title: "출판", desc: "기획부터 유통까지 전 과정 지원" },
              { icon: "✏️", title: "본문편집", desc: "가독성 높은 편집과 조판" },
              { icon: "🔍", title: "교정교열", desc: "오탈자·어법·문맥 교정" },
              { icon: "🎨", title: "커버디자인", desc: "전문 디자이너의 표지 제작" },
              { icon: "💻", title: "전자책 제작", desc: "ePub·PDF 전자책 변환" },
            ].map((s) => (
              <div
                key={s.title}
                className="bg-white border border-[#e0d9d0] rounded-xl p-5 text-center hover:border-[#c4a882] hover:shadow-sm transition-all"
              >
                <div className="text-3xl mb-3">{s.icon}</div>
                <h4 className="font-semibold text-[#2c2c2c] text-sm mb-1">{s.title}</h4>
                <p className="text-xs text-[#8a8a8a] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="py-14 px-6 bg-[#f5f0e8]">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-center text-2xl font-bold text-[#2c2c2c] mb-10">진행 과정</h3>
          <div className="space-y-4">
            {[
              { step: "01", title: "원고 접수", desc: "파일 업로드 및 의뢰 내용 제출" },
              { step: "02", title: "원고 검토", desc: "AI 분석 + 담당 편집자 검토" },
              { step: "03", title: "견적 안내", desc: "작업 내용과 비용 안내 (이메일)" },
              { step: "04", title: "계약 및 작업", desc: "계약 체결 후 편집 작업 시작" },
              { step: "05", title: "최종 납품", desc: "교정 완료 후 파일 전달" },
            ].map((p, i, arr) => (
              <div key={p.step} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-[#7c5c3a] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {p.step}
                  </div>
                  {i < arr.length - 1 && (
                    <div className="w-0.5 h-6 bg-[#c4a882] mt-1" />
                  )}
                </div>
                <div className="pt-2">
                  <p className="font-semibold text-[#2c2c2c] text-sm">{p.title}</p>
                  <p className="text-xs text-[#5a5a5a] mt-0.5">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section id="form" className="py-14 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-[#2c2c2c] mb-2">원고 투고</h3>
            <p className="text-sm text-[#8a8a8a]">
              아래 양식을 작성하고 원고를 업로드해주세요.
              <br />
              접수 후 담당자가 검토하여 연락드리겠습니다.
            </p>
          </div>
          <div className="bg-white border border-[#e0d9d0] rounded-2xl p-6 sm:p-8 shadow-sm">
            <SubmissionForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e0d9d0] bg-white py-8 px-6 text-center">
        <p className="text-sm font-semibold text-[#2c2c2c] mb-1">글마루 편집출판</p>
        <p className="text-xs text-[#8a8a8a]">
          © 2025 글마루 편집출판. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
