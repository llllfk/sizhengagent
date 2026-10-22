import { Pool } from "pg";

/**
 * Coze 内置 PostgreSQL：凭据由环境变量注入，禁止硬编码。
 * 本地未配置 DATABASE_URL 时返回 null，API 可降级为占位响应。
 */
const pool =
  process.env.DATABASE_URL != null && process.env.DATABASE_URL !== ""
    ? new Pool({ connectionString: process.env.DATABASE_URL })
    : null;

export default pool;

export function requireDb() {
  if (!pool) {
    throw new Error("DATABASE_URL is not defined");
  }
  return pool;
}
