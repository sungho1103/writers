import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import {
  BookSubmission,
  BookSubmissionFile,
  BookAiAnalysis,
  SubmissionStatus,
  REQUEST_TYPE_LABELS,
  RequestType,
} from "@/types";
import StatusBadge from "@/components/StatusBadge";
import StatusSelector from "@/components/StatusSelector";
import AiAnalysisPanel from "@/components/AiAnalysisPanel";
import AdminMemoBox from "@/components/AdminMemoBox";
import EstimatePanel from "@/components/EstimatePanel";
import FileList from "@/components/FileList";
import { formatDate, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SubmissionDetailPage({ params }: PageProps) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) redirect("/admin/login");

  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: submission }, { data: files }, { data: analysis }] = await Promise.all([
    supabase.from("book_submissions").select("*").eq("id", id).single(),
    supabase
      .from("book_submission_files")
      .select("*")
      .eq("submission_id", id)
      .order("created_at"),
    supabase
      .from("book_ai_analysis")
      .select("*")
      .eq("submission_id", id)
      .maybeSingle(),
  ]);

  if (!submission) notFound();

  const s = submission as BookSubmission;
  const fileList: BookSubmissionFile[] = files ?? [];
  const aiAnalysis: BookAiAnalysis | null = analysis ?? null;

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      {/* Admin Header */}
      <header className="bg-[#2c2c2c] text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-gray-300 hover:text-white transition-colors text-sm">
              ← 목록
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-none">
              {s.title}
            </span>
          </div>
          <StatusBadge status={s.status as SubmissionStatus} size="sm" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Submission Info */}
            <div className="bg-white border border-[#e0d9d0] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e0d9d0] bg-[#f5f0e8]">
                <h2 className="font-semibold text-[#2c2c2c]">📄 접수 정보</h2>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-[#2c2c2c]">{s.title}</h3>
                  <p className="text-xs text-[#8a8a8a] mt-1">접수일: {formatDate(s.created_at)}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[#8a8a8a] text-xs mb-0.5">투고자</p>
                    <p className="font-medium text-[#2c2c2c]">{s.author_name}</p>
                  </div>
                  <div>
                    <p className="text-[#8a8a8a] text-xs mb-0.5">이메일</p>
                    <a href={`mailto:${s.email}`} className="font-medium text-[#7c5c3a] hover:underline">
                      {s.email}
                    </a>
                  </div>
                  <div>
                    <p className="text-[#8a8a8a] text-xs mb-0.5">연락처</p>
                    <a href={`tel:${s.phone}`} className="font-medium text-[#2c2c2c]">
                      {s.phone}
                    </a>
                  </div>
                  {s.estimated_price != null && (
                    <div>
                      <p className="text-[#8a8a8a] text-xs mb-0.5">예상 견적</p>
                      <p className="font-bold text-[#7c5c3a]">{formatPrice(s.estimated_price)}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[#8a8a8a] text-xs mb-1">의뢰 유형</p>
                  <div className="flex flex-wrap gap-2">
                    {(s.request_types as RequestType[]).map((t) => (
                      <span
                        key={t}
                        className="text-xs bg-[#f5f0e8] text-[#7c5c3a] border border-[#e8ddd0] px-3 py-1 rounded-full font-medium"
                      >
                        {REQUEST_TYPE_LABELS[t] ?? t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[#8a8a8a] text-xs mb-1">원고 설명</p>
                  <p className="text-sm text-[#2c2c2c] leading-relaxed whitespace-pre-wrap bg-[#faf8f4] rounded-lg p-4">
                    {s.description}
                  </p>
                </div>

                {s.requirements && (
                  <div>
                    <p className="text-[#8a8a8a] text-xs mb-1">추가 요청사항</p>
                    <p className="text-sm text-[#2c2c2c] leading-relaxed whitespace-pre-wrap bg-[#faf8f4] rounded-lg p-4">
                      {s.requirements}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Files */}
            <div className="bg-white border border-[#e0d9d0] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e0d9d0] bg-[#f5f0e8] flex items-center justify-between">
                <h3 className="font-semibold text-[#2c2c2c]">
                  📎 업로드 파일{" "}
                  <span className="text-[#8a8a8a] font-normal text-sm">({fileList.length}개)</span>
                </h3>
              </div>
              <FileList files={fileList} />
            </div>

            {/* AI Analysis */}
            <AiAnalysisPanel submissionId={id} analysis={aiAnalysis} />
          </div>

          {/* Right: Actions */}
          <div className="space-y-6">
            <StatusSelector
              submissionId={id}
              currentStatus={s.status as SubmissionStatus}
            />
            <EstimatePanel
              submissionId={id}
              initialPrice={s.estimated_price}
            />
            <AdminMemoBox submissionId={id} initialMemo={s.admin_memo} />
          </div>
        </div>
      </main>
    </div>
  );
}
