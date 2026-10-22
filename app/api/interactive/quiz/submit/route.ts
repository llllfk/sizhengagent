import { NextRequest, NextResponse } from "next/server";
import { submitQuiz } from "@/lib/mock/interactive";
import { withAiDisclaimer } from "@/lib/ai";

/** POST /api/interactive/quiz/submit */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const roomId = String(body.room_id ?? "");
    const studentId = String(body.student_id ?? "demo-student");
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
      mock: true,
    });
  } catch {
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
