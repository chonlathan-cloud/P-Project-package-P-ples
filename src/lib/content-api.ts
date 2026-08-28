import { serverEnv } from "@/lib/env";
import type { GalleryItem } from "@/features/gallery/types";

export async function getPublishedGallery(): Promise<GalleryItem[]> {
  const response = await fetch(
    `${serverEnv.CONTENT_API_URL}/v1/gallery-items`,
    {
      next: { revalidate: 60, tags: ["gallery"] },
      headers: { Accept: "application/json" },
    },
  );
  if (!response.ok) {
    throw new Error(`content API returned ${response.status}`);
  }
  return (await response.json()) as GalleryItem[];
}
