import { query } from "@/lib/db";
import type { ClassGroup, StudentProfile } from "@/types";

function mapClass(row: Record<string, unknown>): ClassGroup {
  return {
    class_id: String(row.class_id),
    name: String(row.name),
    code: String(row.code),
    remark: row.remark ? String(row.remark) : "",
    created_by: row.created_by ? String(row.created_by) : null,
    student_count: Number(row.student_count ?? 0),
    created_at: new Date(row.created_at as Date).toISOString(),
    updated_at: new Date(row.updated_at as Date).toISOString(),
  };
}

export async function listClasses(): Promise<ClassGroup[]> {
  const r = await query(
    `select c.class_id, c.name, c.code, c.remark, c.created_by,
            c.created_at, c.updated_at,
            count(s.student_id)::int as student_count
     from class_group c
     left join student_profile s on s.class_id = c.class_id
     group by c.class_id, c.name, c.code, c.remark, c.created_by,
              c.created_at, c.updated_at
     order by c.created_at desc`,
  );
  return r.rows.map((row) => mapClass(row as Record<string, unknown>));
}

export async function getClass(classId: string): Promise<ClassGroup | null> {
  const list = await listClasses();
  return list.find((c) => c.class_id === classId) ?? null;
}

export async function listClassMembers(
  classId: string,
): Promise<StudentProfile[]> {
  const r = await query(
    `select s.student_id, s.name, s.type_tag, s.cognition_level,
            s.weak_points, s.class_id, s.updated_at,
            c.name as class_name, c.code as class_code
     from student_profile s
     left join class_group c on c.class_id = s.class_id
     where s.class_id = $1
     order by s.student_id`,
    [classId],
  );
  return r.rows.map((row) => ({
    student_id: String(row.student_id),
    name: String(row.name),
    type_tag: row.type_tag as StudentProfile["type_tag"],
    cognition_level: Number(row.cognition_level),
    weak_points: Array.isArray(row.weak_points)
      ? (row.weak_points as string[])
      : [],
    class_id: row.class_id ? String(row.class_id) : null,
    class_name: row.class_name ? String(row.class_name) : null,
    class_code: row.class_code ? String(row.class_code) : null,
    updated_at: new Date(row.updated_at as Date).toISOString(),
  }));
}

export async function createClass(input: {
  name: string;
  code?: string;
  remark?: string;
  created_by?: string | null;
}): Promise<ClassGroup> {
  const name = input.name.trim();
  if (!name) throw new Error("班级名称必填");
  const code = (input.code?.trim() || name.replace(/\s+/g, "")).slice(0, 32);
  if (!code) throw new Error("班级编号必填");
  const classId = `cls_${Date.now()}`;
  await query(
    `insert into class_group
      (class_id, name, code, remark, created_by, created_at, updated_at)
     values ($1,$2,$3,$4,$5,now(),now())`,
    [classId, name, code, (input.remark ?? "").trim(), input.created_by ?? null],
  );
  const created = await getClass(classId);
  if (!created) throw new Error("创建班级失败");
  return created;
}

export async function updateClass(
  classId: string,
  patch: { name?: string; code?: string; remark?: string },
): Promise<ClassGroup | null> {
  const current = await getClass(classId);
  if (!current) return null;
  const name = patch.name?.trim() || current.name;
  const code = patch.code?.trim() || current.code;
  const remark =
    patch.remark !== undefined ? patch.remark.trim() : current.remark;
  await query(
    `update class_group
     set name=$2, code=$3, remark=$4, updated_at=now()
     where class_id=$1`,
    [classId, name, code, remark],
  );
  return getClass(classId);
}

export async function deleteClass(classId: string): Promise<boolean> {
  await query(
    `update student_profile set class_id=null, updated_at=now() where class_id=$1`,
    [classId],
  );
  const r = await query(
    `delete from class_group where class_id=$1 returning class_id`,
    [classId],
  );
  return r.rowCount === 1;
}

/** 保存某班成员：勾选的进入本班；原属本班但未勾选的清空 */
export async function setClassMembers(classId: string, studentIds: string[]) {
  const exists = await getClass(classId);
  if (!exists) return null;
  const ids = Array.from(new Set(studentIds.map((s) => s.trim()).filter(Boolean)));
  await query(
    `update student_profile
     set class_id=null, updated_at=now()
     where class_id=$1`,
    [classId],
  );
  if (ids.length) {
    await query(
      `update student_profile
       set class_id=$1, updated_at=now()
       where student_id = any($2::text[])`,
      [classId, ids],
    );
  }
  return getClass(classId);
}

export async function assignStudentClass(
  studentId: string,
  classId: string | null,
) {
  if (classId) {
    const exists = await getClass(classId);
    if (!exists) throw new Error("班级不存在");
  }
  await query(
    `update student_profile set class_id=$2, updated_at=now() where student_id=$1`,
    [studentId, classId],
  );
}

export async function ensureClassSeed() {
  const r = await query(`select count(*)::int as c from class_group`);
  if (Number(r.rows[0]?.c ?? 0) > 0) return;

  const seeds = [
    {
      class_id: "cls_km2301",
      name: "空乘 2301 班",
      code: "KM2301",
      remark: "空乘专业 2023 级 1 班",
      students: ["S2026001", "S2026008"],
    },
    {
      class_id: "cls_km2302",
      name: "空乘 2302 班",
      code: "KM2302",
      remark: "空乘专业 2023 级 2 班",
      students: ["S2026015", "S2026020"],
    },
  ];
  for (const s of seeds) {
    await query(
      `insert into class_group (class_id, name, code, remark, created_at, updated_at)
       values ($1,$2,$3,$4,now(),now())
       on conflict (class_id) do nothing`,
      [s.class_id, s.name, s.code, s.remark],
    );
    await query(
      `update student_profile
       set class_id=$1, updated_at=now()
       where student_id = any($2::text[]) and class_id is null`,
      [s.class_id, s.students],
    );
  }
}
