export type SniffedMedia = { mime: string; ext: string };

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.subarray(start, end));
}

/**
 * Tipo real do arquivo pelos primeiros bytes (o Content-Type do upload vem do cliente).
 * Só formatos que o app renderiza; SVG/HTML ficam de fora por poderem carregar script.
 */
export function sniffMedia(bytes: Uint8Array): SniffedMedia | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (ascii(bytes, 0, 8) === "\x89PNG\r\n\x1a\n") return { mime: "image/png", ext: "png" };
  if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a") {
    return { mime: "image/gif", ext: "gif" };
  }
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") {
    return { mime: "image/webp", ext: "webp" };
  }
  if (ascii(bytes, 4, 8) === "ftyp") {
    return ascii(bytes, 8, 12) === "qt  "
      ? { mime: "video/quicktime", ext: "mov" }
      : { mime: "video/mp4", ext: "mp4" };
  }
  return null;
}
