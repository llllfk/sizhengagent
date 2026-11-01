/**
 * 学伴答疑固定脚本（客户《问答(1).docx》）
 * 仅命中下列问题时走固定答；其余问题走智能体。
 */

/** 固定脚本回复前的思考等待，避免秒回显得不像智能体 */
export const FIXED_SCRIPT_THINK_MS = 6000;

export type FixedQaTurn = {
  question: string;
  answer: string;
  /** 需同时/分别命中的关键词组（任一组全中即可） */
  keywordGroups: string[][];
};

export const FIXED_QA_TURNS: FixedQaTurn[] = [
  {
    question: "什么是人民至上？",
    keywordGroups: [["人民至上"], ["什么是人民"]],
    answer: [
      "同学你问的是思政课核心理论点“人民至上”，结合教材内容和空乘岗位的落地逻辑，可以先抓三个核心框架：",
      "1. 价值原点：是习近平新时代中国特色社会主义思想的理论基点，本质是“我将无我、不负人民”，始终把人民放在心中最高位置，把人民对美好生活的向往作为奋斗目标。",
      "2. 实践逻辑：人民是历史的创造者，党执政的根基、血脉、力量都来自人民，所有工作的最终评判权在人民手中。",
      "3. 岗位落点：放到客舱里就是“以旅客为中心”，首先守住全体旅客的生命安全底线，再在规则边界内尽可能满足旅客合理需求，服务好不好最终由旅客说了算。",
      "我想先问你两个小问题：你觉得空乘岗位里的“人民至上”，和普通服务行业的“顾客是上帝”最核心的区别是什么？如果遇到旅客提出超出安全规章的需求，你会怎么平衡“满足旅客”和“守公共安全底线”的关系？",
    ].join("\n"),
  },
  {
    question: "二者不同，但是为什么会出现东航下跪事件？",
    keywordGroups: [
      ["东航", "下跪"],
      ["下跪", "为什么"],
      ["二者不同"],
    ],
    answer: [
      "你提到的这个事件是民航服务中“规则与服务边界”的典型争议，咱们先厘清前提：空乘的所有服务动作都不能脱离“安全优先、人格平等”的底线，下跪本身既不符合岗位规范，也不是“人民至上”的要求。",
      "结合客舱服务的岗位逻辑，这件事的核心其实是两个常见误区：",
      "1. 把“旅客至上”等同于“无底线满足旅客所有要求”，忽略了“人民至上”首先是保障全体旅客的公共利益，不是对单个旅客的无底线妥协；",
      "2. 混淆了“职业素养”和“人格尊严”的边界，合规的服务沟通完全可以通过解释规则、提供替代方案解决冲突，不需要突破人格底线。",
      "想先问你两个问题：如果当时你是当班乘务员，遇到旅客提出不合理且触碰安全红线的要求，你第一步会先做什么？你觉得客舱服务里“有边界的温度”应该划在什么位置？",
      "—— AI生成内容，供讨论参考",
    ].join("\n"),
  },
  {
    question: "面对东航下跪事件，该如何做？",
    keywordGroups: [
      ["东航", "如何做"],
      ["东航", "怎么做"],
      ["面对", "下跪"],
      ["下跪", "处置"],
    ],
    answer: [
      "你提到的这个事件属于客舱服务里的“无底线服务误区”，按照民航通用的客舱冲突处置流程，正确的处置可以按这六步走：",
      "1. 先评估：第一时间判断旅客诉求是否触碰安全红线、是否涉及人身攻击或人格侮辱，明确冲突边界",
      "2. 沟通劝导：用同理心先安抚情绪，清晰说明规章要求和无法满足的原因，同时给出合规的替代方案",
      "3. 报告协同：如果旅客情绪激动不接受沟通，立刻报告乘务长，呼叫安全员/空警介入，不要独自硬扛",
      "4. 固定证据：全程录音录像，也可以请邻座旅客作证，留存所有沟通记录",
      "5. 移交地面：如果旅客持续扰乱客舱秩序，落地后移交机场公安处理",
      "6. 服务补救：后续安抚其他受影响的旅客，做好事件记录上报",
      "我想问你两个问题：如果旅客要求你下跪道歉才肯罢休，你会怎么回应？你觉得乘务组的集体支持对一线乘务员守住服务边界有多重要？",
      "—— AI生成内容，供讨论参考",
    ].join("\n"),
  },
  {
    question: "我不知道如何回应",
    keywordGroups: [
      ["不知道", "回应"],
      ["如何回应"],
      ["不会回应"],
    ],
    /** 末轮要约：不再默认进教师队列，等学员下一句再决定 */
    answer: [
      "这一轮先聊到这里。若问题已经想通，回复「已解决」即可，不必转给老师。",
      "若还有疑问，请用一句话写下最想请老师澄清的一点，我再帮你转给老师。",
      "—— AI生成内容，供讨论参考",
    ].join("\n"),
  },
];

