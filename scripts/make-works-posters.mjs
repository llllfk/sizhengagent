/**
 * 从 preview mp4 抽首帧 JPG，成果墙打开即见画面（避免黑屏等解码）
 * 用法：node scripts/make-works-posters.mjs
 */
import { existsSync, mkdirSync, readdirSync, unlinkSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "public", "works", "preview");
const outDir = path.join(root, "public", "works", "poster");
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
  const dest = path.join(outDir, `${id}.jpg`);
  if (existsSync(dest) && force) unlinkSync(dest);
  if (existsSync(dest)) {
    console.log("SKIP", id);
    ok++;
    continue;
  }
  console.log("POSTER", id);
  const r = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-ss",
      "2.5",
      "-i",
      src,
      "-frames:v",
      "1",
      "-vf",
      "scale=640:-2:flags=lanczos",
      "-q:v",
      "4",
      dest,
    ],
    { stdio: "inherit", windowsHide: true },
  );
  if (r.status === 0) ok++;
  else console.error("FAIL", id, r.status);
}
console.log(`done. poster=${ok}/${files.length} → ${outDir}`);
