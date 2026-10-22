-- 「启航」思政智能体 · 核心表结构（PostgreSQL）
-- 最终生产库：PostgreSQL（DATABASE_URL）。本地演示现用 Mock，字段形状与本文件对齐。
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
  followup_chain JSONB DEFAULT '[]',
  answer_ref TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

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
  scenario TEXT NOT NULL,
  difficulty INT DEFAULT 1,
  emergency_level INT DEFAULT 1,
  solution TEXT,
  source VARCHAR(32) NOT NULL CHECK (source IN ('real', 'simulation')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

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

CREATE INDEX IF NOT EXISTS idx_qa_session_student ON qa_session (student_id);
CREATE INDEX IF NOT EXISTS idx_escalation_status ON qa_escalation (teacher_status);
CREATE INDEX IF NOT EXISTS idx_work_student ON work (student_id);
CREATE INDEX IF NOT EXISTS idx_forum_topic_hot ON forum_topic (pinned DESC, hot DESC);
CREATE INDEX IF NOT EXISTS idx_forum_reply_topic ON forum_reply (topic_id);
CREATE INDEX IF NOT EXISTS idx_highlight_pinned ON highlight (pinned DESC, created_at DESC);
