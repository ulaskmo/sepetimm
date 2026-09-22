import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * Neon Object Storage is S3-compatible. Credentials and endpoint come from the
 * AWS_* variables that `neon env pull` writes, so nothing is hardcoded and a
 * different branch gets its own bucket automatically.
 */

/** Product photos — public_read, so the shop can be served from cache. */
export const PUBLIC_BUCKET = "sepetim-urun";
/** Customer uploads — private; nobody should reach these by guessing a URL. */
export const PRIVATE_BUCKET = "sepetimbucket";

let client: S3Client | null = null;

function s3(): S3Client {
  if (!client) {
    if (!process.env.AWS_ENDPOINT_URL_S3) {
      throw new Error("AWS_ENDPOINT_URL_S3 yok — `neon env pull` çalıştırın.");
    }
    // Path style: the endpoint is per-branch, buckets are a path segment.
    client = new S3Client({ forcePathStyle: true });
  }
  return client;
}

export function publicUrl(key: string): string {
  return `${process.env.AWS_ENDPOINT_URL_S3}/${PUBLIC_BUCKET}/${key}`;
}

/** Stores an object and returns the URL it can be served from. */
export async function putPublic(
  key: string,
  body: Uint8Array,
  contentType: string
): Promise<string> {
  await s3().send(
    new PutObjectCommand({
      Bucket: PUBLIC_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Product photos are content-addressed by timestamp and never rewritten,
      // so they can be cached hard.
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return publicUrl(key);
}
