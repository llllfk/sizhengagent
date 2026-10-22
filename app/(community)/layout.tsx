import { PortalShell } from "@/components/shared/PortalNav";

const items = [
  { href: "/forum", label: "研讨论坛" },
  { href: "/highlights", label: "精华集" },
];

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalShell title="师生研讨社区" tone="community" items={items}>
      {children}
    </PortalShell>
  );
}
