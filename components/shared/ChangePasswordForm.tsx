"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { readTabPortal } from "@/lib/auth/portalClient";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  async function submit() {
    setBusy(true);
    setMsg("");
    setOk(false);
    try {
      if (!currentPassword || !newPassword) {
        throw new Error("请填写当前密码与新密码");
      }
      if (newPassword !== confirmPassword) {
        throw new Error("两次新密码不一致");
      }
      const portal = readTabPortal();
      const qs = portal ? `?portal=${encodeURIComponent(portal)}` : "";
      const res = await fetch(`/api/auth/password${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "修改失败");
      setOk(true);
      setMsg("密码已更新，下次登录请使用新密码");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setOk(false);
      setMsg(e instanceof Error ? e.message : "修改失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-3">
        <input
          type="password"
          autoComplete="current-password"
          className="rounded-sm border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
          placeholder="当前密码"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <input
          type="password"
          autoComplete="new-password"
          className="rounded-sm border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
          placeholder="新密码（至少 6 位）"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          type="password"
          autoComplete="new-password"
          className="rounded-sm border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
          placeholder="确认新密码"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={busy} onClick={() => void submit()}>
          {busy ? "提交中…" : "修改密码"}
        </Button>
        {msg ? (
          <p
            className={
              ok
                ? "text-sm text-[var(--orange-deep)]"
                : "text-sm text-[var(--vermilion)]"
            }
          >
            {msg}
          </p>
        ) : null}
      </div>
    </div>
  );
}
