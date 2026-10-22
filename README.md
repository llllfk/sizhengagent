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

## 本地开发

```bash
cd 代码
npm install
cp .env.local.example .env.local
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

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

目标库为 **PostgreSQL**（`DATABASE_URL`）。表结构见 `sql/schema.sql`（含学情 / 答疑 / 互动 / 客舱 / 作品 / **研讨社区**）。当前演示走内存 Mock，字段形状已与 PG 表对齐，后续可直接换 `pg` 客户端落库。

## 迭代建议（对齐开发文档）

1. **M1** 启发式答疑 MVP + 学情标签 + 转接队列落库  
2. **M2** 课中五式完整会话与 Redis 状态  
3. **M3** 分层任务 + AI 短视频工坊 + 工作台视图  
4. **研讨社区** 议题 / 精华 / 回灌（Mock 已就绪，待 PG 落库）  
5. **M4** 内容安全双闸门（敏感词 + 价值导向，答疑/短视频可见拦截）· 演示路径条  
6. **下一步** 合班试点体验 + Mock→PostgreSQL 切换  

## Coze 部署

在扣子编程中打开本项目目录，启用数据库 / 对象存储 / 模型环境变量后构建部署。
