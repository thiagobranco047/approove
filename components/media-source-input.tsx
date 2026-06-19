"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { ImageUpload } from "./image-upload";
import { inferMediaType, type MediaType } from "@/lib/media-utils";

interface MediaSourceInputProps {
  value: string;
  onChange: (url: string, mediaType?: MediaType) => void;
  aspectRatio?: "square" | "story" | "auto";
  compact?: boolean;
  dense?: boolean;
  allowUrl?: boolean;
  allowVideo?: boolean;
}

export function MediaSourceInput({
  value,
  onChange,
  aspectRatio = "auto",
  compact = false,
  dense = false,
  allowUrl = true,
  allowVideo = false,
}: MediaSourceInputProps) {
  const [useUrl, setUseUrl] = useState(false);

  const emitChange = (url: string | null) => {
    const next = url ?? "";
    onChange(next, next ? inferMediaType(next) : undefined);
  };

  if (useUrl) {
    return (
      <div className="space-y-2">
        <input
          type="url"
          value={value}
          onChange={(e) => emitChange(e.target.value)}
          placeholder="https://exemplo.com/arquivo.jpg"
          className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          autoFocus
        />
        <button
          type="button"
          onClick={() => {
            setUseUrl(false);
            emitChange("");
          }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Fazer upload de arquivo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ImageUpload
        value={value || null}
        onChange={(url, mediaType) => onChange(url ?? "", mediaType)}
        aspectRatio={aspectRatio}
        compact={compact}
        dense={dense}
        allowVideo={allowVideo}
      />
      {allowUrl && (
        <button
          type="button"
          onClick={() => {
            setUseUrl(true);
            emitChange("");
          }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Link2 className="h-3 w-3" />
          Ou usar URL externa
        </button>
      )}
    </div>
  );
}
