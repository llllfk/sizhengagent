import { EmbarkGate } from "@/components/shared/EmbarkGate";

export default async function EmbarkPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string; portal?: string }>;
}) {
  const sp = await searchParams;
  return (
    <EmbarkGate
      next={typeof sp.to === "string" ? sp.to : "/companion"}
      portal={typeof sp.portal === "string" ? sp.portal : "student"}
    />
  );
}
