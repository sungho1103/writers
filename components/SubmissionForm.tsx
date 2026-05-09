"use client";

import { useState } from "react";
import { RequestType } from "@/types";
import { uploadFileToStorage, getStoragePath } from "@/lib/firebase";
import { MAX_TOTAL_SIZE } from "@/lib/utils";
import RequestTypeSelector from "./RequestTypeSelector";
import FileUploader, { SelectedFile } from "./FileUploader";
import SubmissionComplete from "./SubmissionComplete";

interface FormData {
  authorName: string;
  email: string;
  phone: string;
  title: string;
  description: string;
  requestTypes: RequestType[];
  requirements: string;
  agreePrivacy: boolean;
}

const initialForm: FormData = {
  authorName: "",
  email: "",
  phone: "",
  title: "",
  description: "",
  requestTypes: [],
  requirements: "",
  agreePrivacy: false,
};

type Step = "form" | "uploading" | "complete";

interface UploadStatus {
  current: string;
  progress: number;
  total: number;
  done: number;
}

export default function SubmissionForm() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [originalFiles, setOriginalFiles] = useState<SelectedFile[]>([]);
  const [pdfFiles, setPdfFiles] = useState<SelectedFile[]>([]);
  const [referenceFiles, setReferenceFiles] = useState<SelectedFile[]>([]);
  const [step, setStep] = useState<Step>("form");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | "files", string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const set = (key: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.authorName.trim()) errs.authorName = "투고자 이름을 입력해주세요.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "올바른 이메일 주소를 입력해주세요.";
    if (!form.phone.trim()) errs.phone = "연락처를 입력해주세요.";
    if (!form.title.trim()) errs.title = "책 제목을 입력해주세요.";
    if (!form.description.trim()) errs.description = "원고 설명을 입력해주세요.";
    if (form.requestTypes.length === 0) errs.requestTypes = "의뢰 유형을 1개 이상 선택해주세요." as never;
    if (originalFiles.length === 0 && pdfFiles.length === 0)
      errs.files = "원본 파일 또는 PDF 파일 중 하나 이상을 업로드해주세요.";
    if (!form.agreePrivacy) errs.agreePrivacy = "개인정보 수집 및 이용에 동의해주세요.";

    const totalSize = [...originalFiles, ...pdfFiles, ...referenceFiles].reduce(
      (acc, f) => acc + f.file.size,
      0
    );
    if (totalSize > MAX_TOTAL_SIZE) errs.files = "전체 파일 크기가 300MB를 초과합니다.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStep("uploading");
    setServerError(null);

    try {
      // 1. Create submission in Supabase
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          author_name: form.authorName,
          email: form.email,
          phone: form.phone,
          request_types: form.requestTypes,
          description: form.description,
          requirements: form.requirements || null,
        }),
      });

      if (!res.ok) throw new Error("접수 정보 저장에 실패했습니다.");
      const { id: submissionId } = await res.json();

      // 2. Upload files to Firebase Storage
      const allFiles = [
        ...originalFiles.map((f) => ({ ...f, type: "original" as const })),
        ...pdfFiles.map((f) => ({ ...f, type: "pdf" as const })),
        ...referenceFiles.map((f) => ({ ...f, type: "reference" as const })),
      ];

      const total = allFiles.length;
      setUploadStatus({ current: "", progress: 0, total, done: 0 });

      for (let i = 0; i < allFiles.length; i++) {
        const { file, type } = allFiles[i];
        const path = getStoragePath(submissionId, type, file.name);

        setUploadStatus((prev) =>
          prev ? { ...prev, current: file.name, done: i } : null
        );

        const { downloadUrl, firebasePath } = await uploadFileToStorage(
          file,
          path,
          (progress) => {
            setUploadStatus((prev) =>
              prev ? { ...prev, progress } : null
            );
          }
        );

        // 3. Save file metadata to Supabase
        await fetch("/api/upload-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submission_id: submissionId,
            file_type: type,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            firebase_path: firebasePath,
            download_url: downloadUrl,
          }),
        });
      }

      setUploadStatus((prev) =>
        prev ? { ...prev, done: total, progress: 100 } : null
      );
      setStep("complete");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "오류가 발생했습니다. 다시 시도해주세요.");
      setStep("form");
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setOriginalFiles([]);
    setPdfFiles([]);
    setReferenceFiles([]);
    setStep("form");
    setErrors({});
    setServerError(null);
  };

  if (step === "complete") {
    return <SubmissionComplete authorName={form.authorName} email={form.email} onReset={handleReset} />;
  }

  if (step === "uploading") {
    return (
      <div className="text-center py-16 px-6">
        <div className="w-16 h-16 bg-[#f5f0e8] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#7c5c3a] animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-[#2c2c2c] mb-2">파일을 업로드하는 중입니다</h2>
        <p className="text-sm text-[#8a8a8a] mb-6">
          {uploadStatus?.current
            ? `업로드 중: ${uploadStatus.current}`
            : "잠시만 기다려 주세요..."}
        </p>
        {uploadStatus && (
          <div className="max-w-xs mx-auto">
            <div className="flex justify-between text-xs text-[#8a8a8a] mb-1">
              <span>
                {uploadStatus.done + 1}/{uploadStatus.total} 파일
              </span>
              <span>{uploadStatus.progress}%</span>
            </div>
            <div className="w-full bg-[#e0d9d0] rounded-full h-2">
              <div
                className="bg-[#7c5c3a] h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadStatus.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* Personal Info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#2c2c2c] border-b border-[#e0d9d0] pb-2">
          투고자 정보
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#4a4a4a] mb-1">
              투고자 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.authorName}
              onChange={set("authorName")}
              placeholder="홍길동"
              className="w-full px-4 py-2.5 border border-[#e0d9d0] rounded-lg bg-white text-[#2c2c2c] placeholder-[#c0b8b0] focus:outline-none focus:border-[#7c5c3a] focus:ring-1 focus:ring-[#7c5c3a] transition"
            />
            {errors.authorName && <p className="text-xs text-red-500 mt-1">{errors.authorName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a4a4a] mb-1">
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="example@email.com"
              className="w-full px-4 py-2.5 border border-[#e0d9d0] rounded-lg bg-white text-[#2c2c2c] placeholder-[#c0b8b0] focus:outline-none focus:border-[#7c5c3a] focus:ring-1 focus:ring-[#7c5c3a] transition"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-[#4a4a4a] mb-1">
              연락처 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              placeholder="010-0000-0000"
              className="w-full px-4 py-2.5 border border-[#e0d9d0] rounded-lg bg-white text-[#2c2c2c] placeholder-[#c0b8b0] focus:outline-none focus:border-[#7c5c3a] focus:ring-1 focus:ring-[#7c5c3a] transition"
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>
        </div>
      </section>

      {/* Book Info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#2c2c2c] border-b border-[#e0d9d0] pb-2">
          원고 정보
        </h2>
        <div>
          <label className="block text-sm font-medium text-[#4a4a4a] mb-1">
            책 제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={set("title")}
            placeholder="원고의 제목을 입력해주세요"
            className="w-full px-4 py-2.5 border border-[#e0d9d0] rounded-lg bg-white text-[#2c2c2c] placeholder-[#c0b8b0] focus:outline-none focus:border-[#7c5c3a] focus:ring-1 focus:ring-[#7c5c3a] transition"
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-[#4a4a4a] mb-1">
            원고 설명 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={set("description")}
            rows={4}
            placeholder="원고의 내용, 장르, 분량, 주요 독자층 등을 간략히 소개해주세요."
            className="w-full px-4 py-2.5 border border-[#e0d9d0] rounded-lg bg-white text-[#2c2c2c] placeholder-[#c0b8b0] focus:outline-none focus:border-[#7c5c3a] focus:ring-1 focus:ring-[#7c5c3a] transition resize-none"
          />
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
        </div>
      </section>

      {/* Request Types */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#2c2c2c] border-b border-[#e0d9d0] pb-2">
          의뢰 유형 <span className="text-red-500">*</span>
        </h2>
        <RequestTypeSelector
          selected={form.requestTypes}
          onChange={(types) => setForm((f) => ({ ...f, requestTypes: types }))}
        />
        {(errors as Record<string, string>).requestTypes && (
          <p className="text-xs text-red-500">{(errors as Record<string, string>).requestTypes}</p>
        )}
      </section>

      {/* File Uploads */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-[#2c2c2c] border-b border-[#e0d9d0] pb-2">
          파일 업로드
        </h2>
        {(errors as Record<string, string>).files && (
          <p className="text-xs text-red-500">{(errors as Record<string, string>).files}</p>
        )}
        <FileUploader
          label="원본 파일"
          hint="doc, docx, hwp, hwpx 형식을 지원합니다."
          fileType="original"
          multiple
          files={originalFiles}
          onChange={setOriginalFiles}
        />
        <FileUploader
          label="PDF 파일"
          hint="PDF 형식으로 변환된 파일을 함께 첨부해주시면 검토에 도움이 됩니다."
          fileType="pdf"
          multiple
          files={pdfFiles}
          onChange={setPdfFiles}
        />
        <FileUploader
          label="참고 이미지"
          hint="커버 디자인 참고 이미지, 일러스트 등을 첨부해주세요. (jpg, png, webp)"
          fileType="reference"
          multiple
          files={referenceFiles}
          onChange={setReferenceFiles}
        />
      </section>

      {/* Requirements */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#2c2c2c] border-b border-[#e0d9d0] pb-2">
          추가 요청사항
        </h2>
        <textarea
          value={form.requirements}
          onChange={set("requirements")}
          rows={3}
          placeholder="편집 스타일, 출판 일정, 기타 특이사항 등 추가로 전달하실 내용을 자유롭게 작성해주세요."
          className="w-full px-4 py-2.5 border border-[#e0d9d0] rounded-lg bg-white text-[#2c2c2c] placeholder-[#c0b8b0] focus:outline-none focus:border-[#7c5c3a] focus:ring-1 focus:ring-[#7c5c3a] transition resize-none"
        />
      </section>

      {/* Privacy */}
      <section>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.agreePrivacy}
            onChange={(e) => setForm((f) => ({ ...f, agreePrivacy: e.target.checked }))}
            className="mt-0.5 w-4 h-4 accent-[#7c5c3a]"
          />
          <span className="text-sm text-[#5a5a5a]">
            <span className="font-medium text-[#2c2c2c]">[필수]</span> 개인정보 수집 및 이용에 동의합니다.{" "}
            <span className="text-xs text-[#8a8a8a]">
              (수집 항목: 이름, 이메일, 연락처 / 목적: 원고 검토 및 출판 의뢰 처리 / 보관기간: 계약 종료 후 3년)
            </span>
          </span>
        </label>
        {errors.agreePrivacy && <p className="text-xs text-red-500 mt-1 ml-7">{errors.agreePrivacy}</p>}
      </section>

      {/* Submit */}
      <button
        type="submit"
        className="w-full py-4 bg-[#7c5c3a] hover:bg-[#6a4e30] text-white font-semibold rounded-xl text-base transition-colors shadow-sm"
      >
        원고 접수하기
      </button>
    </form>
  );
}
