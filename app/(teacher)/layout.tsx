import { PortalShell } from "@/components/shared/PortalNav";

const items = [
  { href: "/modules", label: "八模块总览" },
  { href: "/workbench", label: "工作台总览" },
  { href: "/companion", label: "体验学伴答疑" },
  { href: "/escalations", label: "疑难转接队列" },
  { href: "/interactive-control", label: "课中互动调度" },
  { href: "/works", label: "成果库" },
  { href: "/analytics", label: "学情看板" },
  { href: "/weekly-report", label: "学情周报" },
  { href: "/classes", label: "班级管理" },
  { href: "/accounts", label: "账号管理" },
];

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalShell title="教师智能工作台" tone="teacher" items={items}>
      {children}
    </PortalShell>
  );
}
