export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(price);
}

export const ALLOWED_ORIGINAL_TYPES = [
  ".doc",
  ".docx",
  ".hwp",
  ".hwpx",
];

export const ALLOWED_PDF_TYPES = [".pdf"];

export const ALLOWED_IMAGE_TYPES = [".jpg", ".jpeg", ".png", ".webp"];

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_TOTAL_SIZE = 300 * 1024 * 1024; // 300MB

export function validateFileType(file: File, allowedExtensions: string[]): boolean {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  return allowedExtensions.includes(ext);
}

export function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}
