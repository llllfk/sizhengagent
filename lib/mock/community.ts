import type {
  ForumReply,
  ForumSource,
  ForumTopic,
  HighlightItem,
} from "@/types";
import { getStore } from "@/lib/mock/store";

type CommunityStore = {
  topics: ForumTopic[];
  replies: ForumReply[];
  highlights: HighlightItem[];
};

function ago(hours: number) {
  return new Date(Date.now() - hours * 36e5).toISOString();
}

function seed(): CommunityStore {
  const esc = getStore().escalations;
  const escSummary =
    esc[0]?.summary ??
    "旅客坚持带超规随身行李登机，人情与规则两难，请求专题研讨。";

  const topics: ForumTopic[] = [
    {
      topic_id: "tp_debate_1",
      title: "客舱服务该不该「适度通融」？",
      body: [
        "【课中辩论回流】高职空乘课堂专题：在保障安全与规章的前提下，是否允许乘务员对旅客诉求做「适度通融」。",
        "正方：温度服务体现以人民为中心；反方：通融边界一旦模糊，安全与公平双双失守。",
        "请结合岗位规程与价值权衡继续深挖。",
      ].join("\n"),
      source: "debate",
      source_ref: "room_debate_seed",
      tags: ["课堂辩论", "服务边界", "安全优先"],
      author_id: "T-teacher",
      author_name: "李老师",
      author_role: "teacher",
      reply_count: 3,
      hot: 96,
      pinned: true,
      created_at: ago(6),
    },
    {
      topic_id: "tp_esc_1",
      title: "超规行李：人情与规则如何两全？",
      body: `【疑难转接回流】${escSummary}`,
      source: "escalation",
      source_ref: esc[0]?.escalation_id ?? "esc_seed_1",
      tags: ["转接议题", "职业伦理", "规章落地"],
      author_id: "T-teacher",
      author_name: "李老师",
      author_role: "teacher",
      reply_count: 2,
      hot: 78,
      pinned: false,
      created_at: ago(18),
    },
    {
      topic_id: "tp_manual_1",
      title: "颠簸中拒绝回座：指令硬还是沟通温？",
      body: "客舱颠簸指令已下达，个别旅客仍拒绝回座。如何在「安全至上」与「尊重旅客」之间找到可执行话术？欢迎分享课堂演练经验。",
      source: "manual",
      tags: ["应急沟通", "人民至上", "话术"],
      author_id: "S2026015",
      author_name: "周予安",
      author_role: "student",
      reply_count: 1,
      hot: 54,
      pinned: false,
      created_at: ago(30),
    },
  ];

  const replies: ForumReply[] = [
    {
      reply_id: "rp_1",
      topic_id: "tp_debate_1",
      author_id: "S2026001",
      author_name: "林晓航",
      author_role: "student",
      content:
        "正方补充：通融不是破规，而是在规章允许的裁量空间里给出有温度的解释与替代方案。",
      created_at: ago(5),
    },
    {
      reply_id: "rp_2",
      topic_id: "tp_debate_1",
      author_id: "S2026008",
      author_name: "陈思远",
      author_role: "student",
      content:
        "反方提醒：一旦「适度」不可量化，新人更易被情绪绑架；应先立边界清单再谈温度。",
      created_at: ago(4.5),
    },
    {
      reply_id: "rp_3",
      topic_id: "tp_debate_1",
      author_id: "T-teacher",
      author_name: "李老师",
      author_role: "teacher",
      content:
        "小结：双方都指向「边界清晰 + 解释充分」。下节课用案例卡把裁量区间可视化。",
      created_at: ago(3),
    },
    {
      reply_id: "rp_4",
      topic_id: "tp_esc_1",
      author_id: "demo-student",
      author_name: "演示学员",
      author_role: "student",
      content:
        "可先共情再出示尺寸对照卡，同时提供托运/收费两种路径，把「人情」落在选项而非破例。",
      created_at: ago(12),
    },
    {
      reply_id: "rp_5",
      topic_id: "tp_esc_1",
      author_id: "T-teacher",
      author_name: "李老师",
      author_role: "teacher",
      content: "这条可进精华集，回灌答疑库作「超规行李」标准话术。",
      created_at: ago(10),
    },
    {
      reply_id: "rp_6",
      topic_id: "tp_manual_1",
      author_id: "S2026001",
      author_name: "林晓航",
      author_role: "student",
      content:
        "话术骨架：说明风险 → 给出协助（帮扶/安抚）→ 复述安全指令 → 记录备查。",
      created_at: ago(20),
    },
  ];

  const highlights: HighlightItem[] = [
    {
      highlight_id: "hl_1",
      title: "通融 ≠ 破规：裁量区间要可视化",
      excerpt:
        "辩论共识：温度服务建立在可解释、可量化的规章裁量之上；先立边界清单，再谈人情温度。",
      tags: ["课堂辩论", "服务边界"],
      source_topic_id: "tp_debate_1",
      pinned: true,
      refluxed: true,
      created_at: ago(2),
    },
    {
      highlight_id: "hl_2",
      title: "超规行李三步法：共情 · 对照 · 双路径",
      excerpt:
        "共情诉求 → 尺寸对照卡 → 托运/收费双选项，把人情落在合规选项而非破例放行。",
      tags: ["转接议题", "职业伦理"],
      source_topic_id: "tp_esc_1",
      pinned: true,
      refluxed: false,
      created_at: ago(8),
    },
    {
      highlight_id: "hl_3",
      title: "颠簸回座话术骨架",
      excerpt:
        "说明风险 → 给出协助 → 复述安全指令 → 记录备查。硬指令与软沟通可同框。",
      tags: ["应急沟通"],
      source_topic_id: "tp_manual_1",
      pinned: false,
      refluxed: false,
      created_at: ago(16),
    },
  ];

  return { topics, replies, highlights };
}

