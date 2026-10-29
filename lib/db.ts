import { Pool, type QueryResult, type QueryResultRow } from "pg";

/**
 * Coze / 本地 PostgreSQL：凭据由 DATABASE_URL 注入，禁止硬编码。
 * 未配置时返回 null；业务层抛错，前端不展示数据。
 */
function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    max: 8,
    idleTimeoutMillis: 30_000,
    // 探活/首连不要卡太久，避免进八模块等页干等十余秒
    connectionTimeoutMillis: 4_000,
  });
}

const pool = createPool();

export default pool;

export function hasDb() {
  return pool != null;
}

export function requireDb() {
  if (!pool) throw new Error("DATABASE_URL is not defined");
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return requireDb().query<T>(text, params);
}
