/**
 * 交付打包：把上级 `4视频/` 成片挂到 `public/works/gallery/{id}.mp4`
 * 同盘优先硬链接（不占双倍空间）；失败则复制。
 *
 * 用法：node scripts/pack-works-videos.mjs
 */
import { existsSync, mkdirSync, readdirSync, linkSync, copyFileSync, unlinkSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcDir = path.resolve(root, "..", "4视频");
const destDir = path.join(root, "public", "works", "gallery");

/** 与 lib/content/worksGallery.ts 保持一致 */
const clips = [
  { id: "cabin-sim", file: "9.客舱模拟.mp4" },
  { id: "qihang-blue", file: "5.启航逐梦蓝天.mp4" },
  { id: "rescue-nation", file: "2.国家级：紧急救助.mp4" },
  { id: "walk-prov", file: "4.省级和校级一等奖：行走的思政课.mp4" },
  { id: "lion-nation", file: "醒狮-新1.mp4" },
  { id: "lion-school", file: "1.校级一等奖醒狮 文化安全.mp4" },
  { id: "grow-up", file: "5.国家级优秀：长大后就成了您.mp4" },
  { id: "social", file: "3.国家级：社会服务.mp4" },
  { id: "sanxiaxiang", file: "8.省级：三下乡.mp4" },
  { id: "walk-bronze", file: "省级三等奖：行走的思政课.mp4" },
  { id: "campus-safe", file: "10.校园安全.mp4" },
  { id: "cyber", file: "12.网络安全.mp4" },
  { id: "integrity", file: "11.廉洁 (1).mp4" },
  { id: "interview-campus", file: "11.校园采访.mp4" },
  { id: "interview", file: "6.面试.mp4" },
  { id: "rescue-short", file: "7.紧急救助.mp4" },
];

if (!existsSync(srcDir)) {
  console.error("找不到源目录:", srcDir);
  process.exit(1);
}

mkdirSync(destDir, { recursive: true });
const available = new Set(readdirSync(srcDir));

let linked = 0;
let copied = 0;
let skipped = 0;
let missing = 0;

for (const clip of clips) {
  const src = path.join(srcDir, clip.file);
  const dest = path.join(destDir, `${clip.id}.mp4`);
  if (!available.has(clip.file) || !existsSync(src)) {
    console.warn("MISSING", clip.file);
    missing++;
    continue;
  }
  if (existsSync(dest)) {
    skipped++;
    continue;
  }
  try {
    linkSync(src, dest);
    linked++;
    console.log("LINK", clip.id);
  } catch {
    copyFileSync(src, dest);
    copied++;
    console.log("COPY", clip.id);
  }
}

console.log(
  `\n完成 → ${destDir}\n硬链 ${linked} · 复制 ${copied} · 已存在跳过 ${skipped} · 缺失 ${missing}`,
);
console.log("交付时请把整个「代码」目录（含 public/works/gallery）交给客户。");
