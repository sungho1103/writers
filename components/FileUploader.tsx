"use client";

import { useRef, useState } from "react";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_ORIGINAL_TYPES,
  ALLOWED_PDF_TYPES,
  MAX_FILE_SIZE,
  formatFileSize,
  validateFileSize,
  validateFileType,
} from "@/lib/utils";

export interface SelectedFile {
  file: File;
  preview?: string;
}

interface Props {
  label: string;
  hint?: string;
  fileType: "original" | "pdf" | "reference";
  multiple?: boolean;
  files: SelectedFile[];
  onChange: (files: SelectedFile[]) => void;
}

function getAllowedExtensions(fileType: "original" | "pdf" | "reference") {
  if (fileType === "original") return ALLOWED_ORIGINAL_TYPES;
  if (fileType === "pdf") return ALLOWED_PDF_TYPES;
  return ALLOWED_IMAGE_TYPES;
}

function getAcceptAttr(fileType: "original" | "pdf" | "reference") {
  if (fileType === "original") return ".doc,.docx,.hwp,.hwpx";
  if (fileType === "pdf") return ".pdf";
  return ".jpg,.jpeg,.png,.webp";
}

export default function FileUploader({
  label,
  hint,
  fileType,
  multiple = false,
  files,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const allowedExts = getAllowedExtensions(fileType);

  const processFiles = (newFiles: FileList | File[]) => {
    const fileArr = Array.from(newFiles);
    const errs: string[] = [];
    const valid: SelectedFile[] = [];

    for (const file of fileArr) {
      if (!validateFileType(file, allowedExts)) {
        errs.push(`${file.name}: 허용되지 않는 파일 형식입니다.`);
        continue;
      }
      if (!validateFileSize(file)) {
        errs.push(`${file.name}: 파일 크기가 100MB를 초과합니다.`);
        continue;
      }
      const item: SelectedFile = { file };
      if (fileType === "reference" && file.type.startsWith("image/")) {
        item.preview = URL.createObjectURL(file);
      }
      valid.push(item);
    }

    setErrors(errs);
    if (valid.length > 0) {
      onChange(multiple ? [...files, ...valid] : valid.slice(0, 1));
    }
  };

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#4a4a4a]">{label}</label>
      {hint && <p className="text-xs text-[#8a8a8a]">{hint}</p>}

      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-[#7c5c3a] bg-[#fdf6ee]"
            : "border-[#e0d9d0] bg-[#faf8f4] hover:border-[#c4a882]"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          processFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={getAcceptAttr(fileType)}
          multiple={multiple}
          className="hidden"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-2 text-[#8a8a8a]">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <span className="text-sm">
            클릭하거나 파일을 드래그하세요
          </span>
          <span className="text-xs">
            {allowedExts.join(", ")} · 최대 {formatFileSize(MAX_FILE_SIZE)}
          </span>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-xs text-red-600">
              {err}
            </p>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((item, i) => (
            <li
              key={i}
              className="flex items-center justify-between bg-white border border-[#e0d9d0] rounded-lg px-4 py-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.preview}
                    alt={item.file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 bg-[#f5f0e8] rounded flex items-center justify-center text-[#7c5c3a] text-xs font-bold">
                    {item.file.name.split(".").pop()?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm text-[#2c2c2c] truncate">{item.file.name}</p>
                  <p className="text-xs text-[#8a8a8a]">{formatFileSize(item.file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="ml-2 text-[#8a8a8a] hover:text-red-500 transition-colors flex-shrink-0"
                aria-label="파일 제거"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
