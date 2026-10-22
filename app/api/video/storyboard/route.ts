import { NextRequest, NextResponse } from "next/server";
import { contentSafetyGate } from "@/lib/ai";
import {
  generateScriptMock,
  generateStoryboardMock,
  getOrCreateVideo,
  saveVideoStep,
} from "@/lib/mock/tasks";

/** GET /api/video/storyboard?student_id= — 当前工坊进度 */
export async function GET(request: NextRequest) {
  const studentId =
    request.nextUrl.searchParams.get("student_id") ?? "demo-student";
  return NextResponse.json({
    data: getOrCreateVideo(studentId),
    mock: true,
  });
}

/** POST /api/video/storyboard — 推进工坊步骤 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const studentId = String(body.student_id ?? "demo-student");
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
      const script = generateScriptMock(theme, valuePoint);
      const gated = contentSafetyGate(script);
      if (!gated.ok) {
        return NextResponse.json(
          { error: gated.reason, safety: gated },
          { status: 422 },
        );
      }
      const project = saveVideoStep(studentId, {
        theme,
        value_point: valuePoint,
        script: gated.text,
        step: 2,
      });
      return NextResponse.json({ data: project, mock: true });
    }

    if (action === "gen_storyboard") {
      const current = getOrCreateVideo(studentId);
      const t = theme || current.theme;
      if (!t) {
        return NextResponse.json({ error: "请先完成脚本主题" }, { status: 400 });
      }
      const board = generateStoryboardMock(t, valuePoint || current.value_point);
      const gated = contentSafetyGate(board);
      if (!gated.ok) {
        return NextResponse.json(
          { error: gated.reason, safety: gated },
          { status: 422 },
        );
      }
      const project = saveVideoStep(studentId, {
        theme: t,
        value_point: valuePoint || current.value_point,
        storyboard: gated.text,
        step: 3,
      });
      return NextResponse.json({ data: project, mock: true });
    }

    if (action === "subtitle") {
      const note = String(body.subtitle_note ?? "已生成中文字幕轴（Mock）");
      const project = saveVideoStep(studentId, {
        subtitle_note: note,
        step: 4,
      });
      return NextResponse.json({ data: project, mock: true });
    }

    const project = saveVideoStep(studentId, {
      theme: theme || undefined,
      value_point: valuePoint || undefined,
      script: body.script != null ? String(body.script) : undefined,
      storyboard: body.storyboard != null ? String(body.storyboard) : undefined,
      subtitle_note:
        body.subtitle_note != null ? String(body.subtitle_note) : undefined,
      file_uri: body.file_uri != null ? String(body.file_uri) : undefined,
      step: body.step,
    });
    return NextResponse.json({ data: project, mock: true });
  } catch {
    return NextResponse.json({ error: "工坊操作失败" }, { status: 500 });
  }
}
