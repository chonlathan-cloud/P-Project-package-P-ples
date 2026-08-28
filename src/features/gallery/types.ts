export type GalleryItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  status: "draft" | "published" | "archived";
  version: number;
  image: {
    id: string;
    url: string;
    fallback_url: string | null;
    width: number;
    height: number;
    alt: string;
  };
};
