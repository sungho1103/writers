import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/auth";
import OpenAI from "openai";
import pdfParse from "pdf-parse";

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

async function extractPdfText(supabase: ReturnType<typeof createServiceClient>, filePath: string): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from("book-submissions")
      .download(filePath);

    if (error || !data) {
      console.error("PDF download error:", error);
      return "";
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parsed = await pdfParse(buffer);
    return parsed.text || "";
  } catch (err) {
    console.error("PDF parse error:", err);
    return "";
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { submissionId } = await request.json();

    const supabase = createServiceClient();

    // Get submission details
    const { data: submission, error: submError } = await supabase
      .from("book_submissions")
      .select("*")
      .eq("id", submissionId)
      .single();

    if (submError || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Get files
    const { data: files, error: filesError } = await supabase
      .from("book_submission_files")
      .select("*")
      .eq("submission_id", submissionId);

    if (filesError) {
      console.error("Files error:", filesError);
    }

    // Extract text from PDF files
    let pdfTextContent = "";
    const pdfFiles = (files || []).filter((f: { file_type: string }) => f.file_type === "pdf");

    if (pdfFiles.length > 0) {
      const pdfTexts = await Promise.all(
        pdfFiles.map(async (f: { storage_path: string; original_name: string }) => {
          const text = await extractPdfText(supabase, f.storage_path);
          return text ? `[파일: ${f.original_name}]\n${text}` : "";
        })
      );
      pdfTextContent = pdfTexts.filter(Boolean).join("\n\n");

      // Limit to ~60000 chars to stay within token limits
      if (pdfTextContent.length > 60000) {
        pdfTextContent = pdfTextContent.substring(0, 60000) + "\n\n[원고가 길어 앞부분만 분석합니다]";
      }
    }

    // Build analysis prompt
    const requestTypeLabels: Record<string, string> = {
      publishing: "출판",
      ebook: "전자책 제작",
      editing: "본문편집 편집",
      proofreading: "교정교열",
      cover_design: "커버디자인",
    };

    const requestTypes = submission.request_types
      .map((t: string) => requestTypeLabels[t] || t)
      .join(", ");
    const fileList = (files || [])
      .map((f: { original_name: string; file_size: number }) => `${f.original_name} (${Math.round(f.file_size / 1024)}KB)`)
      .join(", ");

    const hasPdfContent = pdfTextContent.length > 0;

    const prompt = `당신은 전문 출판 편집자입니다. 아래 원고 정보${hasPdfContent ? "와 실제 원고 내용" : ""}를 분석하여 JSON 형식으로 출판 편집 분석 리포트를 작성해주세요.

## 원고 기본 정보
- 제목: ${submission.title}
- 의뢰 유형: ${requestTypes}
- 원고 설명: ${submission.manuscript_description || "없음"}
- 추가 요청사항: ${submission.additional_requests || "없음"}
- 업로드 파일: ${fileList}

${hasPdfContent ? `## 실제 원고 내용
${pdfTextContent}

위 실제 원고 내용을 바탕으로 구체적이고 정확한 분석을 해주세요.` : ""}

## 분석 항목 (JSON 형식으로 응답)
{
  "summary": "전체 요약 (3-5문장)",
  "structure": "원고 구조 분석${hasPdfContent ? " (실제 내용 기반)" : ""}",
  "corrections": "교정 필요 사항${hasPdfContent ? " (구체적인 문장/단어 예시 포함)" : ""}",
  "style": "문체 분석${hasPdfContent ? " (실제 문체 특징 기반)" : ""}",
  "workload": {
    ${submission.request_types.map((t: string) => `"${t}": "예상 시간 (근거 포함)"`).join(",\n    ")}
  },
  "editingDirection": "편집 방향 제안${hasPdfContent ? " (실제 내용 기반 구체적 제안)" : ""}",
  "risks": "리스크 및 유의사항"
}

JSON만 응답하세요. 다른 텍스트는 포함하지 마세요.`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content || "{}";

    let analysisResult;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      analysisResult = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
    } catch {
      analysisResult = { summary: responseText };
    }

    // Save analysis result
    const { error: upsertError } = await supabase
      .from("book_ai_analysis")
      .upsert(
        {
          submission_id: submissionId,
          summary: analysisResult.summary,
          structure_analysis: analysisResult.structure,
          corrections: analysisResult.corrections,
          style_analysis: analysisResult.style,
          workload_estimate: analysisResult.workload,
          editing_direction: analysisResult.editingDirection,
          risks: analysisResult.risks,
          analyzed_at: new Date().toISOString(),
        },
        { onConflict: "submission_id" }
      );

    if (upsertError) {
      console.error("Analysis upsert error:", upsertError);
      return NextResponse.json(
        { error: "분석 결과 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    // Update submission status
    await supabase
      .from("book_submissions")
      .update({ status: "ai_analyzed" })
      .eq("id", submissionId);

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      usedPdfContent: hasPdfContent,
      pdfTextLength: pdfTextContent.length,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
