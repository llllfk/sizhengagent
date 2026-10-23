import { PortalShell } from "@/components/shared/PortalNav";

const items = [
  { href: "/modules", label: "八模块总览" },
  { href: "/companion", label: "启发式答疑" },
  { href: "/interactive", label: "课中互动五式" },
  { href: "/tasks", label: "分层任务" },
  { href: "/industry", label: "行业问题对接" },
  { href: "/video-workshop", label: "AI短视频工坊" },
  { href: "/works", label: "成果库" },
  { href: "/profile", label: "我的学情" },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalShell title="学生智能学伴" tone="student" items={items}>
      {children}
    </PortalShell>
  );
}
