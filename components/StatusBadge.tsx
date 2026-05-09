import { SubmissionStatus, STATUS_LABELS, STATUS_COLORS } from "@/types";

interface Props {
  status: SubmissionStatus;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "md" }: Props) {
  const colorClass = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700";
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colorClass} ${sizeClass}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
