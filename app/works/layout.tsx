"use client";

import { PortalShell, type NavItem } from "@/components/shared/PortalNav";
import { useSession } from "@/components/shared/useSession";

const studentItems: NavItem[] = [
  { href: "/modules", label: "八模块总览" },
  { href: "/companion", label: "启发式答疑" },
  { href: "/interactive", label: "课中互动五式" },
  { href: "/tasks", label: "分层任务" },
  { href: "/industry", label: "行业问题对接" },
  { href: "/works", label: "成果库" },
  { href: "/profile", label: "我的学情" },
];

const teacherItems: NavItem[] = [
  { href: "/modules", label: "八模块总览" },
  { href: "/workbench", label: "工作台总览" },
  { href: "/escalations", label: "疑难转接队列" },
  { href: "/interactive-control", label: "课中互动调度" },
  { href: "/works", label: "成果库" },
  { href: "/analytics", label: "学情看板" },
  { href: "/weekly-report", label: "学情周报" },
];

export default function WorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isTeacher } = useSession();
  return (
    <PortalShell
      title={isTeacher ? "教师智能工作台" : "学生智能学伴"}
      tone={isTeacher ? "teacher" : "student"}
      items={isTeacher ? teacherItems : studentItems}
    >
      {children}
    </PortalShell>
  );
}
