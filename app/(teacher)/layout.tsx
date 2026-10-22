import { PortalShell } from "@/components/shared/PortalNav";

const items = [
  { href: "/workbench", label: "工作台总览" },
  { href: "/escalations", label: "疑难转接队列" },
  { href: "/interactive-control", label: "课中互动调度" },
  { href: "/analytics", label: "学情看板" },
  { href: "/weekly-report", label: "学情周报" },
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
