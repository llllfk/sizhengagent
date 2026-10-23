import {
  pickQuizPaper,
  pickWordcard,
  WORDCARD_BANK_SEED,
} from "@/lib/content/interactiveBank";

export type InteractiveMode =
  | "cabin"
  | "script"
  | "wordcard"
  | "quiz"
  | "debate";

export type RoomStatus = "idle" | "live" | "ended";

export type ScriptLine = {
  student_id: string;
  name: string;
  sentence: string;
  at: string;
};

export type QuizQuestion = {
  id: string;
  stem: string;
  options: string[];
  answer: number;
  difficulty: number;
};

export type CabinCase = {
  case_id: string;
  title: string;
  scenario: string;
  roles: string[];
  focus: string;
};

export type CabinPerf = {
  student_id: string;
  name: string;
  role: string;
  performance: string;
  feedback: string;
  plan: string;
  at: string;
};

export type DebateSide = "pro" | "con";

export type DebateSpeech = {
  student_id: string;
  name: string;
  side: DebateSide;
  content: string;
  at: string;
};

export type InteractiveRoom = {
  room_id: string;
  mode: InteractiveMode;
  title: string;
  status: RoomStatus;
  theme: string;
  created_at: string;
  script_lines: ScriptLine[];
  script_body?: string;
  quiz_paper?: QuizQuestion[];
  quiz_submits: Array<{
    student_id: string;
    score: number;
    wrong: string[];
    at: string;
  }>;
  wordcard?: { id: string; term: string; hint: string };
  cabin_case?: CabinCase;
  cabin_perfs: CabinPerf[];
  debate_background?: string;
  debate_tree?: { pro: string[]; con: string[] };
  debate_speeches: DebateSpeech[];
  participants: number;
};

const MODE_TITLE: Record<InteractiveMode, string> = {
  cabin: "客舱情景模拟",
  script: "一句话 AI 剧本创作",
  wordcard: "你来比划我来猜",
  quiz: "闯关答题",
  debate: "课堂辩论",
};

/** 客舱思政底仓题（与教材题库混抽） */
const CABIN_QUIZ_EXTRA: QuizQuestion[] = [
  {
    id: "q_cabin_1",
    stem: "客舱服务中，「人民至上」在现场决策里的第一含义是？",
    options: ["效率优先", "安全与生命优先", "满意度优先", "流程优先"],
    answer: 1,
    difficulty: 1,
  },
  {
    id: "q_cabin_2",
    stem: "旅客坚持超规行李登机，乘务员首先应守住的是？",
    options: ["人情面子", "飞行安全与规章", "个人偏好", "省事息事"],
    answer: 1,
    difficulty: 2,
  },
  {
    id: "q_cabin_3",
    stem: "颠簸中旅客拒绝回座，沟通话术较合适的是？",
    options: [
      "直接指责不配合",
      "先说明安全风险，再给出可执行动作",
      "假装没看见",
      "与旅客争论对错",
    ],
    answer: 1,
    difficulty: 2,
  },
];

const WORD_CARDS = [
  { id: "w1", term: "人民至上", hint: "客舱抉择的价值锚点" },
  { id: "w2", term: "服务边界", hint: "规则与人情的张力" },
  { id: "w3", term: "职业伦理", hint: "空乘现场的责任结构" },
  { id: "w4", term: "安全红线", hint: "隐患零容忍 · 生命线" },
  { id: "w5", term: "三个敬畏", hint: "敬畏生命 · 规章 · 职责" },
  { id: "w6", term: "工匠精神", hint: "每一次巡视都当第一次" },
  ...WORDCARD_BANK_SEED.map((w) => ({
    id: w.id,
    term: w.term,
    hint: w.hint,
  })),
];

function buildQuizPaper(): QuizQuestion[] {
  const fromBank = pickQuizPaper(4).map((q) => ({
    id: q.id,
    stem: q.stem,
    options: q.options,
    answer: q.answer,
    difficulty: q.difficulty,
  }));
  const cabin =
    CABIN_QUIZ_EXTRA[Math.floor(Math.random() * CABIN_QUIZ_EXTRA.length)];
  return [...fromBank, cabin];
}

