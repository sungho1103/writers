"use client";

import { useState } from "react";
import { SubmissionStatus, STATUS_LABELS } from "@/types";

interface Props {
  submissionId: string;
  currentStatus: SubmissionStatus;
}

const ALL_STATUSES: SubmissionStatus[] = [
  "received",
  "ai_analyzed",
  "reviewing",
  "estimate_sent",
  "contracted",
  "working",
  "revision",
  "completed",
  "hold",
  "cancelled",
];

export default function StatusSelector({ submissionId, currentStatus }: Props) {
  const [status, setStatus] = useState<SubmissionStatus>(currentStatus);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (newStatus: SubmissionStatus) => {
    setStatus(newStatus);
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("저장 실패");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("상태 변경에 실패했습니다.");
      setStatus(currentStatus);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-[#e0d9d0] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#e0d9d0] bg-[#f5f0e8]">
        <h3 className="font-semibold text-[#2c2c2c]">🔄 진행 상태</h3>
      </div>
      <div className="p-6">
        <select
          value={status}
          onChange={(e) => handleChange(e.target.value as SubmissionStatus)}
          disabled={saving}
          className="w-full px-4 py-2.5 border border-[#e0d9d0] rounded-lg text-sm text-[#2c2c2c] bg-white focus:outline-none focus:border-[#7c5c3a] focus:ring-1 focus:ring-[#7c5c3a] transition"
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        {saving && <p className="text-xs text-[#8a8a8a] mt-2">저장 중...</p>}
        {saved && <p className="text-xs text-green-600 mt-2">상태가 변경되었습니다.</p>}
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );
}
