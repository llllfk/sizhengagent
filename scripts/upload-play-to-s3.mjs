/**
 * 把 public/works/play/{id}.mp4（H.264 可播片）上传到 Coze S3：works/play/{id}.mp4
 * 需要 .env.local 已填写 STORAGE_URL / BUCKET / AK / SK
 *
 * 用法：node scripts/upload-play-to-s3.mjs
 */
import {
  existsSync,
  readFileSync,
  createReadStream,
  readdirSync,
  statSync,
} from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const playDir = path.join(root, "public", "works", "play");

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

const endpoint = process.env.STORAGE_URL || "";
const bucket = process.env.STORAGE_BUCKET || "";
const ak = process.env.STORAGE_AK || "";
const sk = process.env.STORAGE_SK || "";

if (!endpoint || !bucket || !ak || !sk) {
  console.error(
    "缺少 STORAGE_*。请在扣子编程环境变量或 .env.local 填入 URL/BUCKET/AK/SK 后再跑。",
  );
  process.exit(1);
}

if (!existsSync(playDir)) {
  console.error("找不到 play 目录，请先 npm run play:works →", playDir);
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
  const files = readdirSync(playDir).filter((f) => f.endsWith(".mp4"));
  console.log("bucket:", bucket);
  console.log("source:", playDir, `(${files.length} files)`);
  let ok = 0;
  let skip = 0;
  for (const file of files) {
    const key = `works/play/${file}`;
    const src = path.join(playDir, file);
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
