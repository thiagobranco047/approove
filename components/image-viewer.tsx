"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Maximize2 } from "lucide-react";
import { Button } from "./ui/button";

interface ImageViewerProps {
  src: string;
  alt: string;
  className?: string;
}

export function ImageViewer({ src, alt, className = "" }: ImageViewerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div 
        className="relative group h-full w-full flex items-center justify-center cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className={`max-w-full max-h-full w-auto h-auto object-contain transition-opacity group-hover:opacity-90 ${className}`}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-background/90 shadow-lg">
            <Maximize2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] w-fit h-fit max-h-[95vh] p-0 bg-black border-none overflow-hidden">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={src}
              alt={alt}
              className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain"
              style={{ maxWidth: '90vw', maxHeight: '90vh' }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
