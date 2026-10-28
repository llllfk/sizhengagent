import { chatCompletion } from "@/lib/ai";
import {
  chatWithCozeBot,
  isWorkshopBotConfigured,
} from "@/lib/coze/chat";

type GenKind = "script" | "storyboard" | "subtitle" | "play";

function systemPrompt(kind: GenKind) {
  const task =
    kind === "script"
      ? "写一份约 90 秒的空乘思政短视频脚本（含画面、对白/旁白、收束金句）。"
      : kind === "storyboard"
        ? "把主题拆成 6～8 个分镜，每镜写：镜号、时长、景别、画面、字幕/旁白。"
        : kind === "subtitle"
        ? "根据主题生成中文字幕轴：时间码 + 字幕文本，约 8～12 条。"
        : "把全班「一句话接龙」合成一份完整客舱思政课本剧：人物、冲突、转折、结局；含角色、台词、舞台提示。必须消化每一句接龙，不要只列清单。";
  return [
    "你是空乘思政短视频编导，只输出可拍摄的成稿，不要追问、不要客套。",
    "导向：人民至上、安全底线、规则与温度、机组履职尊严。禁止弱化规章或鼓吹破规通融。",
    task,
    "用中文。不要输出「你怎么看」这类苏格拉底追问。",
  ].join("");
}

function userPrompt(
  kind: GenKind,
  theme: string,
  valuePoint: string,
  script?: string,
) {
  const vp = valuePoint.trim() || "人民至上 · 安全优先";
  if (kind === "play") {
    return `主题：${theme}\n价值点：${vp}\n全班接龙：\n${script || "（尚无接龙）"}\n请直接输出完整剧本。`;
  }
  if (kind === "subtitle") {
    return `主题：${theme}\n价值点：${vp}\n已有脚本：\n${script || "（无）"}\n请直接给出字幕轴。`;
  }
  if (kind === "storyboard") {
    return `主题：${theme}\n价值点：${vp}\n已有脚本：\n${script || "（无）"}\n请直接给出分镜表。`;
  }
  return `主题：${theme}\n价值点：${vp}\n请直接给出短视频脚本。`;
}

function localScript(theme: string, valuePoint: string) {
  const vp = valuePoint.trim() || "人民至上 · 安全优先";
  return [
    `【主题】${theme}`,
    `【价值点】${vp}`,
    "",
    "【开场 0–8s】客舱走廊空镜，广播「请系好安全带」。旁白：每一次航班，都在回答我们把什么放在前面。",
    `【冲突 8–28s】旅客情绪激动，提出与规章冲突的诉求。乘务员先稳住场面，再对照手册说明。字幕：规则不是冷漠，是对全体旅客的保护。`,
    `【抉择 28–55s】特写对讲机、安全带、旅客神情。乘务长到场：先指令、后温度。金句：${vp}。`,
    "【落地 55–75s】秩序恢复，乘务员递上安抚与替代方案（托运/改座/说明投诉渠道）。旁白：通融不是破规，是边界内的可执行路径。",
    "【收束 75–90s】客舱灯光，落版「启航」。旁白：安全是底线，温度是能力，边界是职业尊严。",
  ].join("\n");
}

function localStoryboard(theme: string, valuePoint: string) {
  const vp = valuePoint.trim() || "人民至上 · 安全优先";
  return [
    `主题：${theme}`,
    `价值点：${vp}`,
    "镜1  2s  远景  客舱走廊／安全带指示灯  字幕：请系好安全带",
    "镜2  4s  中景  旅客提出诉求，乘务员倾听  旁白：先听见人，再守住线",
    "镜3  5s  近景  手册／尺寸对照／广播话术  字幕：依据在规章里",
    "镜4  6s  中近  乘务长协同，给出双路径方案  旁白：温度在边界之内",
    "镜5  4s  反应  其他旅客神情从紧张到安定  字幕：公共安全优先",
    "镜6  4s  中景  秩序恢复，服务继续  旁白：履职有尊严，维权有渠道",
    `镜7  3s  特写  落版金句  ${vp}`,
    "镜8  2s  品牌  「启航」书法字  字幕：讲深 · 讲透 · 讲活",
  ].join("\n");
}

function localPlay(theme: string, lines?: string) {
  return [
    `【主题】${theme}`,
    "【人物】乘务长 / 新乘务员 / 旅客代表",
    "【冲突】服务边界与旅客诉求碰撞",
    "【转折】以人民至上原则重估现场选择",
    "【结局】形成可执行客舱预案：先指令、后温度、边界内给双路径",
    "",
    "—— 接龙素材 ——",
    lines?.trim() || "（尚无接龙，已生成结构框架）",
  ].join("\n");
}

function localSubtitle(theme: string, valuePoint: string) {
  const vp = valuePoint.trim() || "人民至上 · 安全优先";
  return [
    "00:00–00:04  客舱里每一次抉择，都在回答我们把什么放在前面。",
    `00:04–00:10  主题：${theme}`,
    "00:10–00:18  先听见诉求，再对照规章。",
    "00:18–00:28  安全是底线，不是可以商量的附加项。",
    "00:28–00:40  通融不是破规，是边界内的可执行路径。",
    `00:40–00:52  价值点：${vp}`,
    "00:52–01:05  机组依法履职，旅客依法维权，双向尊重。",
    "01:05–01:20  温度在服务里，尺度在法律里。",
    "01:20–01:30  启航 · 讲深讲透讲活",
  ].join("\n");
}

async function fromLlm(kind: GenKind, user: string): Promise<string | null> {
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL;
  if (!apiKey || !baseUrl) return null;
  try {
    const text = await chatCompletion([
      { role: "system", content: systemPrompt(kind) },
      { role: "user", content: user },
    ]);
    return text.trim() || null;
  } catch (e) {
    console.error("[video] LLM 失败", e);
    return null;
  }
}

async function fromCoze(
  kind: GenKind,
  user: string,
  studentId: string,
): Promise<string | null> {
  if (!isWorkshopBotConfigured()) return null;
  try {
    const r = await chatWithCozeBot({
      message: `${systemPrompt(kind)}\n\n${user}`,
      userId: `qh_video_${kind}_${studentId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 24)}`,
      maxPolls: 40,
      botId: process.env.WORKSHOP_BOT_ID || process.env.AGENT_BOT_ID,
    });
    const text = r.content.replace(/——\s*AI生成内容[\s\S]*$/, "").trim();
    if (!text) return null;
    if (/你怎么看|依据是什么|换个情境/.test(text) && text.length < 80) {
      return null;
    }
    return text;
  } catch (e) {
    console.error("[video] Coze 失败", e);
    return null;
  }
}

export async function generateWorkshopCopy(input: {
  kind: GenKind;
  theme: string;
  valuePoint: string;
  script?: string;
  studentId: string;
}): Promise<{ text: string; source: "llm" | "coze" | "local" }> {
  const user = userPrompt(
    input.kind,
    input.theme,
    input.valuePoint,
    input.script,
  );
  const llm = await fromLlm(input.kind, user);
  if (llm) return { text: llm, source: "llm" };
  const coze = await fromCoze(input.kind, user, input.studentId);
  if (coze) return { text: coze, source: "coze" };
  const local =
    input.kind === "script"
      ? localScript(input.theme, input.valuePoint)
      : input.kind === "storyboard"
        ? localStoryboard(input.theme, input.valuePoint)
        : input.kind === "play"
          ? localPlay(input.theme, input.script)
          : localSubtitle(input.theme, input.valuePoint);
  return { text: local, source: "local" };
}
