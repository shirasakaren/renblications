import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

const allowedDocumentTypes = new Set([
  "application/pdf",
  "application/epub+zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "text/markdown",
]);

export function isAllowedUpload(mimeType: string): boolean {
  return (
    mimeType.startsWith("image/") ||
    mimeType.startsWith("video/") ||
    mimeType.startsWith("audio/") ||
    allowedDocumentTypes.has(mimeType)
  );
}

function storageConfigured(): boolean {
  return Boolean(
    process.env.AWS_ENDPOINT_URL &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_S3_BUCKET_NAME,
  );
}

function getS3(): S3Client {
  return new S3Client({
    endpoint: process.env.AWS_ENDPOINT_URL,
    region: process.env.AWS_DEFAULT_REGION || "auto",
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
  });
}

export function safeFileName(name: string): string {
  const extension = path.extname(name).toLowerCase().replace(/[^.a-z0-9]/g, "").slice(0, 12);
  return extension || ".bin";
}

export async function storeFile(input: {
  id: string;
  originalName: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<{ storageKey: string; provider: "s3" | "local" }> {
  const storageKey = `media/${input.id}${safeFileName(input.originalName)}`;
  if (storageConfigured()) {
    await getS3().send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: storageKey,
        Body: input.buffer,
        ContentType: input.mimeType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return { storageKey, provider: "s3" };
  }

  const absolute = path.join(process.cwd(), "public", "uploads", path.basename(storageKey));
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, input.buffer);
  return { storageKey: path.basename(storageKey), provider: "local" };
}

export async function loadFile(input: {
  storageKey: string;
  provider: "s3" | "local";
}): Promise<Uint8Array> {
  if (input.provider === "s3") {
    const response = await getS3().send(
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: input.storageKey,
      }),
    );
    if (!response.Body) throw new Error("Stored object has no body.");
    return response.Body.transformToByteArray();
  }
  const absolute = path.join(process.cwd(), "public", "uploads", path.basename(input.storageKey));
  return readFile(absolute);
}
