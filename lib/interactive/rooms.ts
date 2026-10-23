/**
 * 课中五式：进程内实时房间（API 层需先校验数据库可用）。
 * 学员主数据在 PostgreSQL；房间状态为课堂会话内存。
 */
export {
  collectScriptLine,
  endRoom,
  generateScript,
  getActiveRoom,
  getRoom,
  listRooms,
  startRoom,
  submitCabinPerf,
  submitDebateSpeech,
  submitQuiz,
  type DebateSide,
  type InteractiveMode,
  type InteractiveRoom,
} from "@/lib/interactive/state";
