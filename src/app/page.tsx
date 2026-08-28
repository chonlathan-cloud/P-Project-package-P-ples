import Link from "next/link";
import { GalleryGrid } from "@/components/gallery-grid";
import { PackageVisual } from "@/components/package-visual";
import type { GalleryItem } from "@/features/gallery/types";
import { getPublishedGallery } from "@/lib/content-api";

export default async function HomePage() {
  let gallery: GalleryItem[] = [];
  try {
    gallery = (await getPublishedGallery()).slice(0, 3);
  } catch {
    gallery = [];
  }
  return (
    <>
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">CUSTOM PACKAGING · MADE TO YOUR BRIEF</p>
            <h1>
              เริ่มทำกล่อง
              <br />
              จากข้อมูลที่คุณมี
            </h1>
            <p className="lead">
              มีสเปกพร้อมแล้ว หรือยังไม่แน่ใจว่าควรเริ่มจากกล่องแบบไหน
              เลือกเส้นทางที่ตรงกับงานของคุณ
            </p>
            <div className="path-actions" aria-label="เลือกเส้นทางขอราคา">
              <Link
                className="path-link path-primary"
                href="/quote?path=has_specifications"
              >
                <span>01</span>
                <strong>ฉันมีสเปกงานแล้ว</strong>
                <small>แจ้งขนาด วัสดุ และจำนวน</small>
              </Link>
              <Link className="path-link" href="/quote?path=needs_guidance">
                <span>02</span>
                <strong>ฉันต้องการคำแนะนำ</strong>
                <small>เริ่มจากสินค้าและเป้าหมาย</small>
              </Link>
            </div>
          </div>
          <PackageVisual />
        </div>
      </section>

      <section className="section proof-intro">
        <div className="shell section-heading split-heading">
          <div>
            <p className="eyebrow">WORK, NOT PROMISES</p>
            <h2>ดูรายละเอียดจากงานที่เผยแพร่ได้จริง</h2>
          </div>
          <Link className="text-link" href="/gallery">
            ดูผลงานทั้งหมด →
          </Link>
        </div>
        <div className="shell">
          <GalleryGrid items={gallery} />
        </div>
      </section>

      <section className="section offer-section">
        <div className="shell">
          <div className="section-heading">
            <p className="eyebrow">CHOOSE BY BUSINESS STAGE</p>
            <h2>ขอบเขตงานต่างกัน วิธีเริ่มก็ต่างกัน</h2>
          </div>
          <div className="offer-rows">
            <Link href="/solutions/starter">
              <span>01</span>
              <h3>เริ่มสินค้าใหม่</h3>
              <p>สำรวจรูปแบบกล่องและข้อมูลที่ต้องใช้ก่อนประเมินงาน</p>
              <strong>Starter →</strong>
            </Link>
            <Link href="/solutions/growth">
              <span>02</span>
              <h3>แบรนด์กำลังเติบโต</h3>
              <p>จัดระบบสเปกและภาพลักษณ์ให้พร้อมสำหรับการสั่งผลิตต่อเนื่อง</p>
              <strong>Growth →</strong>
            </Link>
            <Link href="/solutions/scale">
              <span>03</span>
              <h3>งานผลิตต่อเนื่อง</h3>
              <p>เริ่มจากข้อกำหนด ปริมาณ และแผนการจัดส่งของทีมจัดซื้อ</p>
              <strong>Scale →</strong>
            </Link>
          </div>
        </div>
      </section>

      <section className="section process-section">
        <div className="shell process-grid">
          <div>
            <p className="eyebrow">BRIEF TO EVALUATION</p>
            <h2>
              ข้อมูลชัดขึ้น
              <br />
              ประเมินงานได้ตรงขึ้น
            </h2>
          </div>
          <ol>
            <li>
              <span>1</span>
              <div>
                <h3>เลือกจุดเริ่ม</h3>
                <p>ส่งสเปกที่มี หรืออธิบายสินค้าและข้อจำกัด</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <h3>เติมรายละเอียด</h3>
                <p>ระบุจำนวน ขนาด กำหนดใช้ และพื้นที่จัดส่งเท่าที่ทราบ</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <h3>ทีมตรวจสอบ</h3>
                <p>ข้อมูลจะถูกส่งให้ทีมงานประเมินผ่านช่องทางที่คุณเลือก</p>
              </div>
            </li>
          </ol>
        </div>
      </section>
    </>
  );
}
