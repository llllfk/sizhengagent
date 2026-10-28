/** 学情画像思维类型 */
export type StudentTypeTag =
  | "untyped"
  | "expression"
  | "creation"
  | "experience"
  | "deliberation"
  | "inquiry";

export type QuestionType = "knowledge" | "scenario" | "value";

export type InteractiveMode =
  | "cabin"
  | "script"
  | "wordcard"
  | "quiz"
  | "debate";

export interface StudentProfile {
  student_id: string;
  name: string;
  type_tag: StudentTypeTag;
  cognition_level: number;
  weak_points: string[];
  class_id?: string | null;
  class_name?: string | null;
  class_code?: string | null;
  updated_at: string;
}

export interface ClassGroup {
  class_id: string;
  name: string;
  code: string;
  remark: string;
  created_by?: string | null;
  student_count: number;
  created_at: string;
  updated_at: string;
}

export interface QaSession {
  session_id: string;
  student_id: string;
  q_type: QuestionType;
  followup_chain: Array<{ role: "ai" | "student" | "teacher"; content: string }>;
  answer_ref?: string;
  status: "open" | "resolved" | "escalated";
}

export interface QaEscalation {
  escalation_id: string;
  session_id: string;
  student_id: string;
  summary: string;
  created_at: string;
  teacher_status: "pending" | "accepted" | "scheduled" | "done";
  teacher_reply?: string;
  teacher_name?: string;
  teacher_replied_at?: string;
}

export interface CabinCase {
  case_id: string;
  scenario: string;
  difficulty: number;
  emergency_level: number;
  solution: string;
  source: "real" | "simulation";
}

export interface InteractiveContent {
  content_id: string;
  type: "script" | "wordcard" | "quiz";
  title: string;
  body: string;
  source: "relay" | "teacher";
  created_by: string;
}

export interface WorkItem {
  work_id: string;
  student_id: string;
  group_id?: string;
  type: "short_video" | "interview" | "micro_film";
  file_url: string;
  award_level?: string;
  created_at: string;
}

/** 研讨社区 · 议题来源（对齐 PostgreSQL forum_topic.source） */
export type ForumSource = "debate" | "escalation" | "manual";

export type CommunityRole = "student" | "teacher";

export interface ForumReply {
  reply_id: string;
  topic_id: string;
  author_id: string;
  author_name: string;
  author_role: CommunityRole;
  content: string;
  created_at: string;
}

export interface ForumTopic {
  topic_id: string;
  title: string;
  body: string;
  source: ForumSource;
  source_ref?: string;
  tags: string[];
  author_id: string;
  author_name: string;
  author_role: CommunityRole;
  reply_count: number;
  hot: number;
  pinned: boolean;
  created_at: string;
}

export interface HighlightItem {
  highlight_id: string;
  title: string;
  excerpt: string;
  tags: string[];
  source_topic_id?: string;
  pinned: boolean;
  /** 是否已回灌答疑知识库 */
  refluxed: boolean;
  created_at: string;
}

export interface ApiOk<T> {
  data: T;
}

export interface ApiErr {
  error: string;
}
