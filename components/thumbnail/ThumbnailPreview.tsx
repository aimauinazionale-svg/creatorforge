"use client";

import Image from "next/image";

export default function ThumbnailPreview({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <Image src={src} alt={alt} width={640} height={360} className="h-auto w-full object-cover" unoptimized />
    </div>
  );
}
