"use client";

import { useState } from "react";
import { BookAiAnalysis } from "@/types";

interface Props {
  submissionId: string;
  analysis: BookAiAnalysis | null;
}

interface AnalysisItem {
  key: keyof Omit<BookAiAnalysis, "id" | "submission_id" | "created_at">;
  label: string;
  icon: string;
}

const ANALYSIS_ITEMS: AnalysisItem[] = [
  { key: "summary", label: "전체 요약", icon: "📝" },
  { key: "structure_analysis", label: "구조 분석", icon: "🏗️" },
  { key: "correction_points", label: "교정 필요 사항", icon: "🔍" },
  { key: "style_analysis", label: "문체 분석", icon: "✍️" },
  { key: "workload_estimate", label: "작업량 산정", icon: "⏱️" },
  { key: "direction_suggestion", label: "편집 방향 제안", icon: "🧭" },
  { key: "risk_notes", label: "리스크 및 유의사항", icon: "⚠️" },
];

export default function AiAnalysisPanel({ submissionId, analysis: initialAnalysis }: Props) {
  const [analysis, setAnalysis] = useState<BookAiAnalysis | null>(initialAnalysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "분석 실패");
      // Reload page to get fresh data
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[#e0d9d0] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#e0d9d0] flex items-center justify-between bg-[#f5f0e8]">
        <h3 className="font-semibold text-[#2c2c2c] flex items-center gap-2">
          🤖 AI 원고 분석
          {analysis && (
            <span className="text-xs text-[#8a8a8a] font-normal">
              ({new Date(analysis.created_at).toLocaleDateString("ko-KR")})
            </span>
          )}
        </h3>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            loading
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : analysis
              ? "bg-[#f5f0e8] border border-[#c4a882] text-[#7c5c3a] hover:bg-[#eee6d8]"
              : "bg-[#7c5c3a] text-white hover:bg-[#6a4e30]"
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              분석 중...
            </span>
          ) : analysis ? (
            "재분석"
          ) : (
            "AI 분석 실행"
          )}
        </button>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-100">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!analysis ? (
        <div className="px-6 py-12 text-center text-[#8a8a8a]">
          <div className="text-4xl mb-3">🤖</div>
          <p className="text-sm">AI 분석을 실행하면 원고 요약, 교정 사항, 편집 방향 등을 확인할 수 있습니다.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#f0ebe3]">
          {ANALYSIS_ITEMS.map(({ key, label, icon }) => (
            <div key={key} className="px-6 py-5">
              <h4 className="text-sm font-semibold text-[#2c2c2c] mb-2">
                {icon} {label}
              </h4>
              <p className="text-sm text-[#4a4a4a] leading-relaxed whitespace-pre-wrap">
                {analysis[key] || "—"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
