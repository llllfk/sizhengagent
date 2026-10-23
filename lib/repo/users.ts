import { query } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { SessionUser } from "@/lib/auth/session";

export type AppUserRow = {
  user_id: string;
  username: string;
  password_hash: string;
  role: "teacher" | "student";
  display_name: string;
  student_id: string | null;
  active: boolean;
  created_at: string;
};

export type AppUserPublic = Omit<AppUserRow, "password_hash">;

function mapPublic(row: Record<string, unknown>): AppUserPublic {
  return {
    user_id: String(row.user_id),
    username: String(row.username),
    role: row.role as "teacher" | "student",
    display_name: String(row.display_name),
    student_id: row.student_id ? String(row.student_id) : null,
    active: Boolean(row.active),
    created_at: new Date(row.created_at as Date).toISOString(),
  };
}

export async function listUsers(): Promise<AppUserPublic[]> {
  const r = await query(
    `select user_id, username, role, display_name, student_id, active, created_at
     from app_user order by role desc, username asc`,
  );
  return r.rows.map((row) => mapPublic(row as Record<string, unknown>));
}

export async function findUserByUsername(username: string) {
  const r = await query(`select * from app_user where username=$1`, [username]);
  return r.rows[0] as
    | {
        user_id: string;
        username: string;
        password_hash: string;
        role: "teacher" | "student";
        display_name: string;
        student_id: string | null;
        active: boolean;
      }
    | undefined;
}

export async function authenticate(
  username: string,
  password: string,
): Promise<SessionUser | null> {
  const row = await findUserByUsername(username.trim());
  if (!row || !row.active) return null;
  if (!verifyPassword(password, row.password_hash)) return null;
  return {
    user_id: row.user_id,
    username: row.username,
    role: row.role,
    display_name: row.display_name,
    student_id: row.student_id,
  };
}

export async function createUser(input: {
  username: string;
  password: string;
  role: "teacher" | "student";
  display_name: string;
  student_id?: string | null;
}) {
  const userId = `u_${Date.now()}`;
  const now = new Date().toISOString();
  await query(
    `insert into app_user
      (user_id, username, password_hash, role, display_name, student_id, active, created_at, updated_at)
     values ($1,$2,$3,$4,$5,$6,true,$7,$7)`,
    [
      userId,
      input.username.trim(),
      hashPassword(input.password),
      input.role,
      input.display_name.trim(),
      input.role === "student" ? input.student_id || input.username.trim() : null,
      now,
    ],
  );
  if (input.role === "student") {
    const sid = input.student_id || input.username.trim();
    await query(
      `insert into student_profile
        (student_id, name, type_tag, cognition_level, weak_points, updated_at)
       values ($1,$2,'creation',2,'[]'::jsonb,$3)
       on conflict (student_id) do update set name=excluded.name, updated_at=excluded.updated_at`,
      [sid, input.display_name.trim(), now],
    );
  }
  const list = await listUsers();
  return list.find((u) => u.user_id === userId)!;
}

export async function updateUser(
  userId: string,
  patch: {
    display_name?: string;
    active?: boolean;
    password?: string;
    student_id?: string | null;
  },
) {
  const r = await query(`select * from app_user where user_id=$1`, [userId]);
  if (!r.rows[0]) return null;
  const row = r.rows[0];
  const displayName = patch.display_name?.trim() || String(row.display_name);
  const active = patch.active ?? Boolean(row.active);
  const studentId =
    patch.student_id !== undefined
      ? patch.student_id
      : row.student_id
        ? String(row.student_id)
        : null;
  const passwordHash = patch.password
    ? hashPassword(patch.password)
    : String(row.password_hash);

  await query(
    `update app_user set
      display_name=$2, active=$3, student_id=$4, password_hash=$5, updated_at=now()
     where user_id=$1`,
    [userId, displayName, active, studentId, passwordHash],
  );
  return (await listUsers()).find((u) => u.user_id === userId) ?? null;
}

export async function deleteUser(userId: string) {
  const r = await query(`delete from app_user where user_id=$1 returning user_id`, [
    userId,
  ]);
  return r.rowCount === 1;
}

/** 测试账号：1 教师 + 2 学生（幂等） */
export async function ensureTestUsers() {
  const defaults = [
    {
      username: "T001",
      password: "123456",
      role: "teacher" as const,
      display_name: "李老师",
      student_id: null as string | null,
    },
    {
      username: "S2026001",
      password: "123456",
      role: "student" as const,
      display_name: "林晓航",
      student_id: "S2026001",
    },
    {
      username: "S2026008",
      password: "123456",
      role: "student" as const,
      display_name: "陈思远",
      student_id: "S2026008",
    },
  ];

  for (const u of defaults) {
    const exists = await findUserByUsername(u.username);
    if (exists) continue;
    await createUser(u);
  }
}
