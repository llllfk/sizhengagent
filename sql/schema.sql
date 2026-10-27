-- 「启航」思政智能体 · 核心表结构（PostgreSQL）
-- 最终生产库：PostgreSQL（DATABASE_URL）。字段形状与本文件对齐。
-- 在 Coze / 自建 PG 启用后执行；字段可按联调再细化。

-- 1. 学情库
CREATE TABLE IF NOT EXISTS student_profile (
  id BIGSERIAL PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  type_tag VARCHAR(32) NOT NULL CHECK (type_tag IN ('expression', 'creation', 'experience')),
  cognition_level INT DEFAULT 1,
  weak_points JSONB DEFAULT '[]',
  preference JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. 答疑知识库
CREATE TABLE IF NOT EXISTS qa_session (
  id BIGSERIAL PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL UNIQUE,
  student_id VARCHAR(64) NOT NULL,
  q_type VARCHAR(32) NOT NULL,
  question TEXT,
  followup_chain JSONB DEFAULT '[]',
  answer_ref TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 兼容已建库
ALTER TABLE qa_session ADD COLUMN IF NOT EXISTS question TEXT;
ALTER TABLE qa_session ADD COLUMN IF NOT EXISTS coze_conversation_id VARCHAR(64);

CREATE TABLE IF NOT EXISTS qa_escalation (
  id BIGSERIAL PRIMARY KEY,
  escalation_id VARCHAR(64) NOT NULL UNIQUE,
  session_id VARCHAR(64) NOT NULL,
  student_id VARCHAR(64) NOT NULL,
  summary TEXT NOT NULL,
  teacher_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. 互动内容库
CREATE TABLE IF NOT EXISTS interactive_content (
  id BIGSERIAL PRIMARY KEY,
  content_id VARCHAR(64) NOT NULL UNIQUE,
  type VARCHAR(32) NOT NULL CHECK (type IN ('script', 'wordcard', 'quiz')),
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  source VARCHAR(32) NOT NULL CHECK (source IN ('relay', 'teacher')),
  created_by VARCHAR(64),
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. 客舱案例库
CREATE TABLE IF NOT EXISTS cabin_case (
  id BIGSERIAL PRIMARY KEY,
  case_id VARCHAR(64) NOT NULL UNIQUE,
  title VARCHAR(200),
  category VARCHAR(64),
  scenario TEXT NOT NULL,
  roles JSONB DEFAULT '[]',
  focus TEXT,
  difficulty INT DEFAULT 1,
  emergency_level INT DEFAULT 1,
  solution TEXT,
  source VARCHAR(32) NOT NULL CHECK (source IN ('real', 'simulation')),
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE cabin_case ADD COLUMN IF NOT EXISTS title VARCHAR(200);
ALTER TABLE cabin_case ADD COLUMN IF NOT EXISTS category VARCHAR(64);
ALTER TABLE cabin_case ADD COLUMN IF NOT EXISTS roles JSONB DEFAULT '[]';
ALTER TABLE cabin_case ADD COLUMN IF NOT EXISTS focus TEXT;
ALTER TABLE cabin_case ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}';

-- 5. 作品成果库
CREATE TABLE IF NOT EXISTS work (
  id BIGSERIAL PRIMARY KEY,
  work_id VARCHAR(64) NOT NULL UNIQUE,
  student_id VARCHAR(64) NOT NULL,
  group_id VARCHAR(64),
  type VARCHAR(32) NOT NULL,
  file_uri TEXT NOT NULL,
  award_level VARCHAR(64),
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. 研讨社区（议题 / 跟帖 / 精华 · 回灌答疑库）
CREATE TABLE IF NOT EXISTS forum_topic (
  id BIGSERIAL PRIMARY KEY,
  topic_id VARCHAR(64) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  source VARCHAR(32) NOT NULL CHECK (source IN ('debate', 'escalation', 'manual')),
  source_ref VARCHAR(64),
  tags JSONB DEFAULT '[]',
  author_id VARCHAR(64) NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  author_role VARCHAR(16) NOT NULL CHECK (author_role IN ('student', 'teacher')),
  reply_count INT NOT NULL DEFAULT 0,
  hot INT NOT NULL DEFAULT 0,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forum_reply (
  id BIGSERIAL PRIMARY KEY,
  reply_id VARCHAR(64) NOT NULL UNIQUE,
  topic_id VARCHAR(64) NOT NULL REFERENCES forum_topic (topic_id) ON DELETE CASCADE,
  author_id VARCHAR(64) NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  author_role VARCHAR(16) NOT NULL CHECK (author_role IN ('student', 'teacher')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS highlight (
  id BIGSERIAL PRIMARY KEY,
  highlight_id VARCHAR(64) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  excerpt TEXT NOT NULL,
  tags JSONB DEFAULT '[]',
  source_topic_id VARCHAR(64) REFERENCES forum_topic (topic_id) ON DELETE SET NULL,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  refluxed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. 分层任务 / 短视频工坊进度
CREATE TABLE IF NOT EXISTS layered_task (
  id BIGSERIAL PRIMARY KEY,
  task_id VARCHAR(64) NOT NULL UNIQUE,
  student_id VARCHAR(64) NOT NULL,
  type_tag VARCHAR(32) NOT NULL,
  title VARCHAR(200) NOT NULL,
  type VARCHAR(32) NOT NULL,
  brief TEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'todo',
  progress INT NOT NULL DEFAULT 0,
  assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS video_project (
  id BIGSERIAL PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL UNIQUE,
  student_id VARCHAR(64) NOT NULL UNIQUE,
  theme TEXT DEFAULT '',
  value_point TEXT DEFAULT '',
  script TEXT,
  storyboard TEXT,
  subtitle_note TEXT,
  file_uri TEXT,
  step INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. 登录账号（教师 / 学生）
CREATE TABLE IF NOT EXISTS app_user (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL UNIQUE,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(16) NOT NULL CHECK (role IN ('teacher', 'student')),
  display_name VARCHAR(100) NOT NULL,
  student_id VARCHAR(64),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_qa_session_student ON qa_session (student_id);
CREATE INDEX IF NOT EXISTS idx_escalation_status ON qa_escalation (teacher_status);
CREATE INDEX IF NOT EXISTS idx_work_student ON work (student_id);
CREATE INDEX IF NOT EXISTS idx_forum_topic_hot ON forum_topic (pinned DESC, hot DESC);
CREATE INDEX IF NOT EXISTS idx_forum_reply_topic ON forum_reply (topic_id);
CREATE INDEX IF NOT EXISTS idx_highlight_pinned ON highlight (pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_layered_task_student ON layered_task (student_id);
CREATE INDEX IF NOT EXISTS idx_app_user_role ON app_user (role);

-- 9. 答疑知识库语料（精选短条目，非全文）
CREATE TABLE IF NOT EXISTS knowledge_snippet (
  id BIGSERIAL PRIMARY KEY,
  snippet_id VARCHAR(64) NOT NULL UNIQUE,
  kind VARCHAR(32) NOT NULL,
  title VARCHAR(200) NOT NULL,
  summary TEXT NOT NULL,
  teaching_point TEXT NOT NULL,
  keywords JSONB DEFAULT '[]',
  source_file VARCHAR(200),
  source_note VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_knowledge_kind ON knowledge_snippet (kind);

-- 10. 成果库成片目录（元数据；mp4 本体在 public/works/gallery 或 WORKS_VIDEO_DIR）
CREATE TABLE IF NOT EXISTS work_gallery (
  id BIGSERIAL PRIMARY KEY,
  clip_id VARCHAR(64) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  award VARCHAR(100) NOT NULL,
  tag VARCHAR(64) NOT NULL,
  size_variant VARCHAR(16) NOT NULL,
  source_file TEXT NOT NULL,
  file_uri TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_work_gallery_sort ON work_gallery (sort_order, clip_id);

-- 11. 学情问题清单（课中闯关错题 / 答疑回流等）
CREATE TABLE IF NOT EXISTS learning_issue (
  id BIGSERIAL PRIMARY KEY,
  issue_id VARCHAR(64) NOT NULL UNIQUE,
  student_id VARCHAR(64) NOT NULL,
  source VARCHAR(32) NOT NULL DEFAULT 'quiz',
  title VARCHAR(200) NOT NULL,
  detail TEXT NOT NULL,
  weak_tag VARCHAR(64),
  status VARCHAR(16) NOT NULL DEFAULT 'open',
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_learning_issue_student ON learning_issue (student_id, status);
CREATE INDEX IF NOT EXISTS idx_learning_issue_open ON learning_issue (status, created_at DESC);

-- 12. 班级管理（学生归属班级；教师 CRUD）
CREATE TABLE IF NOT EXISTS class_group (
  id BIGSERIAL PRIMARY KEY,
  class_id VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(32) NOT NULL UNIQUE,
  remark TEXT DEFAULT '',
  created_by VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE student_profile ADD COLUMN IF NOT EXISTS class_id VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_class_group_code ON class_group (code);
CREATE INDEX IF NOT EXISTS idx_student_profile_class ON student_profile (class_id);
