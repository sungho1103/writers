import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/auth";
import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { submissionId } = await request.json();

    const supabase = createServiceClient();

    const { data: submission, error: submError } = await supabase
      .from("book_submissions")
      .select("*")
      .eq("id", submissionId)
      .single();

    if (submError || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const { data: files, error: filesError } = await supabase
      .from("book_submission_files")
      .select("*")
      .eq("submission_id", submissionId);

    if (filesError) {
      console.error("Files error:", filesError);
    }

    const requestTypeLabels = {
      publishing: "\uCD9C\uD310",
      ebook: "\uC804\uC790\uCC45 \uC81C\uC791",
      editing: "\uBCF8\uBB38\uD3B8\uC9D1",
      proofreading: "\uAD50\uC815\uAD50\uC5F4",
      cover_design: "\uCEE4\uBC84\uB514\uC790\uC778",
    };

    const requestTypes = submission.request_types
      .map((t) => requestTypeLabels[t] || t)
      .join(", ");

    const fileList = (files || [])
      .map((f) => f.file_name + " (" + Math.round(f.file_size / 1024) + "KB)")
      .join(", ");

    const prompt = "\uC804\uBB38 \uCD9C\uD310 \uD3B8\uC9D1\uC790\uB85C\uC11C \uB2E4\uC74C \uC6D0\uACE0\uB97C \uBD84\uC11D\uD558\uC5EC JSON \uD615\uC2DD\uC73C\uB85C \uC751\uB2F5\uD558\uC138\uC694.\n\n\uC81C\uBAA9: " + submission.title + "\n\uC758\uB8B0 \uC720\uD615: " + requestTypes + "\n\uC6D0\uACE0 \uC124\uBA85: " + (submission.description || "\uC5C6\uC74C") + "\n\uCD94\uAC00 \uC694\uCCAD\uC0AC\uD56D: " + (submission.requirements || "\uC5C6\uC74C") + "\n\uD30C\uC77C: " + fileList + "\n\n{\n  \"summary\": \"\uC804\uCCB4 \uC694\uC57D (3-5\uBB38\uC7A5)\",\n  \"structure\": \"\uAD6C\uC870 \uBD84\uC11D\",\n  \"corrections\": \"\uAD50\uC815 \uD544\uC694 \uC0AC\uD56D\",\n  \"style\": \"\uBB38\uCCB4 \uBD84\uC11D\",\n  \"workload\": {" + submission.request_types.map((t) => '\n    \"' + t + '\": \"\uC608\uC0C1 \uC2DC\uAC04\"').join(",") + "\n  },\n  \"editingDirection\": \"\uD3B8\uC9D1 \uBC29\uD5A5\",\n  \"risks\": \"\uB9AC\uC2A4\uD06C\"\n}\n\nJSON\uB9CC \uC751\uB2F5\uD558\uC138\uC694.";

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
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
      return NextResponse.json({ error: "\uBD84\uC11D \uACB0\uACFC \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." }, { status: 500 });
    }

    await supabase.from("book_submissions").update({ status: "ai_analyzed" }).eq("id", submissionId);

    return NextResponse.json({ ok: true, analysis: analysisResult });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "\uBD84\uC11D \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." }, { status: 500 });
  }
}
