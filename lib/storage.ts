import { S3Client } from "@aws-sdk/client-s3";

/**
 * Coze 对象存储（S3 兼容）。
 * URI 永久入库，URL 按需换取（有效期 0~30 天）。
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
