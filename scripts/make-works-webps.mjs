/**
 * 预览 mp4 → 循环 WebP（更高清晰度，供成果墙）
 * 先有 preview mp4：npm run preview:works
 */
import { existsSync, mkdirSync, readdirSync, unlinkSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "public", "works", "preview");
const outDir = path.join(root, "public", "works", "anim");
const force = process.argv.includes("--force");

if (!existsSync(srcDir)) {
  console.error("请先 npm run preview:works");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const files = readdirSync(srcDir).filter((f) => f.endsWith(".mp4"));
let ok = 0;
for (const file of files) {
  const id = file.replace(/\.mp4$/i, "");
  const src = path.join(srcDir, file);
  const dest = path.join(outDir, `${id}.webp`);
  if (existsSync(dest) && force) unlinkSync(dest);
  if (existsSync(dest)) {
    console.log("SKIP", id);
    ok++;
    continue;
  }
  console.log("WEBP", id);
  // 960 宽 + 更高质量 + 18fps，主视觉放大也不糊
  const r = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      src,
      "-vf",
      "scale=960:-2:flags=lanczos,fps=18",
      "-loop",
      "0",
      "-an",
      "-c:v",
      "libwebp",
      "-quality",
      "82",
      "-compression_level",
      "4",
      dest,
    ],
    { stdio: "inherit", windowsHide: true },
  );
  if (r.status === 0) ok++;
  else console.error("FAIL", id, r.status);
}
console.log(`done. anim=${ok}/${files.length} → ${outDir}`);
