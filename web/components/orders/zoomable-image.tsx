"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block h-72 w-full overflow-hidden rounded-md border border-border"
      >
        <Image src={src} alt={alt} fill sizes="400px" className="object-contain" />
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          <ZoomIn className="size-3.5" /> Zoom
        </span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="!max-w-3xl">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <div className="relative h-[70vh] w-full">
            <Image src={src} alt={alt} fill className="object-contain" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
