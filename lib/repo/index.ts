/**
 * 数据门面：仅 PostgreSQL（DATABASE_URL）。
 * 未配置数据库时不回落 Mock，由 API 返回 503。
 * 课中五式房间为进程内实时状态。
 */
import { hasDb } from "@/lib/db";
import { ensurePg } from "@/lib/repo/ensure";
import * as pg from "@/lib/repo/pg";
import type { QuestionType, StudentTypeTag } from "@/types";
import type { LayeredTask } from "@/lib/content/taskTypes";

export class DbUnavailableError extends Error {
  constructor(message = "数据库未配置或不可用") {
    super(message);
    this.name = "DbUnavailableError";
  }
}

async function requirePg() {
  if (!hasDb()) throw new DbUnavailableError("未配置 DATABASE_URL");
  // 库已就绪：默认不建表不灌数；仅 QI_HANG_ENSURE_PG=1 时走完整 ensure
  const ok = await ensurePg();
  if (!ok) throw new DbUnavailableError("数据库不可用");
}

export function dataSourceLabel() {
  return hasDb() ? "postgres" : "unavailable";
}

export async function findStudent(studentId: string) {
  await requirePg();
  return pg.pgFindStudent(studentId);
}

export async function listStudents() {
  await requirePg();
  return pg.pgListStudents();
}

export async function updateStudentType(
  studentId: string,
  typeTag: StudentTypeTag,
) {
  await requirePg();
  return pg.pgUpdateStudentType(studentId, typeTag);
}

export async function createSession(input: {
  student_id: string;
  question: string;
  q_type: QuestionType;
  firstPrompt: string;
  coze_conversation_id?: string | null;
}) {
  await requirePg();
  return pg.pgCreateSession(input);
}

export async function setCozeConversationId(
  sessionId: string,
  conversationId: string,
) {
  await requirePg();
  return pg.pgSetCozeConversationId(sessionId, conversationId);
}

export async function getSession(sessionId: string) {
  await requirePg();
  return pg.pgGetSession(sessionId);
}

export async function appendFollowup(
  sessionId: string,
  studentAnswer: string,
  aiPrompt: string,
  escalate: boolean,
) {
  await requirePg();
  return pg.pgAppendFollowup(sessionId, studentAnswer, aiPrompt, escalate);
}

export async function createEscalation(input: {
  session_id: string;
  student_id: string;
  summary: string;
}) {
  await requirePg();
  return pg.pgCreateEscalation(input);
}

export async function listEscalations() {
  await requirePg();
  const list = await pg.pgListEscalations();
  const students = await pg.pgListStudents();
  return list.map((e) => {
    const stu = students.find((s) => s.student_id === e.student_id);
    return {
      ...e,
      student_name: e.student_name || stu?.name || e.student_id,
      class_name: e.class_name || stu?.class_name,
    };
  });
}

export async function updateEscalationStatus(
  escalationId: string,
  status: "pending" | "accepted" | "scheduled" | "done",
) {
  await requirePg();
  return pg.pgUpdateEscalationStatus(escalationId, status);
}

export async function replyEscalation(input: {
  escalation_id: string;
  reply: string;
  teacher_name: string;
}) {
  await requirePg();
  return pg.pgReplyEscalation(input);
}

export async function listStudentEscalations(studentId: string) {
  await requirePg();
  return pg.pgListEscalations(studentId);
}

export async function getQaSession(sessionId: string) {
  await requirePg();
  return pg.pgGetSession(sessionId);
}

export async function workbenchStats() {
  await requirePg();
  return pg.pgWorkbenchStats();
}

export async function listTopics() {
  await requirePg();
  return pg.pgListTopics();
}

export async function getTopic(topicId: string) {
  await requirePg();
  return pg.pgGetTopic(topicId);
}

export async function listReplies(topicId: string) {
  await requirePg();
  return pg.pgListReplies(topicId);
}

export async function createTopic(
  input: Parameters<typeof pg.pgCreateTopic>[0],
) {
  await requirePg();
  return pg.pgCreateTopic(input);
}

export async function addReply(input: Parameters<typeof pg.pgAddReply>[0]) {
  await requirePg();
  return pg.pgAddReply(input);
}

export async function getReply(replyId: string) {
  await requirePg();
  return pg.pgGetReply(replyId);
}

export async function deleteReply(replyId: string) {
  await requirePg();
  return pg.pgDeleteReply(replyId);
}

export async function deleteTopic(topicId: string) {
  await requirePg();
  return pg.pgDeleteTopic(topicId);
}

export async function listHighlights() {
  await requirePg();
  return pg.pgListHighlights();
}

export async function pinHighlight(id: string, pinned = true) {
  await requirePg();
  return pg.pgPinHighlight(id, pinned);
}

export async function refluxHighlight(id: string) {
  await requirePg();
  return pg.pgRefluxHighlight(id);
}

export async function promoteTopicToHighlight(topicId: string) {
  await requirePg();
  return pg.pgPromoteTopicToHighlight(topicId);
}

export async function listTasks(studentId?: string) {
  await requirePg();
  return pg.pgListTasks(studentId);
}

export async function assignTask(studentId: string, typeTag?: StudentTypeTag) {
  await requirePg();
  return pg.pgAssignTask(studentId, typeTag);
}

export async function updateTask(
  taskId: string,
  patch: Partial<Pick<LayeredTask, "status" | "progress">>,
) {
  await requirePg();
  return pg.pgUpdateTask(taskId, patch);
}

export async function getOrCreateVideo(studentId: string) {
  await requirePg();
  return pg.pgGetOrCreateVideo(studentId);
}

export async function saveVideoStep(
  studentId: string,
  input: Parameters<typeof pg.pgSaveVideoStep>[1],
) {
  await requirePg();
  return pg.pgSaveVideoStep(studentId, input);
}

export async function archiveWork(input: {
  student_id: string;
  type: string;
  title: string;
  file_uri: string;
}) {
  await requirePg();
  return pg.pgArchiveWork(input);
}

export async function listWorks(studentId?: string) {
  await requirePg();
  return pg.pgListWorks(studentId);
}

export async function analyticsBundle() {
  await requirePg();
  return pg.pgAnalyticsBundle();
}

export async function weeklyReportDraft() {
  await requirePg();
  return pg.pgWeeklyReportDraft();
}

export async function listCabinCases() {
  await requirePg();
  return pg.pgListCabinCases();
}

export async function upsertCabinCase(
  input: Parameters<typeof pg.pgUpsertCabinCase>[0],
) {
  await requirePg();
  return pg.pgUpsertCabinCase(input);
}

export async function listKnowledgeSnippets(kind?: string) {
  await requirePg();
  return pg.pgListKnowledgeSnippets(kind);
}

export async function upsertKnowledgeSnippet(
  input: Parameters<typeof pg.pgUpsertKnowledgeSnippet>[0],
) {
  await requirePg();
  return pg.pgUpsertKnowledgeSnippet(input);
}

export async function listWorkGallery() {
  await requirePg();
  return pg.pgListWorkGallery();
}

export async function applyQuizResult(
  input: Parameters<typeof pg.pgApplyQuizResult>[0],
) {
  await requirePg();
  return pg.pgApplyQuizResult(input);
}

export async function listLearningIssues(
  studentId?: string,
  status: "open" | "done" | "all" = "open",
) {
  await requirePg();
  return pg.pgListLearningIssues(studentId, status);
}

export {
  listClasses,
  getClass,
  listClassMembers,
  createClass,
  updateClass,
  deleteClass,
  setClassMembers,
  assignStudentClass,
} from "@/lib/repo/classes";
