import {
  matchCabinCases,
  type CabinCaseSeed,
} from "@/lib/content/cabinCasesAssembly";
import {
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

function fromKnowledge(s: KnowledgeSnippet): RetrievalHit {
  return {
    id: s.snippet_id,
    library: "knowledge",
    kind_label: KIND_LABEL[s.kind] ?? "答疑知识库",
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

/** 答疑检索：知识库 + 客舱案例库，供侧栏「命中可见」 */
export function retrieveForQuestion(question: string, limit = 4): RetrievalHit[] {
  const kb = matchKnowledgeSnippets(question, 3).map(fromKnowledge);
  const cabin = matchCabinCases(question, 2).map(fromCabin);

  // 情境题优先穿插案例；知识/价值题优先知识库
  const merged = [...kb, ...cabin];
  const seen = new Set<string>();
  const out: RetrievalHit[] = [];
  for (const h of merged) {
    if (seen.has(h.id)) continue;
    seen.add(h.id);
    out.push(h);
    if (out.length >= limit) break;
  }

  // 无关键词命中时给演示兜底，避免侧栏空白
  if (out.length === 0) {
    const fallbackKb = matchKnowledgeSnippets("安全 红线 人民至上", 2).map(
      fromKnowledge,
    );
    const fallbackCabin = matchCabinCases("旅客 纠纷 安全", 1).map(fromCabin);
    return [...fallbackKb, ...fallbackCabin].slice(0, 3);
  }
  return out;
}
