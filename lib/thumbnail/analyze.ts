export type ThumbnailBreakdown = {
  dimensions: number;
  fileSize: number;
  colors: number;
  text: number;
  faces: number;
  composition: number;
};

export type ThumbnailSuggestion = {
  priority: "high" | "medium" | "low";
  message: string;
};

export type ThumbnailAnalysis = {
  overallScore: number;
  breakdown: ThumbnailBreakdown;
  suggestions: ThumbnailSuggestion[];
  meta: {
    width: number;
    height: number;
    sizeBytes: number;
    dominantColor: string;
    hasText: boolean;
  };
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function scoreDimensions(w: number, h: number): number {
  if (w === 1280 && h === 720) return 100;
  const ratio = w / h;
  const ratioOk = Math.abs(ratio - 16 / 9) < 0.05;
  if (ratioOk && w >= 1280) return 88;
  if (ratioOk) return 72;
  return 45;
}

function scoreFileSize(bytes: number): number {
  if (bytes <= 2 * 1024 * 1024) return 100;
  if (bytes <= 5 * 1024 * 1024) return 75;
  return 40;
}

function getDominantColor(ctx: CanvasRenderingContext2D, w: number, h: number): string {
  const sample = ctx.getImageData(0, 0, Math.min(w, 64), Math.min(h, 36));
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let i = 0; i < sample.data.length; i += 16) {
    r += sample.data[i] ?? 0;
    g += sample.data[i + 1] ?? 0;
    b += sample.data[i + 2] ?? 0;
    count += 1;
  }
  if (count === 0) return "#888888";
  return `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`;
}

function scoreContrast(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  const img = ctx.getImageData(0, 0, w, h);
  let min = 255;
  let max = 0;
  for (let i = 0; i < img.data.length; i += 40) {
    const lum = 0.299 * (img.data[i] ?? 0) + 0.587 * (img.data[i + 1] ?? 0) + 0.114 * (img.data[i + 2] ?? 0);
    min = Math.min(min, lum);
    max = Math.max(max, lum);
  }
  const spread = max - min;
  if (spread >= 160) return 95;
  if (spread >= 110) return 78;
  if (spread >= 70) return 62;
  return 40;
}

/** Client-side thumbnail analysis using canvas (no paid AI). */
export async function analyzeThumbnailSource(
  source: string | File,
  detectedText?: string
): Promise<ThumbnailAnalysis> {
  const img = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(img, 0, 0);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const sizeBytes = source instanceof File ? source.size : 0;

  const dimensions = scoreDimensions(w, h);
  const fileSize = source instanceof File ? scoreFileSize(sizeBytes) : 85;
  const colors = scoreContrast(ctx, w, h);
  const hasText = Boolean(detectedText && detectedText.trim().length > 2);
  const text = hasText ? clamp(55 + Math.min(detectedText!.length, 40), 55, 92) : 50;
  const faces = 70;
  const composition = w >= 640 && h >= 360 ? 80 : 55;
  const dominantColor = getDominantColor(ctx, w, h);

  const breakdown: ThumbnailBreakdown = { dimensions, fileSize, colors, text, faces, composition };
  const overallScore = Math.round(
    (dimensions + fileSize + colors + text + faces + composition) / 6
  );

  const suggestions: ThumbnailSuggestion[] = [];
  if (dimensions < 80) {
    suggestions.push({
      priority: "high",
      message: "Use 1280×720 (16:9) for crisp YouTube thumbnails.",
    });
  }
  if (colors < 70) {
    suggestions.push({
      priority: "high",
      message: "Increase contrast between subject and background for mobile readability.",
    });
  }
  if (!hasText) {
    suggestions.push({
      priority: "medium",
      message: "Add 2–4 bold words; thumbnails with readable text often perform better.",
    });
  }
  if (fileSize < 80 && source instanceof File) {
    suggestions.push({
      priority: "medium",
      message: "Compress the image under 2MB for faster loads.",
    });
  }
  if (suggestions.length === 0) {
    suggestions.push({ priority: "low", message: "Strong baseline—A/B test against a variant." });
  }

  return {
    overallScore,
    breakdown,
    suggestions,
    meta: { width: w, height: h, sizeBytes, dominantColor, hasText },
  };
}

function loadImage(source: string | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    if (source instanceof File) {
      img.src = URL.createObjectURL(source);
    } else {
      img.src = source;
    }
  });
}
