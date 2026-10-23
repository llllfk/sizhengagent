import { NextRequest, NextResponse } from "next/server";
import { contentSafetyGate } from "@/lib/ai";
import { jsonError } from "@/lib/api/errors";
import { studentIdFromSession } from "@/lib/auth/session";
import { generateScript, generateStoryboard } from "@/lib/content/video";
import { getOrCreateVideo, saveVideoStep } from "@/lib/repo";

export async function GET() {
  try {
    const studentId = await studentIdFromSession();
    return NextResponse.json({
      data: await getOrCreateVideo(studentId),
    });
  } catch (e) {
    return jsonError(e, "读取工坊失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    const studentId = await studentIdFromSession();
    const body = await request.json();
    const action = String(body.action ?? "save");
    const theme = String(body.theme ?? "").trim();
    const valuePoint = String(body.value_point ?? "").trim();

    if (action === "gen_script") {
      if (!theme) {
        return NextResponse.json({ error: "theme 必填" }, { status: 400 });
      }
      const themeGate = contentSafetyGate(`${theme} ${valuePoint}`);
      if (!themeGate.ok) {
        return NextResponse.json(
          { error: themeGate.reason, safety: themeGate },
          { status: 422 },
        );
      }
      const script = generateScript(theme, valuePoint);
      const gated = contentSafetyGate(script);
      if (!gated.ok) {
        return NextResponse.json(
          { error: gated.reason, safety: gated },
          { status: 422 },
        );
      }
      const project = await saveVideoStep(studentId, {
        theme,
        value_point: valuePoint,
        script: gated.text,
        step: 2,
      });
      return NextResponse.json({ data: project });
    }

    if (action === "gen_storyboard") {
      const current = await getOrCreateVideo(studentId);
      const t = theme || current.theme;
      if (!t) {
        return NextResponse.json({ error: "请先完成脚本主题" }, { status: 400 });
      }
      const board = generateStoryboard(t, valuePoint || current.value_point);
      const gated = contentSafetyGate(board);
      if (!gated.ok) {
        return NextResponse.json(
          { error: gated.reason, safety: gated },
          { status: 422 },
        );
      }
      const project = await saveVideoStep(studentId, {
        theme: t,
        value_point: valuePoint || current.value_point,
        storyboard: gated.text,
        step: 3,
      });
      return NextResponse.json({ data: project });
    }

    if (action === "subtitle") {
      const note = String(body.subtitle_note ?? "已生成中文字幕轴");
      const project = await saveVideoStep(studentId, {
        subtitle_note: note,
        step: 4,
      });
      return NextResponse.json({ data: project });
    }

    const project = await saveVideoStep(studentId, {
      theme: theme || undefined,
      value_point: valuePoint || undefined,
      script: body.script != null ? String(body.script) : undefined,
      storyboard: body.storyboard != null ? String(body.storyboard) : undefined,
      subtitle_note:
        body.subtitle_note != null ? String(body.subtitle_note) : undefined,
      file_uri: body.file_uri != null ? String(body.file_uri) : undefined,
      step: body.step,
    });
    return NextResponse.json({ data: project });
  } catch (e) {
    return jsonError(e, "工坊操作失败");
  }
}
