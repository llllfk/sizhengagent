import { AccountManager } from "@/components/shared/AccountManager";
import { Panel } from "@/components/ui/Card";

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-[11px] tracking-[0.3em] text-[var(--orange)]">
          中枢 · 账号管理
        </p>
        <h1 className="font-brand text-4xl text-[var(--ink)] md:text-5xl">
          账号管理
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
          可修改本人与任意账号的名称、登录账号；新建学生时可直接分班。班级增删改请走「班级管理」。
        </p>
      </header>
      <Panel title="账号管理" hint="需教师身份登录后操作">
        <AccountManager />
      </Panel>
    </div>
  );
}
