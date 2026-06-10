import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { compressImageBuffer } from "@/lib/images/compressForVision";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Missing file upload" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ ok: false, error: "Unsupported image type" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ ok: false, error: "Image too large (max 8MB)" }, { status: 400 });
    }

    const raw = Buffer.from(await file.arrayBuffer());
    const { buffer } = await compressImageBuffer(raw, file.type);
    const filename = `${randomUUID()}.jpg`;
    const storageDir = path.join(process.cwd(), "public", "debug-storage");

    await mkdir(storageDir, { recursive: true });
    await writeFile(path.join(storageDir, filename), buffer);

    const origin = new URL(req.url).origin;
    const imageUrl = `${origin}/debug-storage/${filename}`;

    return NextResponse.json({ ok: true, data: { imageUrl, filename } });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 },
    );
  }
}
