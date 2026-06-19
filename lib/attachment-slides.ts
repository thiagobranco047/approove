import type { AnnotationPin } from "@/lib/types";
import { inferMediaType, type MediaType } from "@/lib/media-utils";

export interface SlideInput {
  url: string;
  mediaType?: MediaType;
}

export interface AttachmentSlideRecord {
  id: string;
  order: number;
  url: string;
  mediaType?: string;
  label?: string | null;
  pins?: AnnotationPin[];
}

export interface AttachmentVersionRecord {
  id: string;
  url: string;
  version: number;
  createdAt?: string;
  slides?: AttachmentSlideRecord[];
  pins?: AnnotationPin[];
}

export interface ResolvedSlide {
  id: string | null;
  order: number;
  url: string;
  mediaType: MediaType;
  label?: string | null;
  pins: AnnotationPin[];
}

export function normalizeSlideUrls(url?: string, urls?: string[]): string[] {
  if (urls && urls.length > 0) {
    return urls.filter((item) => typeof item === "string" && item.trim().length > 0);
  }
  if (url && url.trim().length > 0) return [url.trim()];
  return [];
}

export function normalizeSlides(
  url?: string,
  urls?: string[],
  slides?: SlideInput[]
): SlideInput[] {
  if (slides && slides.length > 0) {
    return slides
      .filter((slide) => slide.url.trim().length > 0)
      .map((slide) => ({
        url: slide.url.trim(),
        mediaType: slide.mediaType ?? inferMediaType(slide.url),
      }));
  }

  return normalizeSlideUrls(url, urls).map((slideUrl) => ({
    url: slideUrl,
    mediaType: inferMediaType(slideUrl),
  }));
}

export function resolveVersionSlides(version: AttachmentVersionRecord): ResolvedSlide[] {
  if (version.slides && version.slides.length > 0) {
    return [...version.slides]
      .sort((a, b) => a.order - b.order)
      .map((slide) => ({
        id: slide.id,
        order: slide.order,
        url: slide.url,
        mediaType: (slide.mediaType === "video" ? "video" : "image") as MediaType,
        label: slide.label,
        pins: slide.pins ?? [],
      }));
  }

  return [
    {
      id: null,
      order: 0,
      url: version.url,
      mediaType: inferMediaType(version.url),
      label: null,
      pins: version.pins ?? [],
    },
  ];
}

export function isSequenceAttachment(type: string, slideCount: number): boolean {
  return type === "carousel" || slideCount > 1;
}

export function buildSlideCreates(slides: SlideInput[]) {
  return slides.map((slide, order) => ({
    url: slide.url,
    order,
    mediaType: slide.mediaType ?? inferMediaType(slide.url),
    label: order === 0 ? null : `Slide ${order + 1}`,
  }));
}

export const attachmentVersionInclude = {
  orderBy: { version: "asc" as const },
  include: {
    slides: {
      orderBy: { order: "asc" as const },
      include: {
        pins: { orderBy: { createdAt: "asc" as const } },
      },
    },
    pins: {
      where: { attachmentSlideId: null },
      orderBy: { createdAt: "asc" as const },
    },
  },
};
