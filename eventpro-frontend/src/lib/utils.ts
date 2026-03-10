import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Use proxy for S3/LocalStack image URLs to avoid 403 when loading in the browser. */
export function getEventImageUrl(imageUrl: string | undefined): string | undefined {
  if (!imageUrl || typeof imageUrl !== "string") return undefined;
  const trimmed = imageUrl.trim();
  if (!trimmed) return undefined;
  // Ignore non-http URLs (e.g. chrome-extension:, data:) so they are never used as img src
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return undefined;
  if (trimmed.startsWith("chrome-extension:") || trimmed.startsWith("moz-extension:")) return undefined;
  if (trimmed.includes(":4566")) {
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    return `${base}/api/v1/images/proxy?url=${encodeURIComponent(trimmed)}`;
  }
  return trimmed;
}

/** Convert YouTube or Vimeo URL to embed URL for iframe. Returns null if not supported. */
export function getPromotionalVideoEmbedUrl(url: string | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  // YouTube: watch?v=ID, youtu.be/ID, embed/ID
  const ytMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
  // Vimeo: vimeo.com/ID
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}
