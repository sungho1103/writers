export type SubmissionStatus =
  | "received"
  | "ai_analyzed"
  | "reviewing"
  | "estimate_sent"
  | "contracted"
  | "working"
  | "revision"
  | "completed"
  | "hold"
  | "cancelled";

export type FileType = "original" | "pdf" | "reference";

export type RequestType =
  | "publishing"
  | "editing"
  | "proofreading"
  | "cover_design"
  | "ebook";

export interface BookSubmission {
  id: string;
  title: string;
  author_name: string;
  email: string;
  phone: string;
  request_types: RequestType[];
  description: string;
  requirements: string | null;
  status: SubmissionStatus;
  estimated_price: number | null;
  admin_memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookSubmissionFile {
  id: string;
  submission_id: string;
  file_type: FileType;
  file_name: string;
  file_size: number;
  mime_type: string;
  firebase_path: string;
  download_url: string;
  created_at: string;
}

export interface BookAiAnalysis {
  id: string;
  submission_id: string;
  summary: string;
  structure_analysis: string;
  correction_points: string;
  style_analysis: string;
  workload_estimate: string;
  direction_suggestion: string;
  risk_notes: string;
  created_at: string;
}

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  received: "접수됨",
  ai_analyzed: "AI 분석 완료",
  reviewing: "검토 중",
  estimate_sent: "견적 발송",
  contracted: "계약 완료",
  working: "작업 중",
  revision: "수정 중",
  completed: "완료",
  hold: "보류",
  cancelled: "취소",
};

export const STATUS_COLORS: Record<SubmissionStatus, string> = {
  received: "bg-blue-100 text-blue-800",
  ai_analyzed: "bg-purple-100 text-purple-800",
  reviewing: "bg-yellow-100 text-yellow-800",
  estimate_sent: "bg-orange-100 text-orange-800",
  contracted: "bg-green-100 text-green-800",
  working: "bg-teal-100 text-teal-800",
  revision: "bg-pink-100 text-pink-800",
  completed: "bg-gray-100 text-gray-800",
  hold: "bg-red-100 text-red-700",
  cancelled: "bg-red-200 text-red-900",
};

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  publishing: "출판",
  editing: "본문편집",
  proofreading: "교정교열",
  cover_design: "커버디자인",
  ebook: "전자책 제작",
};
