import {
  matchCabinCases,
  type CabinCaseSeed,
} from "@/lib/content/cabinCasesAssembly";
import {
  KNOWLEDGE_CORPUS,
  matchKnowledgeSnippets,
  type KnowledgeKind,
  type KnowledgeSnippet,
} from "@/lib/content/knowledgeCorpus";

export type RetrievalHit = {
  id: string;
  library: "knowledge" | "cabin";
  kind_label: string;
  title: string;
  quote: string;
  source: string;
};

const KIND_LABEL: Record<KnowledgeKind, string> = {
  safety_case: "安全案例",
  policy: "政策文件",
  dialectic: "辩证思维",
  craftsmanship: "工匠精神",
};

/** 习著作选读：论述摘编等（侧栏需置顶展示） */
function isXiWorks(s: KnowledgeSnippet) {
  return /习近平|论述摘编|著作选读/.test(s.source_file + s.source_note);
}

function fromKnowledge(s: KnowledgeSnippet): RetrievalHit {
  return {
    id: s.snippet_id,
    library: "knowledge",
    kind_label: isXiWorks(s)
      ? "习著作"
      : (KIND_LABEL[s.kind] ?? "答疑知识库"),
    title: s.title,
    quote: s.teaching_point || s.summary.slice(0, 72),
    source: s.source_note || s.source_file,
  };
}

function fromCabin(c: CabinCaseSeed): RetrievalHit {
  return {
    id: c.case_id,
    library: "cabin",
    kind_label: "客舱案例",
    title: c.title,
    quote: c.focus || c.scenario.slice(0, 72),
    source: c.meta?.assembly_ref || c.meta?.source_note || "客舱案例库",
  };
}

function pushUnique(
  out: RetrievalHit[],
  seen: Set<string>,
  hits: RetrievalHit[],
  limit: number,
) {
  for (const h of hits) {
    if (seen.has(h.id)) continue;
    seen.add(h.id);
    out.push(h);
    if (out.length >= limit) break;
  }
}

/** 习著作置顶条（人民至上相关优先） */
function pinXiWorksHit(): RetrievalHit {
  const xi =
    KNOWLEDGE_CORPUS.find((s) => s.snippet_id === "kb_dream_people") ??
    KNOWLEDGE_CORPUS.find(
      (s) => isXiWorks(s) && /人民/.test(s.title + s.summary),
    ) ??
    KNOWLEDGE_CORPUS.find((s) => isXiWorks(s))!;
  return fromKnowledge(xi);
}

/**
 * 答疑检索：知识库 + 客舱案例库。
 * 右侧第一条永远是习著作知识库。
 */
export function retrieveForQuestion(question: string, limit = 4): RetrievalHit[] {
  const seen = new Set<string>();
  const out: RetrievalHit[] = [];
  pushUnique(out, seen, [pinXiWorksHit()], limit);

  const kb = matchKnowledgeSnippets(question, 4).map(fromKnowledge);
  const cabin = matchCabinCases(question, 2).map(fromCabin);
  pushUnique(out, seen, [...kb, ...cabin], limit);

  if (out.length < 2) {
    pushUnique(
      out,
      seen,
      [
        ...matchKnowledgeSnippets("安全 红线 人民至上", 2).map(fromKnowledge),
        ...matchCabinCases("旅客 纠纷 安全", 1).map(fromCabin),
      ],
      limit,
    );
  }
  return out;
}

/**
 * 固定脚本侧栏：仍保证第一条习著作，其后按轮次关键词补充
 */
export function retrieveForFixedScript(opts: {
  scriptIndex: number;
  query: string;
  limit?: number;
}): RetrievalHit[] {
  const limit = opts.limit ?? 4;
  const extra =
    opts.scriptIndex === 0
      ? "人民至上 生命至上 我将无我"
      : opts.scriptIndex === 1
        ? "东航 下跪 服务边界 人格尊严 民用航空法"
        : opts.scriptIndex === 2
          ? "客舱冲突 报告 取证 安全红线 第171条 处置"
          : "人民至上 服务边界 履职";
  return retrieveForQuestion(`${opts.query} ${extra}`, limit);
}
