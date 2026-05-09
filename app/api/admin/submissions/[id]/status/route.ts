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
  const { status } = await req.json();

  const validStatuses = [
    "received",
    "ai_analyzed",
    "reviewing",
    "estimate_sent",
    "contracted",
    "working",
    "revision",
    "completed",
    "hold",
    "cancelled",
  ];

  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "유효하지 않은 상태 값입니다." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("book_submissions")
    .update({ status })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "상태 변경에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
