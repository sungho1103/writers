"use client";

import { useState } from "react";

interface Props {
  submissionId: string;
  initialMemo: string | null;
}

export default function AdminMemoBox({ submissionId, initialMemo }: Props) {
  const [memo, setMemo] = useState(initialMemo ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}/memo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_memo: memo || null }),
      });
      if (!res.ok) throw new Error("저장 실패");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("메모 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-[#e0d9d0] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#e0d9d0] bg-[#f5f0e8]">
        <h3 className="font-semibold text-[#2c2c2c]">📋 관리자 메모</h3>
      </div>
      <div className="p-6 space-y-3">
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={5}
          placeholder="내부 검토 내용, 연락 이력, 특이사항 등을 기록해주세요."
          className="w-full px-4 py-3 border border-[#e0d9d0] rounded-lg text-sm text-[#2c2c2c] placeholder-[#c0b8b0] focus:outline-none focus:border-[#7c5c3a] focus:ring-1 focus:ring-[#7c5c3a] transition resize-none"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex items-center justify-between">
          {saved && <p className="text-xs text-green-600">저장되었습니다.</p>}
          <div className="ml-auto">
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-2 text-sm bg-[#7c5c3a] hover:bg-[#6a4e30] disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
            >
              {saving ? "저장 중..." : "메모 저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
