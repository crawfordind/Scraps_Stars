const MAX_DIMENSION = 640;
const JPEG_QUALITY = 72;

/** Shrink images before vision API calls to minimize token cost. */
export async function compressImageBuffer(input: Buffer, mime: string): Promise<{ buffer: Buffer; mime: string }> {
  try {
    const sharp = (await import("sharp")).default;
    const buffer = await sharp(input)
      .rotate()
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();

    return { buffer, mime: "image/jpeg" };
  } catch {
    return { buffer: input, mime };
  }
}
