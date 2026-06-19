"use client";

import { CarouselSlidesInput, type SlideDraft } from "./carousel-slides-input";
import { MediaSourceInput } from "./media-source-input";
import { ATTACHMENT_TYPES } from "./post-slide";

export interface PostMaterialDraft {
  type: string;
  label: string;
  url: string;
  slides: SlideDraft[];
}

export function createEmptyMaterialDraft(): PostMaterialDraft {
  return {
    type: "post_feed",
    label: "",
    url: "",
    slides: [
      { url: "", mediaType: "image" },
      { url: "", mediaType: "image" },
    ],
  };
}

export function getAttachmentAspectRatio(type: string): "square" | "story" | "auto" {
  if (type === "post_stories" || type === "reels_cover") return "story";
  if (type === "post_feed" || type === "post_linkedin") return "square";
  return "auto";
}

export function isMaterialDraftValid(draft: PostMaterialDraft): boolean {
  if (draft.type === "carousel") {
    return draft.slides.filter((item) => item.url.trim().length > 0).length >= 2;
  }
  return Boolean(draft.url.trim());
}

export function getMaterialDraftLabel(draft: PostMaterialDraft): string {
  if (draft.type === "other" && draft.label.trim()) return draft.label.trim();
  return ATTACHMENT_TYPES[draft.type] ?? draft.type;
}

export function buildAttachmentRequestBody(draft: PostMaterialDraft): {
  type: string;
  label: string | null;
  url: string;
  slides?: SlideDraft[];
} {
  if (draft.type === "carousel") {
    const slides = draft.slides.filter((item) => item.url.trim().length > 0);
    return {
      type: draft.type,
      label: null,
      url: slides[0].url,
      slides,
    };
  }
  return {
    type: draft.type,
    label: draft.type === "other" ? draft.label.trim() || null : null,
    url: draft.url.trim(),
  };
}

interface PostMaterialFormProps {
  draft: PostMaterialDraft;
  onChange: (draft: PostMaterialDraft) => void;
  dense?: boolean;
}

export function PostMaterialForm({ draft, onChange, dense = false }: PostMaterialFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Tipo de material</label>
        <select
          value={draft.type}
          onChange={(e) => onChange({ ...draft, type: e.target.value })}
          className="text-sm px-3 py-2 border rounded-lg bg-background w-full"
        >
          {Object.entries(ATTACHMENT_TYPES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {draft.type === "other" && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Nome personalizado</label>
          <input
            type="text"
            value={draft.label}
            onChange={(e) => onChange({ ...draft, label: e.target.value })}
            placeholder="Ex.: Banner site, Thumb YouTube..."
            className="text-sm px-3 py-2 border rounded-lg bg-background w-full"
          />
        </div>
      )}

      {draft.type === "carousel" ? (
        <CarouselSlidesInput
          slides={draft.slides}
          onChange={(slides) => onChange({ ...draft, slides })}
          aspectRatio={getAttachmentAspectRatio(draft.type)}
          dense={dense}
        />
      ) : (
        <MediaSourceInput
          value={draft.url}
          onChange={(url) => onChange({ ...draft, url })}
          aspectRatio={getAttachmentAspectRatio(draft.type)}
          compact
          dense={dense}
          allowVideo
        />
      )}
    </div>
  );
}
