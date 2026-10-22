import {
  classifyQuestionStub,
  contentSafetyGate,
  nextSocraticPrompt,
  withAiDisclaimer,
  type QuestionType,
} from "@/lib/ai";

/** 比赛演示用：无大模型时的「像样」追问与点评文案 */
export function buildFirstPrompt(question: string): {
  q_type: QuestionType;
  prompt: string;
} {
  const q_type = classifyQuestionStub(question);

  let body: string;
  if (q_type === "scenario") {
    body = [
      "【情境识别】这更像客舱现场的决策题，而不是背标准答案。",
      "先把画面还原清楚：你站在哪个岗位？冲突的双方分别要什么？",
      "安全底线有没有被触碰？如果有，哪一条不可让步？",
      "",
      "请用两三句话描述：当时你看到了什么、最先担心的是什么。",
    ].join("\n");
  } else if (q_type === "value") {
    body = [
      "【价值类】我不会直接给结论，我们用苏格拉底三连一起想。",
      "",
      `第一问：${nextSocraticPrompt(0)}`,
      "（可以结合空乘岗位：对旅客、对机组、对规则，你分别站在哪一侧？）",
    ].join("\n");
  } else {
    body = [
      "【知识类】先对齐关键概念，再谈落地。",
      "在你的问题里，你最想弄清的关键词是哪一个？",
      "例如：人民至上 / 服务边界 / 职业伦理 / 应急指令优先级。",
      "",
      "请选出一个词，并用自己的话解释它在客舱里意味着什么。",
    ].join("\n");
  }

  const gated = contentSafetyGate(withAiDisclaimer(body));
  return { q_type, prompt: gated.text };
}

export function buildFollowupPrompt(input: {
  q_type: QuestionType;
  round: number;
  answer: string;
}): { prompt: string; shouldEscalate: boolean } {
  const nextRound = input.round; // 已完成的轮次，0 起
  const step = nextSocraticPrompt(Math.min(nextRound, 2));

  if (nextRound >= 2 || !step) {
    const prompt = withAiDisclaimer(
      [
        "本轮追问已达上限。你的思考已经触及关键张力，但现场预案仍不够可执行。",
        "系统将生成「疑难清单」推送至教师工作台，由老师做专题答疑与价值引导。",
        "",
        "你可以补充一句：最希望老师帮你澄清的一点是什么？",
      ].join("\n"),
    );
    return {
      prompt: contentSafetyGate(prompt).text,
      shouldEscalate: true,
    };
  }

  let body: string;
  if (input.q_type === "scenario") {
    const hints = [
      `收到。继续追问：${step}\n对照刚才的描述，如果安全与温度冲突，你优先保住哪一端？为什么？`,
      `再推一步：${step}\n换作「夜间延误 + 旅客激动」的情境，你的方案还成立吗？请改一版 30 秒话术。`,
      `收束一下：${step}\n请用「可执行三步」写出预案：先做什么、再说什么、何时升级请示。`,
    ];
    body = hints[Math.min(nextRound, hints.length - 1)];
  } else if (input.q_type === "value") {
    const hints = [
      `好。第二问：${step}\n请给出一条你愿意公开站队的依据（制度 / 案例 / 职业守则均可）。`,
      `第三问：${step}\n若旅客换成老人或儿童，你的判断会变吗？变在哪里、不变在哪里？`,
      `请把你的立场压缩成一句话「我坚持…因为…」。`,
    ];
    body = hints[Math.min(nextRound, hints.length - 1)];
  } else {
    const hints = [
      `概念抓得不错。接着：${step}\n请举一个客舱里的反例——看起来「好心」却可能越界的做法。`,
      `再深一层：${step}\n这个概念如果只停留在口号，课堂与岗位之间会断在哪里？`,
      `请用「定义一句 + 岗位一句」做小结，便于写入你的错题本。`,
    ];
    body = hints[Math.min(nextRound, hints.length - 1)];
  }

  return {
    prompt: contentSafetyGate(withAiDisclaimer(body)).text,
    shouldEscalate: false,
  };
}

export const DEMO_PROMPTS = [
  "客舱突发旅客纠纷时，乘务员该如何平衡规则与人情？",
  "颠簸中旅客拒绝回座，我该先讲安全还是先安抚情绪？",
  "什么是客舱服务里的「人民至上」？",
];

export { SAFETY_DEMO_SAMPLES } from "@/lib/ai";
