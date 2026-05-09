import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "글마루 편집출판 | 원고 투고 및 출판 의뢰",
  description:
    "원고 업로드부터 편집, 교정교열, 커버디자인, 전자책 제작까지. 전문 편집팀이 함께합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
