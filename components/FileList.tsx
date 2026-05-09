import { BookSubmissionFile, FileType } from "@/types";
import { formatFileSize, formatDate } from "@/lib/utils";

interface Props {
  files: BookSubmissionFile[];
}

const FILE_TYPE_LABELS: Record<FileType, string> = {
  original: "원본 파일",
  pdf: "PDF",
  reference: "참고 이미지",
};

const FILE_TYPE_COLORS: Record<FileType, string> = {
  original: "bg-blue-50 text-blue-700 border-blue-100",
  pdf: "bg-red-50 text-red-700 border-red-100",
  reference: "bg-green-50 text-green-700 border-green-100",
};

export default function FileList({ files }: Props) {
  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-[#8a8a8a]">
        업로드된 파일이 없습니다.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[#f0ebe3]">
      {files.map((file) => (
        <li key={file.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#fdf9f4] transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`text-xs font-medium px-2 py-0.5 rounded border flex-shrink-0 ${FILE_TYPE_COLORS[file.file_type as FileType] ?? "bg-gray-50 text-gray-600"}`}>
              {FILE_TYPE_LABELS[file.file_type as FileType] ?? file.file_type}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-[#2c2c2c] font-medium truncate max-w-[250px]">
                {file.file_name}
              </p>
              <p className="text-xs text-[#8a8a8a]">
                {formatFileSize(file.file_size)} · {formatDate(file.created_at)}
              </p>
            </div>
          </div>
          <a
            href={file.download_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 flex-shrink-0 flex items-center gap-1 text-xs text-[#7c5c3a] hover:text-[#5a3e24] font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            다운로드
          </a>
        </li>
      ))}
    </ul>
  );
}
