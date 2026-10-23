import { existsSync } from "fs";
import path from "path";
import type { WorkClip } from "@/lib/content/worksGallery";

export function worksPreviewPath(clipId: string): string {
  return path.join(
    process.cwd(),
    "public",
    "works",
    "preview",
    `${clipId}.mp4`,
  );
}

/** 墙面优先播轻量预览（6 秒裁剪），否则回落成片 */
export function resolveWorksVideoPath(
  clip: WorkClip,
  preferPreview = true,
): string | null {
  const candidates = [
    preferPreview ? worksPreviewPath(clip.id) : "",
    path.join(process.cwd(), "public", "works", "gallery", `${clip.id}.mp4`),
    process.env.WORKS_VIDEO_DIR
      ? path.join(process.env.WORKS_VIDEO_DIR, clip.file)
      : "",
    path.resolve(process.cwd(), "..", "4视频", clip.file),
  ].filter(Boolean);

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}
