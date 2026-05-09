"use client";

import { RequestType, REQUEST_TYPE_LABELS } from "@/types";

interface Props {
  selected: RequestType[];
  onChange: (types: RequestType[]) => void;
}

const REQUEST_TYPES: RequestType[] = [
  "publishing",
  "editing",
  "proofreading",
  "cover_design",
  "ebook",
];

const ICONS: Record<RequestType, string> = {
  publishing: "📖",
  editing: "✏️",
  proofreading: "🔍",
  cover_design: "🎨",
  ebook: "💻",
};

export default function RequestTypeSelector({ selected, onChange }: Props) {
  const toggle = (type: RequestType) => {
    if (selected.includes(type)) {
      onChange(selected.filter((t) => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {REQUEST_TYPES.map((type) => {
        const isSelected = selected.includes(type);
        return (
          <button
            key={type}
            type="button"
            onClick={() => toggle(type)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer ${
              isSelected
                ? "border-[#7c5c3a] bg-[#7c5c3a] text-white"
                : "border-[#e0d9d0] bg-white text-[#4a4a4a] hover:border-[#c4a882] hover:bg-[#fdf9f4]"
            }`}
          >
            <span>{ICONS[type]}</span>
            <span>{REQUEST_TYPE_LABELS[type]}</span>
          </button>
        );
      })}
    </div>
  );
}
