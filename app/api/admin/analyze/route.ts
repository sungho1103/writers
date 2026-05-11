import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/auth";
import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const { submissionId } = await req.json();
    if (!submissionId) {
      return NextResponse.json({ error: "submissionId가 필요합니다." }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Get submission info
    const { data: submission, error: subErr } = await supabase
      .from("book_submissions")
      .select("*")
      .eq("id", submissionId)
      .single();

    if (subErr || !submission) {
      return NextResponse.json({ error: "접수 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    // Get files
    const { data: files } = await supabase
      .from("book_submission_files")
      .select("*")
      .eq("submission_id", submissionId);

    const fileList = (files ?? [])
      .map((f) => `- ${f.file_name} (${f.file_type}, ${Math.round(f.file_size / 1024)}KB)`)
      .join("\n");

    const prompt = `당신은 전문 출판 편집자입니다. 다음 원고 접수 정보를 분석하여 상세한 편집 검토 보고서를 작성해주세요.

## 접수 정보
- 제목: ${submission.title}
- 저자: ${submission.author_name}
- 의뢰 유형: ${(submission.request_types as string[]).join(", ")}
- 원고 설명: ${submission.description}
- 요청사항: ${submission.requirements ?? "없음"}

## 업로드된 파일
${fileList || "파일 없음"}

위 정보를 바탕으로 다음 항목을 각각 분석해주세요. 각 항목은 구체적이고 실용적으로 작성해주세요.

1. 전체 요약 (summary): 원고 내용과 의뢰 목적을 2-3문장으로 요약
2. 구조 분석 (structure_analysis): 원고 구성, 분량, 장르적 특성 분석
3. 교정 필요 사항 (correction_points): 예상되는 교정교열 필요 부분 (문체, 어법, 오탈자 등)
4. 문체 분석 (style_analysis): 글쓰기 스타일, 문장 구조, 독자층 적합성
5. 작업량 산정 (workload_estimate): 의뢰 유형별 예상 작업 시간과 난이도
6. 편집 방향 제안 (direction_suggestion): 의뢰 유형에 맞는 구체적인 편집 방향
7. 리스크 및 유의사항 (risk_notes): 작업 진행 시 주의할 사항이나 잠재적 이슈

JSON 형식으로 응답해주세요:
{
  "summary": "...",
  "structure_analysis": "...",
  "correction_points": "...",
  "style_analysis": "...",
  "workload_estimate": "...",
  "direction_suggestion": "...",
  "risk_notes": "..."
}`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("AI 응답이 비어 있습니다.");

    const analysis = JSON.parse(content);

    // Upsert analysis
    const { error: upsertErr } = await supabase
      .from("book_ai_analysis")
      .upsert(
        {
          submission_id: submissionId,
          summary: analysis.summary ?? "",
          structure_analysis: analysis.structure_analysis ?? "",
          correction_points: analysis.correction_points ?? "",
          style_analysis: analysis.style_analysis ?? "",
          workload_estimate: analysis.workload_estimate ?? "",
          direction_suggestion: analysis.direction_suggestion ?? "",
          risk_notes: analysis.risk_notes ?? "",
        },
        { onConflict: "submission_id" }
      );

    if (upsertErr) {
      console.error("Analysis upsert error:", upsertErr);
      return NextResponse.json({ error: "분석 결과 저장에 실패했습니다." }, { status: 500 });
    }

    // Update status to ai_analyzed
    await supabase
      .from("book_submissions")
      .update({ status: "ai_analyzed" })
      .eq("id", submissionId);

    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json({ error: "AI 분석 중 오류가 발생했습니다." }, { status: 500 });
  }
}