const CABIN_CASES: CabinCase[] = [
  {
    case_id: "case_bag",
    title: "超规行李与登机冲突",
    scenario:
      "登机口旅客坚持携带超规随身行李，称「赶衔接航班、不能托运」。队伍后方旅客开始抱怨延误。你是值班乘务员。",
    roles: ["乘务员", "乘务长", "旅客", "观察员"],
    focus: "安全规章 vs 旅客情绪；如何给出可执行替代方案",
  },
  {
    case_id: "case_turbulence",
    title: "颠簸中拒不回座",
    scenario:
      "航路颠簸，客舱灯号要求回座系带。一位旅客站在过道拍照，拒绝听从。邻座旅客明显紧张。",
    roles: ["乘务员", "乘务长", "旅客", "邻座旅客"],
    focus: "安全指令优先级；沟通温度与底线",
  },
  {
    case_id: "case_dispute",
    title: "座位纠纷与秩序维护",
    scenario:
      "两名旅客因靠窗座位争执，一方出示改签记录，另一方称「先到先得」。起飞倒计时 12 分钟。",
    roles: ["乘务员", "乘务长", "旅客A", "旅客B"],
    focus: "秩序、公平感与准点压力的平衡",
  },
];

type InteractiveStore = {
  rooms: InteractiveRoom[];
  active_room_id: string | null;
};

const g = globalThis as unknown as { __qihangInteractive?: InteractiveStore };

function getStore(): InteractiveStore {
  if (!g.__qihangInteractive) {
    g.__qihangInteractive = { rooms: [], active_room_id: null };
  }
  return g.__qihangInteractive;
}

function recount(room: InteractiveRoom) {
  const ids = new Set<string>();
  room.script_lines.forEach((l) => ids.add(l.student_id));
  room.quiz_submits.forEach((s) => ids.add(s.student_id));
  room.cabin_perfs.forEach((p) => ids.add(p.student_id));
  room.debate_speeches.forEach((s) => ids.add(s.student_id));
  room.participants = ids.size;
}

export function listRooms() {
  return getStore().rooms;
}

export function getActiveRoom() {
  const store = getStore();
  if (!store.active_room_id) return null;
  return store.rooms.find((r) => r.room_id === store.active_room_id) ?? null;
}

export function getRoom(roomId: string) {
  return getStore().rooms.find((r) => r.room_id === roomId) ?? null;
}

export function startRoom(
  mode: InteractiveMode,
  theme?: string,
  cabinCase?: CabinCase,
): InteractiveRoom {
  const store = getStore();
  store.rooms.forEach((r) => {
    if (r.status === "live") r.status = "ended";
  });

  const cabin =
    mode === "cabin"
      ? cabinCase ||
        CABIN_CASES[Math.floor(Math.random() * CABIN_CASES.length)]
      : undefined;

  const debateTopic =
    theme ||
    (mode === "debate" ? "客舱服务该不该「适度通融」" : undefined);

  const room: InteractiveRoom = {
    room_id: `room_${Date.now()}`,
    mode,
    title: MODE_TITLE[mode],
    status: "live",
    theme:
      theme ||
      (mode === "script"
        ? "飞行颠簸中的旅客纠纷"
        : mode === "cabin"
          ? cabin!.title
          : mode === "debate"
            ? debateTopic!
            : "空乘思政闯关"),
    created_at: new Date().toISOString(),
    script_lines: [],
    quiz_submits: [],
    cabin_case: cabin,
    cabin_perfs: [],
    debate_speeches: [],
    participants: 0,
  };

  if (mode === "quiz") {
    room.quiz_paper = buildQuizPaper();
  }
  if (mode === "wordcard") {
    const fromSeed = Math.random() < 0.7 ? pickWordcard() : null;
    room.wordcard = fromSeed
      ? { id: fromSeed.id, term: fromSeed.term, hint: fromSeed.hint }
      : WORD_CARDS[Math.floor(Math.random() * WORD_CARDS.length)];
  }
  if (mode === "debate") {
    room.debate_background = [
      `【辩题】${room.theme}`,
      "【背景】高职空乘课堂专题辩论：在保障安全与规章的前提下，是否允许乘务员对旅客诉求做「适度通融」。",
      "【价值张力】人民至上（安全生命）· 服务温度 · 职业边界 · 公平秩序",
      "",
      "—— AI生成内容，供讨论参考",
    ].join("\n");
    room.debate_tree = {
      pro: [
        "通融可缓解情绪升级，服务有温度",
        "在不触碰安全红线时，灵活处理体现职业智慧",
        "个案差异需要现场裁量，避免机械执行",
      ],
      con: [
        "通融易被理解为破例，冲击公平与秩序",
        "安全与规章一旦松动，风险不可逆",
        "边界清晰才能保护乘务员与全体旅客",
      ],
    };
  }

  store.rooms.unshift(room);
  store.active_room_id = room.room_id;
  return room;
}

