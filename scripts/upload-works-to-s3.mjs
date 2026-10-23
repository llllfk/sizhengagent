/**
 * 把上级 `4视频/` 成片上传到 Coze S3（works/gallery/{id}.mp4）
 * 需要 .env.local 已填写 COZE_STORAGE_URL / BUCKET / AK / SK
 *
 * 用法：node scripts/upload-works-to-s3.mjs
 */
import {
  existsSync,
  readFileSync,
  createReadStream,
  statSync,
} from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcDir = path.resolve(root, "..", "4视频");

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

function loadEnvLocal() {
  const p = path.join(root, ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

const endpoint = process.env.COZE_STORAGE_URL || "";
const bucket = process.env.COZE_STORAGE_BUCKET || "";
const ak = process.env.COZE_STORAGE_AK || "";
const sk = process.env.COZE_STORAGE_SK || "";

if (!endpoint || !bucket || !ak || !sk) {
  console.error(
    "缺少 COZE_STORAGE_*。请在扣子编程环境变量或 .env.local 填入 URL/BUCKET/AK/SK 后再跑。",
  );
  process.exit(1);
}

if (!existsSync(srcDir)) {
  console.error("找不到源目录:", srcDir);
  process.exit(1);
}

const client = new S3Client({
  endpoint,
  region: "us-east-1",
  forcePathStyle: true,
  credentials: { accessKeyId: ak, secretAccessKey: sk },
});

async function exists(key) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log("bucket:", bucket);
  console.log("source:", srcDir);
  let ok = 0;
  let skip = 0;
  for (const clip of clips) {
    // 与控制台直传一致：桶根目录用中文原文件名
    const key = clip.file;
    const src = path.join(srcDir, clip.file);
    if (!existsSync(src)) {
      console.error("MISS", clip.file);
      continue;
    }
    if (await exists(key)) {
      console.log("SKIP", key);
      skip++;
      continue;
    }
    const size = statSync(src).size;
    console.log("PUT ", key, `(${(size / 1024 / 1024).toFixed(1)} MB)`);
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: createReadStream(src),
        ContentType: "video/mp4",
        ContentLength: size,
      }),
    );
    ok++;
  }
  console.log(`done. uploaded=${ok} skipped=${skip}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
