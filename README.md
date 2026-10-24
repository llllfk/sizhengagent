# 启航 · 思政智能体（qihang-agent）

面向高职空乘专业思政课的「人工智能+」教学智能体。  
技术形态遵循 **Coze AI 编程规范**：Next.js 15 App Router + TypeScript + Tailwind CSS 4。

## 三端入口

| 端 | 路径前缀 | 说明 |
|----|----------|------|
| 学生智能学伴 | `/companion` 等 | 答疑 · 课中五式 · 分层任务 · 短视频工坊 |
| 教师智能工作台 | `/workbench` 等 | 转接队列 · 互动调度 · 学情看板 · 周报 |
| 师生研讨社区 | `/forum` 等 | 议题 · 跟帖 · 精华集 · 回灌答疑库 |

## 目录位置

本工程代码位于仓库根目录下的 `代码/` 文件夹；文档、架构图、视频素材保留在上级目录。

### 成果库视频（交付：走 Coze S3）

- **数据库**只存成片元数据（表 `work_gallery` / Key），**不存 mp4 二进制**。
- 播放走对象存储：环境变量 `STORAGE_URL` / `STORAGE_BUCKET` / `STORAGE_AK` / `STORAGE_SK`（扣子编程禁止 `COZE_` 前缀；本地写在 `.env.local`）。
- **学伴答疑**走扣子智能体：`AGENT_API_TOKEN` + `AGENT_BOT_ID`（启航学伴 `7699859793662132264`，已挂答疑库/客舱案例库）；未配置时回退本地苏格拉底追问。
- **上传方式二选一**：扣子「对象存储」控制台直传 `4视频` 原文件名（推荐，与现网一致）；或本地 `npm run upload:works`。
- 本地无 S3 时才回落读本机 `4视频/` 或 `npm run pack:works`。

## 本地开发

```bash
cd 代码
npm install
cp .env.local.example .env.local
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

### 测试账号（密码均为 `123456`）

| 角色 | 账号 | 姓名 |
|------|------|------|
| 教师 | `T001` | 李老师 |
| 学生 | `S2026001` | 林晓航 |
| 学生 | `S2026008` | 陈思远 |

教师工作台 → **账号管理** 可增删改账号。

## 关键 API（骨架）

- `GET /api/health`
- `POST /api/qa/sessions` · `POST /api/qa/followup` · `POST /api/qa/escalate`
- `GET /api/teacher/escalations`
- `POST /api/interactive/script/collect` · `POST /api/interactive/script/generate`
- `GET /api/interactive/quiz/paper` · `POST /api/interactive/quiz/submit`
- `POST /api/interactive/cabin` · `GET /api/interactive/wordcard` · `POST /api/interactive/debate`
- `GET /api/student/profile` · `POST /api/task/assign`
- `POST /api/video/storyboard` · `POST /api/works/upload`
- `GET|POST /api/forum/topics` · `GET|POST /api/forum/replies`
- `GET|POST /api/highlights`（pin / reflux / promote）

统一返回：`{ data: T }` 或 `{ error: string }`。

## 数据库

目标库为 **PostgreSQL**（`DATABASE_URL`）。表结构见 `sql/schema.sql`。

- **必须**配置 `DATABASE_URL`：答疑 / 转接 / 学情 / 任务 / 短视频 / 作品 / 论坛 / 精华读写 PostgreSQL（首次请求自动 migrate + 种子数据）
- **未配置数据库时**：接口返回 503，门户不展示业务内容
- 课中五式房间为进程内实时状态（需库可用才开放；后续可迁 Redis）

本地：复制 `.env.local.example` → `.env.local` 填入连接串。扣子环境变量同名注入即可。

## 迭代建议（对齐开发文档）

1. **M1** 启发式答疑 MVP + 学情标签 + 转接队列落库  
2. **M2** 课中五式完整会话与 Redis 状态  
3. **M3** 分层任务 + AI 短视频工坊 + 工作台视图  
4. **研讨社区** 议题 / 精华 / 回灌（PostgreSQL）  
5. **M4** 内容安全双闸门 · 演示路径条  
6. **下一步** 合班试点体验 · 课中状态迁 Redis · 真 LLM/RAG  

## Coze 部署

在扣子编程中打开本项目目录，启用数据库 / 对象存储 / 模型环境变量后构建部署。