export function endRoom(roomId: string) {
  const room = getRoom(roomId);
  if (!room) return null;
  room.status = "ended";
  const store = getStore();
  if (store.active_room_id === roomId) store.active_room_id = null;
  return room;
}

export function collectScriptLine(input: {
  room_id: string;
  student_id: string;
  name: string;
  sentence: string;
}) {
  const room = getRoom(input.room_id);
  if (!room || room.mode !== "script" || room.status !== "live") return null;
  room.script_lines.push({
    student_id: input.student_id,
    name: input.name,
    sentence: input.sentence,
    at: new Date().toISOString(),
  });
  recount(room);
  return room;
}

export function generateScript(roomId: string) {
  const room = getRoom(roomId);
  if (!room || room.mode !== "script") return null;
  const lines = room.script_lines.map(
    (l, i) => `${i + 1}. ${l.name}：${l.sentence}`,
  );
  room.script_body = [
    `【主题】${room.theme}`,
    "【人物】乘务长 / 新乘务员 / 旅客代表",
    "【冲突】服务边界与旅客诉求碰撞",
    "【转折】以人民至上原则重估现场选择",
    "【结局】形成可执行客舱预案",
    "",
    "—— 接龙素材 ——",
    ...(lines.length ? lines : ["（尚无接龙，已生成结构框架）"]),
    "",
    "—— AI生成内容，供讨论参考",
  ].join("\n");
  return room;
}

export function submitQuiz(input: {
  room_id: string;
  student_id: string;
  answers: Record<string, number>;
}) {
  const room = getRoom(input.room_id);
  if (!room || room.mode !== "quiz" || !room.quiz_paper) return null;
  let score = 0;
  const wrong: string[] = [];
  for (const q of room.quiz_paper) {
    if (input.answers[q.id] === q.answer) score += 1;
    else wrong.push(q.id);
  }
  room.quiz_submits.push({
    student_id: input.student_id,
    score,
    wrong,
    at: new Date().toISOString(),
  });
  recount(room);
  return {
    room,
    score,
    total: room.quiz_paper.length,
    wrong,
    followup:
      wrong.length > 0
        ? "错题将回流答疑引擎：你怎么看这些选项背后的价值排序？依据是什么？"
        : "全部答对！可继续挑战更高难度题组。",
  };
}

export function submitCabinPerf(input: {
  room_id: string;
  student_id: string;
  name: string;
  role: string;
  performance: string;
}) {
  const room = getRoom(input.room_id);
  if (!room || room.mode !== "cabin" || room.status !== "live" || !room.cabin_case) {
    return null;
  }

  const feedback = [
    `【AI 即时点评 · ${input.role}】`,
    `场景：${room.cabin_case.title}`,
    "",
    "安全：是否先守住不可让步的底线？",
    "秩序：是否顾及队列中其他旅客的公平感？",
    "温度：话术是否给出可执行的下一步？",
    "",
    `根据你的扮演（摘要）：${input.performance.slice(0, 80)}${input.performance.length > 80 ? "…" : ""}`,
    "建议把预案改成「三步」：先控风险 → 再给替代方案 → 必要时升级请示。",
    "",
    "—— AI生成内容，供讨论参考",
  ].join("\n");

  const plan = [
    "① 明确红线（安全/规章不可破）",
    "② 提供替代路径（托运协助/改签指引/座位协调）",
    "③ 同步乘务长并安抚周边旅客情绪",
  ].join("\n");

  const item: CabinPerf = {
    student_id: input.student_id,
    name: input.name,
    role: input.role,
    performance: input.performance,
    feedback,
    plan,
    at: new Date().toISOString(),
  };
  room.cabin_perfs.unshift(item);
  recount(room);
  return { room, item };
}

export function submitDebateSpeech(input: {
  room_id: string;
  student_id: string;
  name: string;
  side: DebateSide;
  content: string;
}) {
  const room = getRoom(input.room_id);
  if (!room || room.mode !== "debate" || room.status !== "live") return null;

  room.debate_speeches.unshift({
    student_id: input.student_id,
    name: input.name,
    side: input.side,
    content: input.content,
    at: new Date().toISOString(),
  });
  recount(room);
  return room;
}

export { MODE_TITLE, CABIN_CASES };
