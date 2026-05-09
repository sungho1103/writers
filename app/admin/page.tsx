import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { BookSubmission, SubmissionStatus, STATUS_LABELS } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import AdminLogoutButton from "@/components/AdminLogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) redirect("/admin/login");

  const supabase = createServiceClient();
  const { data: submissions } = await supabase
    .from("book_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  const list: BookSubmission[] = submissions ?? [];

  const statusCounts = list.reduce(
    (acc, s) => {
      acc[s.status as SubmissionStatus] = (acc[s.status as SubmissionStatus] ?? 0) + 1;
      return acc;
    },
    {} as Record<SubmissionStatus, number>
  );

  const statCards: { label: string; status: SubmissionStatus; count: number }[] = [
    { label: "접수됨", status: "received", count: statusCounts.received ?? 0 },
    { label: "AI 분석 완료", status: "ai_analyzed", count: statusCounts.ai_analyzed ?? 0 },
    { label: "검토 중", status: "reviewing", count: statusCounts.reviewing ?? 0 },
    { label: "작업 중", status: "working", count: statusCounts.working ?? 0 },
    { label: "완료", status: "completed", count: statusCounts.completed ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      {/* Admin Header */}
      <header className="bg-[#2c2c2c] text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">글마루 편집출판 · 관리자</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-300 hover:text-white transition-colors" target="_blank">
              사이트 보기 ↗
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {statCards.map((card) => (
            <div key={card.status} className="bg-white border border-[#e0d9d0] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#2c2c2c]">{card.count}</p>
              <StatusBadge status={card.status} size="sm" />
            </div>
          ))}
        </div>

        {/* Submissions Table */}
        <div className="bg-white border border-[#e0d9d0] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e0d9d0] flex items-center justify-between">
            <h2 className="font-semibold text-[#2c2c2c]">
              투고 목록 <span className="text-[#8a8a8a] font-normal text-sm">({list.length}건)</span>
            </h2>
          </div>

          {list.length === 0 ? (
            <div className="py-16 text-center text-[#8a8a8a] text-sm">
              접수된 원고가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f5f0e8] text-[#5a5a5a]">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium">책 제목</th>
                    <th className="text-left px-4 py-3 font-medium">투고자</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">의뢰 유형</th>
                    <th className="text-left px-4 py-3 font-medium">상태</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">접수일</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ebe3]">
                  {list.map((s) => (
                    <tr key={s.id} className="hover:bg-[#fdf9f4] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#2c2c2c] truncate max-w-[200px]">{s.title}</p>
                      </td>
                      <td className="px-4 py-4 text-[#4a4a4a]">{s.author_name}</td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(s.request_types as string[]).map((t) => (
                            <span key={t} className="text-xs bg-[#f5f0e8] text-[#7c5c3a] px-2 py-0.5 rounded-full">
                              {t === "publishing" ? "출판" :
                               t === "editing" ? "편집" :
                               t === "proofreading" ? "교정" :
                               t === "cover_design" ? "커버" :
                               t === "ebook" ? "전자책" : t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={s.status as SubmissionStatus} size="sm" />
                      </td>
                      <td className="px-4 py-4 text-[#8a8a8a] hidden md:table-cell">
                        {formatDate(s.created_at)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/admin/submissions/${s.id}`}
                          className="text-[#7c5c3a] hover:text-[#5a3e24] font-medium text-xs"
                        >
                          상세 보기 →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