/** 满轮后的转接邀请（开放题与固定脚本共用口径） */
export const QA_ESCALATE_OFFER = [
  "这一轮先聊到这里。若问题已经想通，回复「已解决」即可，不必转给老师。",
  "若还有疑问，请用一句话写下最想请老师澄清的一点，我再帮你转给老师。",
].join("\n");

export const QA_RESOLVED_REPLY =
  "好的，这轮就先到这里。之后若又有新疑问，随时再来问，或点「新开一轮」。";

export const FIXED_QA_ESCALATE_HINT =
  "已转给老师。老师可在线答复；本页会自动同步。也可新开一轮继续问学伴。";

export const FIXED_QA_DEMO_PROMPTS = FIXED_QA_TURNS.map((t) => t.question);

/** 学员表示已解决 / 不需要老师 → 不转接 */
export function studentDeclinesTeacher(text: string): boolean {
  const t = text.replace(/\s+/g, "");
  return /已解决|没有了|没问题了|想通了|明白了|清楚了|懂了|可以了|没事了|不用转|不需要老师|不用老师|不必转|已想通|解决了|没有疑问|没疑问/.test(
    t,
  );
}

function norm(s: string) {
  return s.replace(/\s+/g, "");
}

function scoreTurn(text: string, turn: FixedQaTurn): number {
  const q = norm(text);
  let best = 0;
  for (const group of turn.keywordGroups) {
    if (group.every((kw) => q.includes(norm(kw)))) {
      best = Math.max(best, group.length * 3);
    }
  }
  if (q.includes(norm(turn.question).slice(0, 10))) best += 5;
  return best;
}

/** 命中固定脚本某一问则返回；未命中返回 null（走智能体） */
export function matchFixedQuestion(text: string): {
  index: number;
  turn: FixedQaTurn;
} | null {
  let bestIdx = -1;
  let bestScore = 0;
  FIXED_QA_TURNS.forEach((turn, i) => {
    const s = scoreTurn(text, turn);
    if (s > bestScore) {
      bestScore = s;
      bestIdx = i;
    }
  });
  if (bestIdx < 0 || bestScore < 3) return null;
  return { index: bestIdx, turn: FIXED_QA_TURNS[bestIdx]! };
}

/** 开场问是否进入固定脚本链路 */
export function fixedScriptStartIndex(openingQuestion: string): number | null {
  return matchFixedQuestion(openingQuestion)?.index ?? null;
}

export type FixedFollowupPhase = "script" | "offer" | "decide";

/**
 * 固定链路追问：从开场命中的脚本下标继续往下推。
 * sessionRound = 学员已作答次数（开场后为 0）
 * - script：正常脚本答
 * - offer：末轮邀请，是否转老师由下一句决定（不自动转）
 * - decide：学员已回复邀请，由上层根据文案决定是否转接
 */
export function matchFixedFollowup(
  openingQuestion: string,
  sessionRound: number,
): {
  index: number;
  turn: FixedQaTurn;
  phase: FixedFollowupPhase;
} | null {
  const start = fixedScriptStartIndex(openingQuestion);
  if (start === null) return null;
  const lastIdx = FIXED_QA_TURNS.length - 1;
  const projected = start + sessionRound + 1;
  if (projected > lastIdx) {
    return {
      index: lastIdx,
      turn: FIXED_QA_TURNS[lastIdx]!,
      phase: "decide",
    };
  }
  const next = Math.min(projected, lastIdx);
  return {
    index: next,
    turn: FIXED_QA_TURNS[next]!,
    phase: next >= lastIdx ? "offer" : "script",
  };
}
