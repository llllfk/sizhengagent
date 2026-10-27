import { query } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { SessionUser } from "@/lib/auth/session";
import { assignStudentClass } from "@/lib/repo/classes";

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

export type AppUserPublic = Omit<AppUserRow, "password_hash"> & {
  class_id: string | null;
  class_name: string | null;
  class_code: string | null;
};

function mapPublic(row: Record<string, unknown>): AppUserPublic {
  return {
    user_id: String(row.user_id),
    username: String(row.username),
    role: row.role as "teacher" | "student",
    display_name: String(row.display_name),
    student_id: row.student_id ? String(row.student_id) : null,
    active: Boolean(row.active),
    created_at: new Date(row.created_at as Date).toISOString(),
    class_id: row.class_id ? String(row.class_id) : null,
    class_name: row.class_name ? String(row.class_name) : null,
    class_code: row.class_code ? String(row.class_code) : null,
  };
}

export async function listUsers(): Promise<AppUserPublic[]> {
  const r = await query(
    `select u.user_id, u.username, u.role, u.display_name, u.student_id,
            u.active, u.created_at,
            s.class_id, c.name as class_name, c.code as class_code
     from app_user u
     left join student_profile s on s.student_id = u.student_id
     left join class_group c on c.class_id = s.class_id
     order by u.role desc, u.username asc`,
  );
  return r.rows.map((row) => mapPublic(row as Record<string, unknown>));
}

export async function findStudentClass(studentId: string): Promise<{
  class_id: string | null;
  class_name: string | null;
  class_code: string | null;
} | null> {
  const r = await query(
    `select s.class_id, c.name as class_name, c.code as class_code
     from student_profile s
     left join class_group c on c.class_id = s.class_id
     where s.student_id=$1`,
    [studentId],
  );
  const row = r.rows[0] as
    | { class_id: string | null; class_name: string | null; class_code: string | null }
    | undefined;
  if (!row) return null;
  return {
    class_id: row.class_id ? String(row.class_id) : null,
    class_name: row.class_name ? String(row.class_name) : null,
    class_code: row.class_code ? String(row.class_code) : null,
  };
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
  class_id?: string | null;
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
    const classId = input.class_id?.trim() || null;
    await query(
      `insert into student_profile
        (student_id, name, type_tag, cognition_level, weak_points, class_id, updated_at)
       values ($1,$2,'creation',2,'[]'::jsonb,$4,$3)
       on conflict (student_id) do update set
         name=excluded.name,
         class_id=coalesce(excluded.class_id, student_profile.class_id),
         updated_at=excluded.updated_at`,
      [sid, input.display_name.trim(), now, classId],
    );
  }
  const list = await listUsers();
  return list.find((u) => u.user_id === userId)!;
}

export async function updateUser(
  userId: string,
  patch: {
    username?: string;
    display_name?: string;
    active?: boolean;
    password?: string;
    student_id?: string | null;
    class_id?: string | null;
  },
) {
  const r = await query(`select * from app_user where user_id=$1`, [userId]);
  if (!r.rows[0]) return null;
  const row = r.rows[0];
  const oldUsername = String(row.username);
  const username =
    patch.username !== undefined
      ? patch.username.trim()
      : oldUsername;
  if (!username) throw new Error("账号不能为空");
  if (username !== oldUsername) {
    const clash = await findUserByUsername(username);
    if (clash && clash.user_id !== userId) {
      throw new Error("账号已被占用");
    }
  }
  const displayName =
    patch.display_name !== undefined
      ? patch.display_name.trim()
      : String(row.display_name);
  if (!displayName) throw new Error("名称不能为空");
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
      username=$2, display_name=$3, active=$4, student_id=$5, password_hash=$6, updated_at=now()
     where user_id=$1`,
    [userId, username, displayName, active, studentId, passwordHash],
  );
  if (studentId && patch.display_name !== undefined) {
    await query(
      `update student_profile set name=$2, updated_at=now() where student_id=$1`,
      [studentId, displayName],
    );
  }
  if (patch.class_id !== undefined && studentId) {
    await assignStudentClass(studentId, patch.class_id);
  }
  return (await listUsers()).find((u) => u.user_id === userId) ?? null;
}

export async function deleteUser(userId: string) {
  const r = await query(`delete from app_user where user_id=$1 returning user_id`, [
    userId,
  ]);
  return r.rowCount === 1;
}

/** 本人改密：校验当前密码后写入新哈希 */
export async function changeOwnPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await query(
    `select user_id, password_hash, active from app_user where user_id=$1`,
    [userId],
  );
  const row = r.rows[0] as
    | { user_id: string; password_hash: string; active: boolean }
    | undefined;
  if (!row || !row.active) return { ok: false, error: "账号不存在或已停用" };
  if (!verifyPassword(currentPassword, row.password_hash)) {
    return { ok: false, error: "当前密码不正确" };
  }
  if (!newPassword.trim()) return { ok: false, error: "新密码不能为空" };
  if (newPassword.length < 6) {
    return { ok: false, error: "新密码至少 6 位" };
  }
  if (currentPassword === newPassword) {
    return { ok: false, error: "新密码不能与当前密码相同" };
  }
  await query(
    `update app_user set password_hash=$2, updated_at=now() where user_id=$1`,
    [userId, hashPassword(newPassword)],
  );
  return { ok: true };
}

/** 正式教师账号（幂等；已存在则跳过，不覆盖密码） */
export async function ensureTeacherAccount() {
  const username = "13250707525";
  const exists = await findUserByUsername(username);
  if (exists) return;
  await createUser({
    username,
    password: "yuerkk7525",
    role: "teacher",
    display_name: "教师",
    student_id: null,
  });
}
