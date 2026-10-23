import { NextRequest, NextResponse } from "next/server";
import { withAiDisclaimer } from "@/lib/ai";
import { jsonError } from "@/lib/api/errors";
import { requireStudentId } from "@/lib/auth/session";
import { submitQuiz } from "@/lib/interactive/rooms";

export async function POST(request: NextRequest) {
  try {
    const studentId = await requireStudentId();
    const body = await request.json();
    const roomId = String(body.room_id ?? "");
    const answers = (body.answers ?? {}) as Record<string, number>;

    if (!roomId) {
      return NextResponse.json({ error: "room_id 必填" }, { status: 400 });
    }

    const result = submitQuiz({
      room_id: roomId,
      student_id: studentId,
      answers,
    });
    if (!result) {
      return NextResponse.json({ error: "提交失败或场次无效" }, { status: 400 });
    }

    return NextResponse.json({
      data: {
        room_id: roomId,
        score: result.score,
        total: result.total,
        wrong: result.wrong,
        followup_prompt: withAiDisclaimer(result.followup),
      },
    });
  } catch (e) {
    return jsonError(e, "提交失败");
  }
}
