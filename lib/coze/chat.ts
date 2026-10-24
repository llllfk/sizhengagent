/**
 * 扣子智能体对话（非流式）：发起 → 轮询 → 取 answer。
 * 需环境变量 COZE_API_TOKEN + COZE_BOT_ID。
 */

const COZE_API = "https://api.coze.cn";

export type CozeChatResult = {
  content: string;
  conversationId: string;
  chatId: string;
};

export function isCozeChatConfigured(): boolean {
  return Boolean(process.env.COZE_API_TOKEN && process.env.COZE_BOT_ID);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function cozeFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = process.env.COZE_API_TOKEN;
  if (!token) throw new Error("未配置 COZE_API_TOKEN");
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
}): Promise<CozeChatResult> {
  const botId = process.env.COZE_BOT_ID;
  if (!botId) throw new Error("未配置 COZE_BOT_ID");

  const qs = input.conversationId
    ? `?conversation_id=${encodeURIComponent(input.conversationId)}`
    : "";

  const startRes = await cozeFetch(`/v3/chat${qs}`, {
    method: "POST",
    body: JSON.stringify({
      bot_id: botId,
      user_id: input.userId,
      stream: false,
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
  for (let i = 0; i < 45; i++) {
    if (terminal.has(status)) break;
    await sleep(1200);
    const retRes = await cozeFetch(
      `/v3/chat/retrieve?conversation_id=${encodeURIComponent(conversationId)}&chat_id=${encodeURIComponent(chatId)}`,
    );
    const retJson = (await retRes.json()) as {
      code: number;
      msg?: string;
      data?: { status?: string; last_error?: { msg?: string } };
    };
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
