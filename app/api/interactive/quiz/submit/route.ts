import { NextRequest, NextResponse } from "next/server";
import { withAiDisclaimer } from "@/lib/ai";
import { jsonError } from "@/lib/api/errors";
import { requireStudentId } from "@/lib/auth/session";
import { submitQuiz } from "@/lib/interactive/rooms";
import { hasDb } from "@/lib/db";
import { applyQuizResult, DbUnavailableError } from "@/lib/repo";

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

    const wrongItems = result.wrong.map((id) => {
      const q = result.room.quiz_paper?.find((x) => x.id === id);
      return { id, stem: q?.stem ?? id };
    });

    let profileWrite: Awaited<ReturnType<typeof applyQuizResult>> | null =
      null;
    if (hasDb()) {
      try {
        profileWrite = await applyQuizResult({
          student_id: studentId,
          room_id: roomId,
          score: result.score,
          total: result.total,
          wrong: wrongItems,
        });
      } catch (e) {
        console.error("[quiz] profile writeback failed", e);
      }
    }

    const wrote =
      profileWrite && profileWrite.ok
        ? {
            weak_points: profileWrite.weak_points,
            cognition_level: profileWrite.cognition_level,
            new_tags: profileWrite.new_tags,
            issue_count: profileWrite.issues.length,
          }
        : null;

    const writebackHint =
      wrote && wrote.issue_count > 0
        ? `\n\n已回写学情：薄弱点「${wrote.new_tags.join("、")}」已入画像；问题清单 +${wrote.issue_count} 条（可在「我的学情」查看）。`
        : wrote
          ? `\n\n已回写学情：本题全对，认知等级现为 L${wrote.cognition_level}。`
          : "";

    return NextResponse.json({
      data: {
        room_id: roomId,
        score: result.score,
        total: result.total,
        wrong: result.wrong,
        followup_prompt: withAiDisclaimer(result.followup + writebackHint),
        profile_writeback: wrote,
      },
    });
  } catch (e) {
    if (e instanceof DbUnavailableError) {
      return jsonError(e, "提交失败");
    }
    return jsonError(e, "提交失败");
  }
}
