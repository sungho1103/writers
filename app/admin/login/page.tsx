"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "로그인에 실패했습니다.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f4] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#2c2c2c]">글마루 편집출판</h1>
          <p className="text-sm text-[#8a8a8a] mt-1">관리자 페이지</p>
        </div>
        <div className="bg-white border border-[#e0d9d0] rounded-2xl p-8 shadow-sm">
          <h2 className="text-base font-semibold text-[#2c2c2c] mb-6 text-center">
            관리자 로그인
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4a4a4a] mb-1">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="관리자 비밀번호를 입력하세요"
                autoFocus
                className="w-full px-4 py-2.5 border border-[#e0d9d0] rounded-lg bg-white text-[#2c2c2c] placeholder-[#c0b8b0] focus:outline-none focus:border-[#7c5c3a] focus:ring-1 focus:ring-[#7c5c3a] transition"
              />
            </div>
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 bg-[#7c5c3a] hover:bg-[#6a4e30] disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
