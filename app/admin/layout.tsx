import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "관리자 | 글마루 편집출판",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
