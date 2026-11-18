type MediaLike = {
  url?: string | null;
} | null | undefined | number | string;

/**
 * Resolve a Payload media field to a browser-usable URL.
 * Absolute Blob URLs pass through; relative `/api/media/...` paths get the server origin.
 */
export function mediaUrl(media: MediaLike, serverURL = process.env.NEXT_PUBLIC_SERVER_URL || ""): string {
  if (!media || typeof media === "number" || typeof media === "string") return "";
  const url = media.url;
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = serverURL.replace(/\/$/, "");
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}
