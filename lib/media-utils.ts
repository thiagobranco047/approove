export type MediaType = "image" | "video";

const VIDEO_EXT = /\.(mp4|mov|webm|m4v)(\?|#|$)/i;

export function inferMediaType(url: string): MediaType {
  if (VIDEO_EXT.test(url)) return "video";
  return "image";
}

export function isVideoUrl(url: string): boolean {
  return inferMediaType(url) === "video";
}

export function isVideoMime(mime: string): boolean {
  return mime.startsWith("video/");
}

export const MEDIA_UPLOAD_ACCEPT = "image/jpeg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,video/quicktime,video/webm";
