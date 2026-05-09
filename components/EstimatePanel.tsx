"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";

interface Props {
  submissionId: string;
  initialPrice: number | null;
}

export default function EstimatePanel({ submissionId, initialPrice }: Props) {
  const [price, setPrice] = useState(initialPrice?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}/estimate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimated_price: price ? Number(price.replace(/,/g, "")) : null,
        }),
      });
      if (!res.ok) throw new Error("저장 실패");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("견적 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const numPrice = price ? Number(price.replace(/,/g, "")) : null;

  return (
    <div className="bg-white border border-[#e0d9d0] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#e0d9d0] bg-[#f5f0e8]">
        <h3 className="font-semibold text-[#2c2c2c]">💰 예상 견적</h3>
      </div>
      <div className="p-6 space-y-3">
        {numPrice != null && !isNaN(numPrice) && (
          <p className="text-2xl font-bold text-[#7c5c3a]">{formatPrice(numPrice)}</p>
        )}
        <div className="flex gap-3">
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="금액 입력 (원)"
            min={0}
            className="flex-1 px-4 py-2.5 border border-[#e0d9d0] rounded-lg text-sm text-[#2c2c2c] placeholder-[#c0b8b0] focus:outline-none focus:border-[#7c5c3a] focus:ring-1 focus:ring-[#7c5c3a] transition"
          />
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm bg-[#7c5c3a] hover:bg-[#6a4e30] disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
          >
            {saving ? "저장..." : "저장"}
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {saved && <p className="text-xs text-green-600">저장되었습니다.</p>}
      </div>
    </div>
  );
}
