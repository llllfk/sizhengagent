/**
 * 扣子智能体对话（非流式）：发起 → 轮询 → 取 answer。
 * 需环境变量 AGENT_API_TOKEN + AGENT_BOT_ID（学伴）。
 * 短视频工坊另用 WORKSHOP_BOT_ID（启航编导）。勿用 COZE_ 前缀。
 */

const COZE_API = "https://api.coze.cn";

export type CozeChatResult = {
  content: string;
  conversationId: string;
  chatId: string;
};

export function isCozeChatConfigured(): boolean {
  return Boolean(process.env.AGENT_API_TOKEN && process.env.AGENT_BOT_ID);
}

export function isWorkshopBotConfigured(): boolean {
  return Boolean(process.env.AGENT_API_TOKEN && workshopBotId());
}

function workshopBotId(): string {
  return (process.env.WORKSHOP_BOT_ID || process.env.AGENT_BOT_ID || "").trim();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function cozeFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = process.env.AGENT_API_TOKEN;
  if (!token) throw new Error("未配置 AGENT_API_TOKEN");
  return fetch(`${COZE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Agw-Js-Conv": "str",
      ...(init?.headers ?? {}),
    },
  });
}

/** 业务学号映射为对话侧 user_id（稳定、可隔离） */
export function cozeUserId(studentId: string): string {
  return `qh_${studentId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 48)}`;
}

export async function chatWithCozeBot(input: {
  message: string;
  userId: string;
  conversationId?: string | null;
  /** 工坊长文生成可加大轮询次数（默认 12×800ms） */
  maxPolls?: number;
  /** 不传则走启航学伴 AGENT_BOT_ID */
  botId?: string;
}): Promise<CozeChatResult> {
  const botId = (input.botId || process.env.AGENT_BOT_ID || "").trim();
  if (!botId) throw new Error("未配置 AGENT_BOT_ID");

  const qs = input.conversationId
    ? `?conversation_id=${encodeURIComponent(input.conversationId)}`
    : "";

  const startRes = await cozeFetch(`/v3/chat${qs}`, {
    method: "POST",
    body: JSON.stringify({
      bot_id: botId,
      user_id: input.userId,
      stream: false,
      // 扣子要求 auto_save_history=false 时必须带 stream；false 会被当成未传。
      auto_save_history: true,
      additional_messages: [
        {
          role: "user",
          content: input.message,
          content_type: "text",
        },
      ],
    }),
  });

  const startJson = (await startRes.json()) as {
    code: number;
    msg?: string;
    data?: {
      id: string;
      conversation_id: string;
      status?: string;
    };
  };

  if (startJson.code !== 0 || !startJson.data?.id || !startJson.data.conversation_id) {
    throw new Error(startJson.msg || `Coze 发起对话失败 code=${startJson.code}`);
  }

  const chatId = startJson.data.id;
  const conversationId = startJson.data.conversation_id;

  const terminal = new Set([
    "completed",
    "failed",
    "canceled",
    "requires_action",
    "required_action",
  ]);

  let status = startJson.data.status ?? "in_progress";
  // 默认约 20×900ms，覆盖知识库召回偏慢；仍受路由 maxDuration 约束
  const maxPolls = input.maxPolls ?? 20;
  for (let i = 0; i < maxPolls; i++) {
    if (terminal.has(status)) break;
    await sleep(900);
    const retRes = await cozeFetch(
      `/v3/chat/retrieve?conversation_id=${encodeURIComponent(conversationId)}&chat_id=${encodeURIComponent(chatId)}`,
    );
    let retJson: {
      code: number;
      msg?: string;
      data?: { status?: string; last_error?: { msg?: string } };
    };
    try {
      retJson = (await retRes.json()) as typeof retJson;
    } catch {
      throw new Error("Coze 轮询响应异常，请稍后重试");
    }
    if (retJson.code !== 0) {
      throw new Error(retJson.msg || `Coze 轮询失败 code=${retJson.code}`);
    }
    status = retJson.data?.status ?? "in_progress";
    if (status === "failed") {
      throw new Error(retJson.data?.last_error?.msg || "Coze 对话失败");
    }
  }

  if (status !== "completed") {
    throw new Error(`Coze 对话未完成（status=${status}）`);
  }

  const msgRes = await cozeFetch(
    `/v3/chat/message/list?conversation_id=${encodeURIComponent(conversationId)}&chat_id=${encodeURIComponent(chatId)}`,
  );
  const msgJson = (await msgRes.json()) as {
    code: number;
    msg?: string;
    data?: Array<{ type?: string; role?: string; content?: string }>;
  };

  if (msgJson.code !== 0) {
    throw new Error(msgJson.msg || `Coze 取消息失败 code=${msgJson.code}`);
  }

  const answers = (msgJson.data ?? [])
    .filter((m) => m.type === "answer" && m.role === "assistant" && m.content)
    .map((m) => m.content!.trim())
    .filter(Boolean);

  const content = answers.join("\n\n").trim();
  if (!content) {
    throw new Error("Coze 未返回有效回复");
  }

  return { content, conversationId, chatId };
}
