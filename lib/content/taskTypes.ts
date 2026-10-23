import type { StudentTypeTag } from "@/types";

export type TaskStatus = "todo" | "doing" | "done";

export type LayeredTask = {
  task_id: string;
  student_id: string;
  type_tag: StudentTypeTag;
  title: string;
  type: "interview" | "short_video" | "field_trip";
  brief: string;
  status: TaskStatus;
  progress: number;
  assigned_at: string;
  updated_at: string;
};

export type VideoProject = {
  project_id: string;
  student_id: string;
  theme: string;
  value_point: string;
  script?: string;
  storyboard?: string;
  subtitle_note?: string;
  file_uri?: string;
  step: 1 | 2 | 3 | 4;
  updated_at: string;
};

export type WorkArchive = {
  work_id: string;
  student_id: string;
  type: string;
  title: string;
  file_uri: string;
  award_level: string | null;
  created_at: string;
};
