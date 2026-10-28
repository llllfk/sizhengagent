import type { StudentTypeTag } from "@/types";

export type FormedTypeTag = Exclude<StudentTypeTag, "untyped">;

export const TYPE_TAGS: FormedTypeTag[] = [
  "expression",
  "creation",
  "experience",
  "deliberation",
  "inquiry",
];

export const TYPE_LABEL: Record<StudentTypeTag, string> = {
  untyped: "未形成",
  expression: "表达型",
  creation: "创作型",
  experience: "体验型",
  deliberation: "思辨型",
  inquiry: "探究型",
};

export const TYPE_HINT: Record<StudentTypeTag, string> = {
  untyped: "完成答疑 / 闯关 / 任务后再生成",
  expression: "采访 · 发言 · 论坛",
  creation: "微电影 · 短视频",
  experience: "行走 · 情景演练",
  deliberation: "评理者 · 横向论证",
  inquiry: "钻研者 · 纵向深挖",
};

export const TYPE_ROLE: Record<StudentTypeTag, string> = {
  untyped: "待生成",
  expression: "表达者",
  creation: "创作者",
  experience: "体验者",
  deliberation: "评理者",
  inquiry: "钻研者",
};

export const TYPE_TRAIT: Record<StudentTypeTag, string> = {
  untyped: "尚未形成思维画像",
  expression: "敢开口 · 善转述 · 会带动课堂声音",
  creation: "会成像 · 能成片 · 把价值做成可展示作品",
  experience: "肯下场 · 能观察 · 从现场把思政走出来",
  deliberation: "爱追问 · 重证据 · 析逻辑",
  inquiry: "好奇心强 · 爱提问 · 深钻研",
};

export const TYPE_IDENTIFY: Record<StudentTypeTag, string> = {
  untyped: "先参与课堂，再由系统根据真实行为生成。",
  expression: "问卷爱发言、访谈；课堂上抢麦转述观点。",
  creation: "爱镜头与脚本，作业爱做成片、海报、分镜。",
  experience: "爱走动观察，笔记里多现场细节少抽象概念。",
  deliberation:
    "初诊爱反问「凭什么/依据是什么」；评价型问题多；问卷勾选喜欢讨论争议；课堂上拾答但爱反驳标准答案。",
  inquiry:
    "提问数量多，「为什么/还有吗/怎么来的」穷追不舍；求知型问题多；问卷勾选查资料、刨根问底；笔记全、课后追着问。",
};

export const TYPE_IN_CLASS: Record<StudentTypeTag, string> = {
  untyped: "学伴答疑、课中五式、分层任务均可作为生成画像的入口。",
  expression: "街头采访口述、论坛发帖、课中发言接龙。",
  creation: "AI短视频工坊、微电影选题、分镜成片。",
  experience: "行走的思政课、客舱情景模拟、现场观察笔记。",
  deliberation:
    "课堂辩论（主辩/质询/结辩）、闯关「追问环节」、AI剧本冲突论证。",
  inquiry:
    "一句话AI剧本（探索剧情走向）、课堂辩论查证反驳、客舱情景模拟找预案漏洞。",
};

export const TYPE_AFTER: Record<StudentTypeTag, string> = {
  untyped: "完成一次真实操作后再推送分层任务。",
  expression: "采访成稿、论坛发帖带动讨论。",
  creation: "短视频脚本→分镜→成片归档。",
  experience: "航站楼/校园观察笔记与行走任务。",
  deliberation:
    "论坛议题发起+写论证帖，对AI追问到底，辩论赛备赛。",
  inquiry:
    "客舱案例库调研、深度提问升级问题清单、考证型脚本先查证再创作。",
};

export type TypeDist = Record<FormedTypeTag, number>;

export function emptyTypeDist(): TypeDist {
  return {
    expression: 0,
    creation: 0,
    experience: 0,
    deliberation: 0,
    inquiry: 0,
  };
}

export function typeDistOf(students: { type_tag: string }[]): TypeDist {
  const d = emptyTypeDist();
  for (const s of students) {
    if (TYPE_TAGS.includes(s.type_tag as StudentTypeTag)) {
      d[s.type_tag as StudentTypeTag] += 1;
    }
  }
  return d;
}

export function typeDistTotal(d: TypeDist) {
  return TYPE_TAGS.reduce((n, k) => n + (d[k] ?? 0), 0);
}

export function isFormedType(tag: string | null | undefined): tag is FormedTypeTag {
  return Boolean(tag && TYPE_TAGS.includes(tag as FormedTypeTag));
}

/** 画像形成后的五型雷达底轮廓（未形成时不套用） */
export const TYPE_RADAR_SHAPE: Record<FormedTypeTag, Record<string, number>> = {
  expression: {
    expression: 36,
    creation: 4,
    experience: 8,
    deliberation: 14,
    inquiry: 6,
  },
  creation: {
    expression: 6,
    creation: 36,
    experience: 8,
    deliberation: 6,
    inquiry: 10,
  },
  experience: {
    expression: 8,
    creation: 6,
    experience: 36,
    deliberation: 6,
    inquiry: 12,
  },
  deliberation: {
    expression: 12,
    creation: 4,
    experience: 6,
    deliberation: 38,
    inquiry: 14,
  },
  inquiry: {
    expression: 6,
    creation: 8,
    experience: 12,
    deliberation: 14,
    inquiry: 38,
  },
};
