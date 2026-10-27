import { ClassManager } from "@/components/shared/ClassManager";
import { Panel } from "@/components/ui/Card";

export default function ClassesPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-[11px] tracking-[0.3em] text-[var(--orange)]">
          中枢 · 班级管理
        </p>
        <h1 className="font-brand text-4xl text-[var(--ink)] md:text-5xl">
          班级管理
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
          新建班级、维护编号与备注。学生归属可在「账号管理」中调整；删除班级时学员会变为未分班。
        </p>
      </header>
      <Panel title="班级管理" hint="需教师身份登录后操作">
        <ClassManager />
      </Panel>
    </div>
  );
}
