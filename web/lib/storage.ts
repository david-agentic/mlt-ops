import "server-only";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

/**
 * Payment-proof uploads. Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set
 * (production), falling back to local public/uploads in dev so the flow
 * works before a Blob store is provisioned.
 */
export async function saveUpload(file: File): Promise<string> {
  const ext = path.extname(file.name) || "";
  const filename = `${randomUUID()}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(filename, file, { access: "public" });
    return blob.url;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}
