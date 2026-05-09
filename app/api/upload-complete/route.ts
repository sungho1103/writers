import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      submission_id,
      file_type,
      file_name,
      file_size,
      mime_type,
      firebase_path,
      download_url,
    } = body;

    if (!submission_id || !file_type || !file_name || !firebase_path || !download_url) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
    }

    if (!["original", "pdf", "reference"].includes(file_type)) {
      return NextResponse.json({ error: "유효하지 않은 파일 유형입니다." }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase.from("book_submission_files").insert({
      submission_id,
      file_type,
      file_name,
      file_size: file_size ?? 0,
      mime_type: mime_type ?? "",
      firebase_path,
      download_url,
    });

    if (error) {
      console.error("File insert error:", error);
      return NextResponse.json({ error: "파일 정보 저장에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("Upload complete error:", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
