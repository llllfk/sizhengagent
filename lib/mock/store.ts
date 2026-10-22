import type {
  QaEscalation,
  QaSession,
  QuestionType,
  StudentProfile,
} from "@/types";

export type MockMessage = {
  role: "ai" | "student";
  content: string;
  at: string;
};

export type MockSession = QaSession & {
  question: string;
  round: number;
  messages: MockMessage[];
};

type Store = {
  students: StudentProfile[];
  sessions: MockSession[];
  escalations: QaEscalation[];
};

function seed(): Store {
  const now = new Date().toISOString();
  return {
    students: [
      {
        student_id: "S2026001",
        name: "林晓航",
        type_tag: "expression",
        cognition_level: 2,
        weak_points: ["服务边界", "应急沟通"],
        updated_at: now,
      },
      {
        student_id: "S2026008",
        name: "陈思远",
        type_tag: "creation",
        cognition_level: 3,
        weak_points: ["价值权衡"],
        updated_at: now,
      },
      {
        student_id: "S2026015",
        name: "周予安",
        type_tag: "experience",
        cognition_level: 2,
        weak_points: ["客舱秩序", "人民至上落地"],
        updated_at: now,
      },
      {
        student_id: "demo-student",
        name: "演示学员",
        type_tag: "creation",
        cognition_level: 2,
        weak_points: ["职业伦理"],
        updated_at: now,
      },
    ],
    sessions: [],
    escalations: [
      {
        escalation_id: "esc_seed_1",
        session_id: "qs_seed_1",
        student_id: "S2026001",
        summary:
          "旅客坚持带超规随身行李登机，学员追问「人情与规则」两轮后仍无法形成可执行预案，请求专题答疑。",
        created_at: new Date(Date.now() - 36e5).toISOString(),
        teacher_status: "pending",
      },
      {
        escalation_id: "esc_seed_2",
        session_id: "qs_seed_2",
        student_id: "S2026015",
        summary:
          "颠簸中旅客拒绝回座，涉及安全指令与沟通温度；AI 判定为高敏感价值情境，建议教师介入。",
        created_at: new Date(Date.now() - 72e5).toISOString(),
        teacher_status: "accepted",
      },
    ],
  };
}

const g = globalThis as unknown as { __qihangMock?: Store };

export function getStore(): Store {
  if (!g.__qihangMock) {
    g.__qihangMock = seed();
  }
  return g.__qihangMock;
}

export function resetStore() {
  g.__qihangMock = seed();
  return g.__qihangMock;
}

export function findStudent(studentId: string) {
  return getStore().students.find((s) => s.student_id === studentId);
}

export function createSession(input: {
  student_id: string;
  question: string;
  q_type: QuestionType;
  firstPrompt: string;
}): MockSession {
  const store = getStore();
  const session: MockSession = {
    session_id: `qs_${Date.now()}`,
    student_id: input.student_id,
    q_type: input.q_type,
    question: input.question,
    round: 0,
    followup_chain: [{ role: "ai", content: input.firstPrompt }],
    messages: [
      {
        role: "student",
        content: input.question,
        at: new Date().toISOString(),
      },
      { role: "ai", content: input.firstPrompt, at: new Date().toISOString() },
    ],
    status: "open",
  };
  store.sessions.unshift(session);
  return session;
}

export function getSession(sessionId: string) {
  return getStore().sessions.find((s) => s.session_id === sessionId);
}

export function appendFollowup(
  sessionId: string,
  studentAnswer: string,
  aiPrompt: string,
  escalate: boolean,
) {
  const session = getSession(sessionId);
  if (!session) return null;
  session.round += 1;
  session.messages.push(
    { role: "student", content: studentAnswer, at: new Date().toISOString() },
    { role: "ai", content: aiPrompt, at: new Date().toISOString() },
  );
  session.followup_chain.push(
    { role: "student", content: studentAnswer },
    { role: "ai", content: aiPrompt },
  );
  if (escalate) session.status = "escalated";
  return session;
}

export function createEscalation(input: {
  session_id: string;
  student_id: string;
  summary: string;
}): QaEscalation {
  const store = getStore();
  const item: QaEscalation = {
    escalation_id: `esc_${Date.now()}`,
    session_id: input.session_id,
    student_id: input.student_id,
    summary: input.summary,
    created_at: new Date().toISOString(),
    teacher_status: "pending",
  };
  store.escalations.unshift(item);
  const session = getSession(input.session_id);
  if (session) session.status = "escalated";
  return item;
}

export function updateEscalationStatus(
  escalationId: string,
  status: QaEscalation["teacher_status"],
) {
  const item = getStore().escalations.find(
    (e) => e.escalation_id === escalationId,
  );
  if (!item) return null;
  item.teacher_status = status;
  return item;
}

export function workbenchStats() {
  const store = getStore();
  return {
    pending_escalations: store.escalations.filter(
      (e) => e.teacher_status === "pending",
    ).length,
    open_sessions: store.sessions.filter((s) => s.status === "open").length,
    students: store.students.length,
    type_dist: {
      expression: store.students.filter((s) => s.type_tag === "expression")
        .length,
      creation: store.students.filter((s) => s.type_tag === "creation").length,
      experience: store.students.filter((s) => s.type_tag === "experience")
        .length,
    },
  };
}