const g = globalThis as unknown as { __qihangCommunity?: CommunityStore };

function getCommunity(): CommunityStore {
  if (!g.__qihangCommunity) {
    g.__qihangCommunity = seed();
  }
  return g.__qihangCommunity;
}

export function listTopics() {
  return [...getCommunity().topics].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.hot - a.hot;
  });
}

export function getTopic(topicId: string) {
  return getCommunity().topics.find((t) => t.topic_id === topicId) ?? null;
}

export function listReplies(topicId: string) {
  return getCommunity()
    .replies.filter((r) => r.topic_id === topicId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function createTopic(input: {
  title: string;
  body: string;
  tags?: string[];
  source?: ForumSource;
  author_id?: string;
  author_name?: string;
  author_role?: ForumTopic["author_role"];
}) {
  const store = getCommunity();
  const topic: ForumTopic = {
    topic_id: `tp_${Date.now()}`,
    title: input.title.trim(),
    body: input.body.trim(),
    source: input.source ?? "manual",
    tags: input.tags?.length ? input.tags : ["师生共创"],
    author_id: input.author_id ?? "demo-student",
    author_name: input.author_name ?? "演示学员",
    author_role: input.author_role ?? "student",
    reply_count: 0,
    hot: 12,
    pinned: false,
    created_at: new Date().toISOString(),
  };
  store.topics.unshift(topic);
  return topic;
}

export function addReply(input: {
  topic_id: string;
  content: string;
  author_id?: string;
  author_name?: string;
  author_role?: ForumReply["author_role"];
}) {
  const store = getCommunity();
  const topic = store.topics.find((t) => t.topic_id === input.topic_id);
  if (!topic) return null;

  const reply: ForumReply = {
    reply_id: `rp_${Date.now()}`,
    topic_id: input.topic_id,
    author_id: input.author_id ?? "demo-student",
    author_name: input.author_name ?? "演示学员",
    author_role: input.author_role ?? "student",
    content: input.content.trim(),
    created_at: new Date().toISOString(),
  };
  store.replies.push(reply);
  topic.reply_count += 1;
  topic.hot += 3;
  return reply;
}

export function listHighlights() {
  return [...getCommunity().highlights].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.created_at.localeCompare(a.created_at);
  });
}

export function pinHighlight(highlightId: string, pinned = true) {
  const item = getCommunity().highlights.find(
    (h) => h.highlight_id === highlightId,
  );
  if (!item) return null;
  item.pinned = pinned;
  return item;
}

/** 回灌答疑知识库（演示：标记 + 可挂到 escalation/问答回流） */
export function refluxHighlight(highlightId: string) {
  const item = getCommunity().highlights.find(
    (h) => h.highlight_id === highlightId,
  );
  if (!item) return null;
  item.refluxed = true;
  item.pinned = true;
  return {
    highlight: item,
    kb_note: `已写入答疑知识库索引：${item.title}`,
  };
}

export function promoteTopicToHighlight(topicId: string) {
  const store = getCommunity();
  const topic = store.topics.find((t) => t.topic_id === topicId);
  if (!topic) return null;
  const existing = store.highlights.find((h) => h.source_topic_id === topicId);
  if (existing) return existing;

  const item: HighlightItem = {
    highlight_id: `hl_${Date.now()}`,
    title: topic.title.slice(0, 40),
    excerpt: topic.body.slice(0, 120),
    tags: topic.tags.slice(0, 3),
    source_topic_id: topic.topic_id,
    pinned: false,
    refluxed: false,
    created_at: new Date().toISOString(),
  };
  store.highlights.unshift(item);
  return item;
}
