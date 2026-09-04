import type { Metadata } from "next";
import { AdminWorkspace } from "@/features/admin/admin-workspace";

export const metadata: Metadata = {
  title: "Content admin",
  robots: { index: false, follow: false },
};
export default function AdminPage() {
  return (
    <section className="admin-page">
      <div className="shell">
        <AdminWorkspace />
      </div>
    </section>
  );
}
