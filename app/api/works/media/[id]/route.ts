import { createReadStream, existsSync, statSync } from "fs";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { jsonError } from "@/lib/api/errors";
import { requireUser } from "@/lib/auth/session";
import { getWorkClip } from "@/lib/content/worksGallery";
import {
  resolveWorksVideoPath,
  worksPreviewPath,
} from "@/lib/content/worksGalleryPath";
import {
  galleryObjectKeyFromFile,
  galleryObjectKeyLegacy,
  getSignedPlayUrl,
  hasObjectStorage,
  objectExists,
} from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/works/media/:id
 * 优先本地 6 秒预览 → 再 S3 成片 → 再本地成片
 */
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser();
    const { id } = await ctx.params;
    const clip = getWorkClip(id);
    if (!clip) {
      return NextResponse.json({ error: "成片不存在" }, { status: 404 });
    }

    const preview = worksPreviewPath(clip.id);
    const filePath =
      (existsSync(preview) ? preview : null) ||
      resolveWorksVideoPath(clip, false);

    if (filePath && existsSync(filePath)) {
      return streamFile(request, filePath);
    }

    const keyCandidates = [
      `works/preview/${clip.id}.mp4`,
      galleryObjectKeyFromFile(clip.file),
      galleryObjectKeyLegacy(clip.id),
    ];
    if (hasObjectStorage()) {
      for (const key of keyCandidates) {
        if (await objectExists(key)) {
          const url = await getSignedPlayUrl(key);
          return NextResponse.redirect(url, 302);
        }
      }
    }

    return NextResponse.json(
      {
        error: "成片缺失：请先 npm run preview:works 生成预览，或配置 S3",
        tried: keyCandidates,
        file: clip.file,
      },
      { status: 404 },
    );
  } catch (e) {
    return jsonError(e, "读取成片失败");
  }
}

function streamFile(request: NextRequest, filePath: string) {
  const stat = statSync(filePath);
  const size = stat.size;
  const range = request.headers.get("range");

  if (range) {
    const m = /bytes=(\d+)-(\d*)/.exec(range);
    if (!m) return new NextResponse(null, { status: 416 });
    const start = Number(m[1]);
    const end = m[2]
      ? Number(m[2])
      : Math.min(start + 1024 * 1024 - 1, size - 1);
    if (start >= size || end >= size || start > end) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }
    const stream = createReadStream(filePath, { start, end });
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  const stream = createReadStream(filePath);
  return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
