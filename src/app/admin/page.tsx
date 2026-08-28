import type { Metadata } from "next";
import { AdminGalleryEditor } from "@/features/gallery/admin-gallery-editor";

export const metadata: Metadata = {
  title: "Content admin",
  robots: { index: false, follow: false },
};
export default function AdminPage() {
  return (
    <section className="admin-page">
      <div className="shell">
        <AdminGalleryEditor />
      </div>
    </section>
  );
}
