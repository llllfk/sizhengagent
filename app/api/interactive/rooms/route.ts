import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireTeacher, requireUser } from "@/lib/auth/session";
import {
  getActiveRoom,
  listRooms,
  startRoom,
  type InteractiveMode,
} from "@/lib/interactive/rooms";
import { listCabinCases } from "@/lib/repo";

/** GET /api/interactive/rooms — 当前场次与列表 */
export async function GET() {
  try {
    await requireUser();
    return NextResponse.json({
      data: {
        active: getActiveRoom(),
        rooms: listRooms().slice(0, 10),
      },
    });
  } catch (e) {
    return jsonError(e, "读取场次失败");
  }
}

/** POST /api/interactive/rooms — 教师发起一场互动 */
export async function POST(request: NextRequest) {
  try {
    await requireTeacher();
    const body = await request.json();
    const mode = String(body.mode ?? "") as InteractiveMode;
    const allowed: InteractiveMode[] = [
      "cabin",
      "script",
      "wordcard",
      "quiz",
      "debate",
    ];
    if (!allowed.includes(mode)) {
      return NextResponse.json({ error: "无效的互动模式" }, { status: 400 });
    }

    let cabinCase:
      | {
          case_id: string;
          title: string;
          scenario: string;
          roles: string[];
          focus: string;
        }
      | undefined;

    if (mode === "cabin") {
      const cases = await listCabinCases();
      const wanted = body.case_id ? String(body.case_id) : "";
      const pick =
        (wanted && cases.find((c) => c.case_id === wanted)) ||
        (cases.length
          ? cases[Math.floor(Math.random() * cases.length)]
          : null);
      if (pick) {
        cabinCase = {
          case_id: pick.case_id,
          title: pick.title,
          scenario: pick.scenario,
          roles: pick.roles.length
            ? pick.roles
            : ["乘务员", "乘务长", "旅客", "观察员"],
          focus: pick.focus || "安全优先 · 程序处置 · 服务温度",
        };
      }
    }

    const room = startRoom(
      mode,
      body.theme ? String(body.theme) : undefined,
      cabinCase,
    );
    return NextResponse.json({ data: room }, { status: 201 });
  } catch (e) {
    return jsonError(e, "发起失败");
  }
}
