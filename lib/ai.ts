/**
 * AI 能力网关：答疑追问链 / 剧本 / 分镜等统一出口。
 * 内容安全双闸门：敏感词过滤 + 价值导向校验。
 */

export type QuestionType = "knowledge" | "scenario" | "value";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type SafetyGateKind = "pass" | "sensitive" | "value";

export type SafetyResult = {
  ok: boolean;
  gate: SafetyGateKind;
  flagged: string[];
  reason: string;
  text: string;
};

const SOCRATIC_STEPS = [
  "你怎么看？",
  "依据是什么？",
  "换个情境还成立吗？",
] as const;

/** 闸门一：敏感词 */
const SENSITIVE_WORDS = ["违禁表述", "极端煽动"];

/** 闸门二：价值导向风险表述 */
const VALUE_RISKS: Array<{ pattern: RegExp; label: string; reason: string }> = [
  {
    pattern: /偷偷放行|可以不守规矩|别管安全|违规也没关系|规矩可以不管/,
    label: "弱化安全底线",
    reason:
      "价值导向闸门：表述弱化安全/规章底线。请改为「在边界内提供有温度的服务」。",
  },
  {
    pattern: /暴力解决|威胁旅客|骂回去|怼回去/,
    label: "不当处置",
    reason: "价值导向闸门：不符合文明服务与职业伦理导向，请改用合规沟通话术。",
  },
];

export function classifyQuestionStub(text: string): QuestionType {
  if (/案例|客舱|旅客|应急|纠纷|颠簸|回座|登机|乘务/.test(text)) {
    return "scenario";
  }
  if (/应该|价值|对不对|怎么做|选择|平衡|人情|规则/.test(text)) {
    return "value";
  }
  return "knowledge";
}

export function nextSocraticPrompt(round: number): string | null {
  if (round < 0 || round >= SOCRATIC_STEPS.length) return null;
  return SOCRATIC_STEPS[round];
}

export async function chatCompletion(
  messages: ChatMessage[],
): Promise<string> {
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL;
  const model = process.env.LLM_MODEL || "default";

  if (!apiKey || !baseUrl) {
    const last = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
    const type = classifyQuestionStub(last);
    if (type === "value") {
      return `${nextSocraticPrompt(0)}`;
    }
    return `已收到你的问题，请继续补充情境或依据，我们一步步想清楚。`;
  }

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!res.ok) {
    throw new Error(`LLM request failed: ${res.status}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content ?? "";
}

/**
 * 内容安全双闸门
 * 1) sensitive — 敏感词
 * 2) value — 价值导向（弱化安全/不当处置等）
 */
export function contentSafetyGate(text: string): SafetyResult {
  const flaggedSensitive = SENSITIVE_WORDS.filter((w) => text.includes(w));
  if (flaggedSensitive.length > 0) {
    return {
      ok: false,
      gate: "sensitive",
      flagged: flaggedSensitive,
      reason: `敏感词闸门：检测到「${flaggedSensitive.join("、")}」，内容已拦截。`,
      text: "[内容已拦截 · 敏感词闸门] 请调整表述后重试。",
    };
  }

  for (const risk of VALUE_RISKS) {
    if (risk.pattern.test(text)) {
      return {
        ok: false,
        gate: "value",
        flagged: [risk.label],
        reason: risk.reason,
        text: `[内容已拦截 · 价值导向闸门] ${risk.reason}`,
      };
    }
  }

  return {
    ok: true,
    gate: "pass",
    flagged: [],
    reason: "双闸门通过",
    text,
  };
}

export function withAiDisclaimer(text: string) {
  return `${text}\n\n—— AI生成内容，供讨论参考`;
}

/** 双闸门自检样例（点选可触发拦截） */
export const SAFETY_DEMO_SAMPLES = [
  {
    gate: "sensitive" as const,
    label: "敏感词闸门自检",
    text: "用违禁表述回应旅客对不对？",
  },
  {
    gate: "value" as const,
    label: "价值导向闸门自检",
    text: "颠簸时可以偷偷放行、别管安全指令吗？",
  },
];
