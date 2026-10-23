import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createReadStream } from "fs";
import { stat } from "fs/promises";

/**
 * Coze 对象存储（S3 兼容）。
 * 约定：URI/Key 永久入库，播放 URL 按需签名（默认 7 天）。
 */
export const s3Client = new S3Client({
  endpoint: process.env.COZE_STORAGE_URL,
  region: "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.COZE_STORAGE_AK || "",
    secretAccessKey: process.env.COZE_STORAGE_SK || "",
  },
});

export const BUCKET_NAME = process.env.COZE_STORAGE_BUCKET || "";

export function hasObjectStorage(): boolean {
  return Boolean(
    process.env.COZE_STORAGE_URL &&
      process.env.COZE_STORAGE_BUCKET &&
      process.env.COZE_STORAGE_AK &&
      process.env.COZE_STORAGE_SK,
  );
}

/**
 * 成果库成片在桶内的 Key。
 * 控制台直传一般是根目录中文原名；脚本上传可用 works/gallery/{id}.mp4。
 */
export function galleryObjectKeyFromFile(sourceFile: string): string {
  return sourceFile;
}

export function galleryObjectKeyLegacy(clipId: string): string {
  return `works/gallery/${clipId}.mp4`;
}

export async function objectExists(key: string): Promise<boolean> {
  if (!hasObjectStorage()) return false;
  try {
    await s3Client.send(
      new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
    );
    return true;
  } catch {
    return false;
  }
}

export async function uploadFileToStorage(
  key: string,
  filePath: string,
  contentType = "video/mp4",
) {
  if (!hasObjectStorage()) {
    throw new Error("未配置 COZE_STORAGE_*，无法上传对象存储");
  }
  const st = await stat(filePath);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: createReadStream(filePath),
      ContentType: contentType,
      ContentLength: st.size,
    }),
  );
  return key;
}

/** 临时播放地址（浏览器直连 S3，支持拖动进度） */
export async function getSignedPlayUrl(
  key: string,
  expiresInSec = 60 * 60 * 24 * 7,
): Promise<string> {
  if (!hasObjectStorage()) {
    throw new Error("未配置 COZE_STORAGE_*");
  }
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
    { expiresIn: expiresInSec },
  );
}
