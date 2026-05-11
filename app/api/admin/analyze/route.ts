import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/auth";
import OpenAI from "openai";

function getOpenAI() {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function extractPdfText(downloadUrl: string): Promise<string> {
    try {
          const { extractText, getDocumentProxy } = await import("unpdf");
          const response = await fetch(downloadUrl);
          if (!response.ok) return "";
          const buffer = await response.arrayBuffer();
          const pdf = await getDocumentProxy(new Uint8Array(buffer));
          const { text } = await extractText(pdf, { mergePages: true });
          const cleaned = (text as string)
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 8000);
          return cleaned;
    } catch {
          return "";
    }
}

export async function POST(req: NextRequest) {
    if (!(await isAdminAuthenticated())) {
          return NextResponse.json({ error: "\uc778\uc99d\uc774 \ud544\uc694\ud569\ub2c8\ub2e4." }, { status: 401 });
    }

  try {
        const { submissionId } = await req.json();
        if (!submissionId) {
                return NextResponse.json({ error: "submissionId\uac00 \ud544\uc694\ud569\ub2c8\ub2e4." }, { status: 400 });
        }

      const supabase = createServiceClient();

      // Get submission info
      const { data: submission, error: subErr } = await supabase
          .from("book_submissions")
          .select("*")
          .eq("id", submissionId)
          .single();

      if (subErr || !submission) {
              return NextResponse.json({ error: "\uc811\uc218 \uc815\ubcf4\ub97c \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4." }, { status: 404 });
      }

      // Get files
      const { data: files } = await supabase
          .from("book_submission_files")
          .select("*")
          .eq("submission_id", submissionId);

      const fileList = (files ?? [])
          .map((f) => `- ${f.file_name} (${f.file_type}, ${Math.round(f.file_size / 1024)}KB)`)
          .join("\n");

      // Extract PDF text
      const pdfFiles = (files ?? []).filter(
              (f) => f.mime_type === "application/pdf" || f.file_name?.endsWith(".pdf")
            );

      let pdfTextSection = "";
        if (pdfFiles.length > 0 && pdfFiles[0].download_url) {
                const extracted = await extractPdfText(pdfFiles[0].download_url);
                if (extracted && extracted.length > 50) {
                          pdfTextSection = `\n\n## \uc6d0\uace0 \ubcf8\ubb38 (\uccab \ubc88\uc9f8 PDF \uc77c\ubd80 \ubc1c\uccd0)\n${extracted}`;
                }
        }

      const prompt = `\ub2f9\uc2e0\uc740 \uc804\ubb38 \ucd9c\ud310 \ud3b8\uc9d1\uc790\uc785\ub2c8\ub2e4. \ub2e4\uc74c \uc6d0\uace0 \uc811\uc218 \uc815\ubcf4\ub97c \ubd84\uc11d\ud558\uc5ec \uc0c1\uc138\ud55c \ud3b8\uc9d1 \uac80\ud1a0 \ubcf4\uace0\uc11c\ub97c \uc791\uc131\ud574\uc8fc\uc138\uc694.

      ## \uc811\uc218 \uc815\ubcf4
      - \uc81c\ubaa9: ${submission.title}
      - \uc800\uc790: ${submission.author_name}
      - \uc758\ub8a2 \uc720\ud615: ${(submission.request_types as string[]).join(", ")}
      - \uc6d0\uace0 \uc124\uba85: ${submission.description}
      - \uc694\uccad\uc0ac\ud56d: ${submission.requirements ?? "\uc5c6\uc74c"}

      ## \uc5c5\ub85c\ub4dc\ub41c \ud30c\uc77c
      ${fileList || "\ud30c\uc77c \uc5c6\uc74c"}${pdfTextSection}

      \uc704 \uc815\ubcf4\ub97c \ubc14\ud0d5\uc73c\ub85c \ub2e4\uc74c \ud56d\ubaa9\uc744 \uac01\uac01 \ubd84\uc11d\ud574\uc8fc\uc138\uc694. \uac01 \ud56d\ubaa9\uc740 \uad6c\uccb4\uc801\uc774\uace0 \uc2e4\uc6a9\uc801\uc73c\ub85c \uc791\uc131\ud574\uc8fc\uc138\uc694.

      1. \uc804\uccb4 \uc694\uc57d (summary): \uc6d0\uace0 \ub0b4\uc6a9\uacfc \uc758\ub8a2 \ubaa9\uc801\uc744 2-3\ubb38\uc7a5\uc73c\ub85c \uc694\uc57d
      2. \uad6c\uc870 \ubd84\uc11d (structure_analysis): \uc6d0\uace0 \uad6c\uc131, \ubd84\ub7c9, \uc7a5\ub974\uc801 \ud2b9\uc131 \ubd84\uc11d
      3. \uad50\uc815 \ud544\uc694 \uc0ac\ud56d (correction_points): \uc608\uc0c1\ub418\ub294 \uad50\uc815\uad50\uc5f4 \ud544\uc694 \ubd80\ubd84 (\ubb38\uccb4, \uc5b4\ubc95, \uc624\ud0c8\uc790 \ub4f1)
      4. \ubb38\uccb4 \ubd84\uc11d (style_analysis): \uae00\uc4f0\uae30 \uc2a4\ud0c0\uc77c, \ubb38\uc7a5 \uad6c\uc870, \ub3c5\uc790\uce35 \uc801\ud569\uc131
      5. \uc791\uc5c5\ub7c9 \uc0b0\uc815 (workload_estimate): \uc758\ub8a2 \uc720\ud615\ubcc4 \uc608\uc0c1 \uc791\uc5c5 \uc2dc\uac04\uacfc \ub09c\uc774\ub3c4
      6. \ud3b8\uc9d1 \ubc29\ud5a5 \uc81c\uc548 (direction_suggestion): \uc758\ub8a2 \uc720\ud615\uc5d0 \ub9de\ub294 \uad6c\uccb4\uc801\uc778 \ud3b8\uc9d1 \ubc29\ud5a5
      7. \ub9ac\uc2a4\ud06c \ubc0f \uc720\uc758\uc0ac\ud56d (risk_notes): \uc791\uc5c5 \uc9c4\ud589 \uc2dc \uc8fc\uc758\ud560 \uc0ac\ud56d\uc774\ub098 \uc7a0\uc7ac\uc801 \uc774\uc288

      JSON \ud615\uc2dd\uc73c\ub85c \uc751\ub2f5\ud574\uc8fc\uc138\uc694:
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
        if (!content) throw new Error("AI \uc751\ub2f5\uc774 \ube44\uc5b4 \uc788\uc2b5\ub2c8\ub2e4.");

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
              return NextResponse.json({ error: "\ubd84\uc11d \uacb0\uacfc \uc800\uc7a5\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4." }, { status: 500 });
      }

      // Update status to ai_analyzed
      await supabase
          .from("book_submissions")
          .update({ status: "ai_analyzed" })
          .eq("id", submissionId);

      return NextResponse.json({ ok: true, analysis });
  } catch (err) {
        console.error("Analyze error:", err);
        return NextResponse.json({ error: "AI \ubd84\uc11d \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4." }, { status: 500 });
  }
}
