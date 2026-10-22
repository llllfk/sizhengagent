import { NextRequest, NextResponse } from "next/server";
import { getActiveRoom, getRoom } from "@/lib/mock/interactive";

/** GET /api/interactive/quiz/paper?room_id= */
export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get("room_id");
  const room = roomId ? getRoom(roomId) : getActiveRoom();
  if (!room || room.mode !== "quiz" || !room.quiz_paper) {
    return NextResponse.json(
      { error: "当前没有进行中的闯关场次" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: {
      room_id: room.room_id,
      paper_id: `paper_${room.room_id}`,
      theme: room.theme,
      items: room.quiz_paper.map(({ id, stem, options, difficulty }) => ({
        id,
        stem,
        options,
        difficulty,
      })),
    },
    mock: true,
  });
}
