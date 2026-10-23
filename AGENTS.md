# AGENTS.md

## 项目概述
启航 · 思政智能体（qihang-agent）：面向高职空乘专业思政课的「人工智能+」教学智能体。三端入口——
- 学生智能学伴 `/companion`（答疑 · 课中五式 · 分层任务 · 短视频工坊）
- 教师智能工作台 `/workbench`（转接队列 · 互动调度 · 学情看板 · 周报）
- 师生研讨社区 `/forum`（议题 · 跟帖 · 精华集 · 回灌答疑库）

当前主体已接入 **PostgreSQL**（`/api/health` 返回 `db: "ok"`）：鉴权/用户/学情/答疑/任务等走 `lib/repo/*`（含 `ensurePg` 幂等建表+播种测试账号）；部分互动/短视频演示逻辑仍保留 `lib/mock/*` 兜底。

## 技术栈
- Next.js 15（App Router）+ TypeScript + Tailwind CSS 4
- React 19；依赖：`@aws-sdk/client-s3`、`@aws-sdk/s3-request-presigner`（对象存储）、`pg`（PostgreSQL，已启用）
- 包管理器：**pnpm**（强制，已从 npm 迁移，删除 `package-lock.json`，锁文件为 `pnpm-lock.yaml`）
- 运行时：nodejs-24

## 目录结构
- `app/`：页面（路由组 `(student)` / `(teacher)` / `(community)` + 首页）与 `app/api/*` 全部 API Routes
- `components/`：`ui/`（基础组件）、`shared/`（业务组件）
- `lib/`：`db.ts`（pg 客户端）、`repo/`（users/ensure 等 PG 仓储）、`auth/`（session 分端 cookie、password）、`storage.ts`（S3）、`ai.ts`（LLM/内容安全）、`mock/*`（演示兜底）
- `types/index.ts`：领域类型
- `sql/schema.sql`：PG 表结构

## 关键入口 / 核心模块
- 运行入口：`pnpm run dev` / `pnpm run start`（Next.js）
- API 统一返回 `{ data: T }` 或 `{ error: string }`，前端用相对路径 `/api/...` 调用
- **鉴权**：登录走 `/api/auth/login`（`username/password/portal`），分端 cookie（`qihang_session_student/teacher/community`）；业务接口用 `requireStudent`/`requireTeacher`/`requireUser` 守卫。播种测试账号：教师 `T001`、学生 `S2026001`/`S2026008`，密码均 `123456`
- 关键接口：`/api/qa/*`（答疑/转接）、`/api/interactive/*`（课中五式：剧本/闯关/客舱/辩论/词卡）、`/api/task/assign`、`/api/video/storyboard`、`/api/works/upload`、`/api/forum/*`、`/api/highlights`、`/api/teacher/*`

## 运行与预览
- 预览型项目：`.coze` `preview_enable = "enabled"`，对外只暴露 5000
- `.preview` 声明端口（`expose_port = 5000`）；预览 build/run 脚本在 `.cozeproj/scripts/`（`dev_build.sh` / `dev_run.sh`），run 绑定 `0.0.0.0`
- 部署脚本：`.cozeproj/scripts/deploy_build.sh` / `deploy_run.sh`（端口 5000）
- 验证走 `test_run`（静态检查 + 接口冒烟）

## 用户偏好与长期约束
- Node 项目一律使用 pnpm，不用 npm/yarn
- 不擅自改动数据源切换逻辑（DB 已启用，保持 `lib/repo` 落库现状）；`lib/mock/*` 作为演示兜底保留

## 常见问题和预防
- 未配置 `DATABASE_URL` 或 DB 不可用时，`/api/health` 返回 `db: "unconfigured"`，部分业务走 `lib/mock` 兜底
- 互动房间为全局单例状态：`startRoom` 会先结束所有 live 房间，连续建多房间需注意；建房间（`/api/interactive/rooms` POST）需教师登录，参与演练需学生登录
- `package.json` 变更依赖后，若预览启动报 `ERR_PNPM_OUTDATED_LOCKFILE` / `exit 254`（预览 `dev_build.sh` 用 `--frozen-lockfile`），需先 `pnpm install` 重新生成 `pnpm-lock.yaml`，勿抛 npm 锁文件
- 若需真正落库，按 `sql/schema.sql` 用 `lib/db.ts` 的 pg 客户端替换 `lib/mock/*`