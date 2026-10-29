import {
  classifyQuestionStub,
  contentSafetyGate,
  nextSocraticPrompt,
  withAiDisclaimer,
  type QuestionType,
} from "@/lib/ai";
import {
  FIXED_QA_DEMO_PROMPTS,
  FIXED_QA_ESCALATE_HINT,
  matchFixedFollowup,
  matchFixedQuestion,
} from "@/lib/content/fixedQaScript";
import {
  retrieveForFixedScript,
  retrieveForQuestion,
  type RetrievalHit,
} from "@/lib/content/retrieval";

function qTypeForIndex(index: number): QuestionType {
  if (index === 0) return "value";
  if (index >= 2) return "scenario";
  return "knowledge";
}

export type FirstPromptResult = {
  mode: "fixed" | "agent";
  q_type: QuestionType;
  prompt: string;
  retrieval: RetrievalHit[];
  script_index: number | null;
};

/**
 * 首轮：命中固定脚本问法 → 固定答；否则走智能体（本地苏格拉底兜底）
 * 右侧检索一律习著作置顶
 */
export function buildFirstPrompt(question: string): FirstPromptResult {
  const fixed = matchFixedQuestion(question);
  if (fixed) {
    return {
      mode: "fixed",
      q_type: qTypeForIndex(fixed.index),
      prompt: contentSafetyGate(fixed.turn.answer).text,
      retrieval: retrieveForFixedScript({
        scriptIndex: fixed.index,
        query: question,
        limit: 4,
      }),
      script_index: fixed.index,
    };
  }

  const q_type = classifyQuestionStub(question);
  const retrieval = retrieveForQuestion(question, 4);
  const ragLine =
    retrieval.length > 0
      ? "【检索】已命中答疑知识库（见右侧引用，首条为习著作），请结合片段思考。\n"
      : "";

  // 本地兜底也压到三句以内，与客户「凝练准确」一致
  let body: string;
  if (q_type === "scenario") {
    body = [
      "这是客舱决策题，先对齐安全底线再谈服务温度。",
      ragLine.trim() || null,
      "请用一句话说清：你最先担心的是什么、哪条红线不能让？",
    ]
      .filter(Boolean)
      .join("");
  } else if (q_type === "value") {
    body = [
      `价值题不给现成结论。${nextSocraticPrompt(0)}`,
      "请结合空乘岗位，用一句话表明你站在旅客、机组还是规章这一侧，并说出依据。",
    ].join("");
  } else {
    body = [
      "先抓住一个关键词（如人民至上、服务边界、安全红线）。",
      "请用一句话定义它，再用一句话说明在客舱里意味着什么。",
    ].join("");
  }

  return {
    mode: "agent",
    q_type,
    prompt: contentSafetyGate(withAiDisclaimer(body)).text,
    retrieval,
    script_index: null,
  };
}

export type FollowupPromptResult = {
  mode: "fixed" | "agent";
  prompt: string;
  shouldEscalate: boolean;
  escalateHint?: string;
  retrieval: RetrievalHit[];
  script_index: number | null;
};

/**
 * 追问：开场若命中固定脚本则继续脚本；否则智能体本地追问兜底
 */
export function buildFollowupPrompt(input: {
  openingQuestion: string;
  q_type: QuestionType;
  round: number;
  answer: string;
}): FollowupPromptResult {
  const fixed = matchFixedFollowup(input.openingQuestion, input.round);
  if (fixed) {
    return {
      mode: "fixed",
      prompt: contentSafetyGate(fixed.turn.answer).text,
      shouldEscalate: fixed.shouldEscalate,
      escalateHint: fixed.shouldEscalate ? FIXED_QA_ESCALATE_HINT : undefined,
      retrieval: retrieveForFixedScript({
        scriptIndex: fixed.index,
        query: `${input.openingQuestion} ${input.answer}`,
        limit: 4,
      }),
      script_index: fixed.index,
    };
  }

  const nextRound = input.round;
  const step = nextSocraticPrompt(Math.min(nextRound, 2));
  const retrieval = retrieveForQuestion(
    `${input.openingQuestion} ${input.answer}`,
    4,
  );

  if (nextRound >= 2 || !step) {
    return {
      mode: "agent",
      prompt: contentSafetyGate(
        withAiDisclaimer(
          "本轮追问已满。请用一句话写出最想请老师澄清的一点，系统将转入教师队列。",
        ),
      ).text,
      shouldEscalate: true,
      escalateHint: FIXED_QA_ESCALATE_HINT,
      retrieval,
      script_index: null,
    };
  }

  let body: string;
  if (input.q_type === "scenario") {
    const hints = [
      `${step}安全与温度冲突时，你优先保住哪一端？请一句话说清理由。`,
      `${step}换成夜间延误、旅客激动，你的方案还成立吗？请给一句可执行话术。`,
      `${step}请用「先做—再说—何时升级」三步各一句，收束预案。`,
    ];
    body = hints[Math.min(nextRound, hints.length - 1)]!;
  } else if (input.q_type === "value") {
    const hints = [
      `${step}请给出一条愿意公开站队的依据（制度/案例/守则），一句话即可。`,
      `${step}若换成老人或儿童旅客，判断变在哪、不变在哪？各用半句话。`,
      `请压缩成一句：「我坚持…因为…」。`,
    ];
    body = hints[Math.min(nextRound, hints.length - 1)]!;
  } else {
    const hints = [
      `${step}请举一个客舱「好心却越界」的反例，一句话。`,
      `${step}若只停留在口号，课堂与岗位会断在哪里？一句话。`,
      `请用「定义一句 + 岗位一句」小结。`,
    ];
    body = hints[Math.min(nextRound, hints.length - 1)]!;
  }

  return {
    mode: "agent",
    prompt: contentSafetyGate(withAiDisclaimer(body)).text,
    shouldEscalate: false,
    retrieval,
    script_index: null,
  };
}

/** 示范问：固定脚本问 + 若干开放题 */
export const DEMO_PROMPTS = [
  ...FIXED_QA_DEMO_PROMPTS,
  "客舱突发旅客纠纷时，乘务员该如何平衡规则与人情？",
  "颠簸中旅客拒绝回座，我该先讲安全还是先安抚情绪？",
  "三个敬畏如何落到一次平凡航班的客舱巡视？",
];

export { SAFETY_DEMO_SAMPLES } from "@/lib/ai";
