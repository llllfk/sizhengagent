/**
 * 原片多为 HEVC，Chrome 常「有声黑屏」。
 * 转成 H.264 + AAC 供弹层有声预览：public/works/play/{id}.mp4
 */
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcDir = path.resolve(root, "..", "4视频");
const outDir = path.join(root, "public", "works", "play");

const clips = [
  { id: "cabin-sim", file: "9.客舱模拟.mp4" },
  { id: "qihang-blue", file: "5.启航逐梦蓝天.mp4" },
  { id: "rescue-nation", file: "2.国家级：紧急救助.mp4" },
  { id: "walk-prov", file: "4.省级和校级一等奖：行走的思政课.mp4" },
  { id: "lion-nation", file: "1.国家级：醒狮·少年路.mp4" },
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
  console.error("找不到源目录", srcDir);
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

let ok = 0;
for (const clip of clips) {
  const src = path.join(srcDir, clip.file);
  const dest = path.join(outDir, `${clip.id}.mp4`);
  if (!existsSync(src)) {
    console.error("MISS", clip.file);
    continue;
  }
  if (existsSync(dest)) {
    console.log("SKIP", clip.id);
    ok++;
    continue;
  }
  console.log("ENC ", clip.id, "←", clip.file);
  const r = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      src,
      "-vf",
      "scale=1280:-2",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      dest,
    ],
    { stdio: "inherit", windowsHide: true },
  );
  if (r.status === 0) ok++;
  else console.error("FAIL", clip.id, "code", r.status);
}

console.log(`done. play=${ok}/${clips.length} → ${outDir}`);
