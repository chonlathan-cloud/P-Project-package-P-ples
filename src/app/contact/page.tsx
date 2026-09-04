import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { company } from "@/content/company";

export const metadata: Metadata = {
  title: "ติดต่อ",
  description:
    "ติดต่อทีม DD Box Printing ผ่าน LINE Official Account, LINE ฝ่ายขาย โทรศัพท์ Facebook อีเมล หรือส่งรายละเอียดงานเพื่อเริ่มประเมินบรรจุภัณฑ์",
  alternates: { canonical: "/contact" },
};

const preparationItems = [
  "รูปสินค้า หรือกล่องเดิมที่ใช้อยู่",
  "ขนาดและน้ำหนักสินค้าเท่าที่ทราบ",
  "จำนวนที่ต้องการโดยประมาณ",
  "กำหนดใช้งานและพื้นที่จัดส่ง",
] as const;

export default function ContactPage() {
  return (
    <>
      <section className="contact-hero-section">
        <div className="shell contact-hero-grid">
          <div className="contact-hero-copy">
            <div>
              <p className="eyebrow light">CONTACT DD BOX</p>
              <h1>
                คุยเรื่องกล่อง
                <br />
                กับคุณเปิ้ล
              </h1>
              <p>
                เริ่มได้จากรูปสินค้า กล่องเดิม ขนาด หรือสเปกเท่าที่มี
                ทีมจะช่วยดูว่าควรเตรียมข้อมูลอะไรต่อก่อนประเมินงาน
              </p>
              <div className="contact-hero-actions">
                <a className="button button-yellow" href={company.lineOaHref}>
                  เพิ่มเพื่อน LINE OA {company.lineOaId}
                </a>
                <a
                  className="button button-outline-light"
                  href={`tel:${company.phoneHref}`}
                >
                  โทร {company.phoneDisplay}
                </a>
              </div>
            </div>
            <div className="contact-person">
              <span>ผู้รับผิดชอบงานกล่องและสิ่งพิมพ์</span>
              <strong>{company.contactName}</strong>
            </div>
          </div>
          <figure className="contact-hero-media">
            <Image
              src="/images/generated/contact-consultation-v1.webp"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 52vw"
              alt="ภาพประกอบมือสองคนกำลังตรวจตัวอย่างกล่อง แบบคลี่ และวัสดุกระดาษร่วมกัน"
            />
            <figcaption>
              ภาพประกอบเพื่อแนะนำการเตรียมข้อมูล ไม่ใช่ผลงานลูกค้าหรือภาพทีมจริง
            </figcaption>
          </figure>
        </div>
      </section>

      <section
        className="contact-methods-section"
        aria-labelledby="contact-methods-heading"
      >
        <div className="shell contact-section-heading">
          <div>
            <p className="eyebrow">DIRECT CONTACT</p>
            <h2 id="contact-methods-heading">เลือกช่องทางที่สะดวก</h2>
          </div>
          <p>
            เริ่มคุยและติดตามงานผ่าน LINE OA หรือเลือกติดต่อฝ่ายขายโดยตรง
            หากมีไฟล์หลายรายการสามารถส่งทางอีเมลได้
          </p>
        </div>
        <div className="shell contact-oa-feature">
          <div className="contact-oa-copy">
            <span className="contact-method-label">ช่องทางแนะนำ</span>
            <h3>เริ่มคุยกับ DD Box ผ่าน LINE Official Account</h3>
            <p>
              ส่งรูปสินค้า กล่องตัวอย่าง หรือข้อมูลเบื้องต้นไว้ในช่องทางเดียว
              เพื่อให้ทีมติดตามการสนทนาและดูแลงานต่อได้สะดวก
            </p>
            <a className="button" href={company.lineOaHref}>
              เพิ่มเพื่อน LINE OA {company.lineOaId}
            </a>
          </div>
          <a
            className="contact-oa-qr"
            href={company.lineOaHref}
            aria-label={`สแกนหรือเปิด LINE OA ${company.lineOaId}`}
          >
            <Image
              src="/images/line-oa-qr.webp"
              width={428}
              height={426}
              alt={`QR Code สำหรับเพิ่มเพื่อน LINE OA ${company.lineOaId}`}
            />
            <span>สแกนเพื่อเพิ่มเพื่อน</span>
          </a>
        </div>
        <nav
          className="shell contact-methods-list"
          aria-label="ช่องทางติดต่ออื่น"
        >
          <a id="line-sale" href={company.lineSaleHref}>
            <span className="contact-method-label">LINE ฝ่ายขาย</span>
            <strong>{company.lineSaleId}</strong>
            <span>
              คุยกับคุณเปิ้ลโดยตรงเรื่องสเปก ราคา และงานที่กำลังดำเนินการ
            </span>
            <b aria-hidden="true">→</b>
          </a>
          <a id="phone" href={`tel:${company.phoneHref}`}>
            <span className="contact-method-label">โทรศัพท์</span>
            <strong>{company.phoneDisplay}</strong>
            <span>คุยกับคุณเปิ้ลเรื่องโจทย์และข้อมูลที่ควรเตรียม</span>
            <b aria-hidden="true">→</b>
          </a>
          <a href={company.facebookHref}>
            <span className="contact-method-label">Facebook</span>
            <strong>DD Box Printing</strong>
            <span>ติดตามข้อมูลและส่งข้อความผ่าน Facebook Page</span>
            <b aria-hidden="true">→</b>
          </a>
          <a href={`mailto:${company.email}`}>
            <span className="contact-method-label">อีเมล</span>
            <strong>{company.email}</strong>
            <span>เหมาะสำหรับส่งสเปก ไฟล์งาน หรือรายละเอียดหลายรายการ</span>
            <b aria-hidden="true">→</b>
          </a>
        </nav>
      </section>

      <section className="contact-brief-section">
        <div className="shell contact-brief-grid">
          <div>
            <p className="eyebrow light">PREPARE YOUR BRIEF</p>
            <h2>มีข้อมูลไม่ครบก็เริ่มได้</h2>
            <p>
              ส่งข้อมูลเท่าที่มีผ่านแบบฟอร์ม
              แล้วเลือกว่ามีสเปกพร้อมหรือยังต้องการคำแนะนำ
            </p>
            <Link className="button button-yellow" href="/quote">
              เปิดแบบฟอร์มส่งรายละเอียดงาน
            </Link>
          </div>
          <div>
            <p className="contact-brief-label">
              ข้อมูลที่ช่วยให้คุยงานต่อได้เร็วขึ้น
            </p>
            <ul className="contact-preparation-list">
              {preparationItems.map((item, index) => (
                <li key={item}>
                  <span>0{index + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="contact-location-section">
        <div className="shell contact-location-grid">
          <figure className="contact-location-media">
            <Image
              src="/images/factory-cutter.jpg"
              fill
              sizes="(max-width: 900px) 100vw, 48vw"
              alt="เครื่องตัดและพื้นที่เตรียมกระดาษภายในโรงงาน DD Box Printing"
            />
            <figcaption>พื้นที่เตรียมกระดาษภายในโรงงาน</figcaption>
          </figure>
          <div className="contact-location-copy">
            <p className="eyebrow">FACTORY LOCATION</p>
            <h2>โรงงานอยู่ที่บางโฉลง บางพลี</h2>
            <address>
              <strong>{company.displayName}</strong>
              <p>{company.address}</p>
            </address>
            <a className="button-secondary" href={company.mapHref}>
              เปิดที่อยู่ใน Google Maps
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
