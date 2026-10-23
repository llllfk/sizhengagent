"use client";

import { ModulesAtlas } from "@/components/shared/ModulesAtlas";
import { useSession } from "@/components/shared/useSession";

export default function ModulesPage() {
  const { isTeacher } = useSession();
  return <ModulesAtlas isTeacher={isTeacher} />;
}
