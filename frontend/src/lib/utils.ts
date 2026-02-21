import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Use proxy for S3/LocalStack image URLs to avoid 403 when loading in the browser. */
export function getEventImageUrl(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined;
  if (imageUrl.includes(":4566")) {
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    return `${base}/api/v1/images/proxy?url=${encodeURIComponent(imageUrl)}`;
  }
  return imageUrl;
}
