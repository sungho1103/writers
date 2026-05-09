import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const { admin_memo } = await req.json();

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("book_submissions")
    .update({ admin_memo: admin_memo ?? null })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "메모 저장에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
