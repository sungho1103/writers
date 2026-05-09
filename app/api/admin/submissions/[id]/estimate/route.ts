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
  const { estimated_price } = await req.json();

  const price = estimated_price != null ? Number(estimated_price) : null;
  if (price !== null && isNaN(price)) {
    return NextResponse.json({ error: "유효하지 않은 금액입니다." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("book_submissions")
    .update({ estimated_price: price })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "견적 저장에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
