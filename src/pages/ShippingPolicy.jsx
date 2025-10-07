import React, { useEffect } from "react";
import "./ShippingPolicy.css";

export default function ShippingPolicy() {
  // — Active TOC highlight when scrolling
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll(".policy__section"));
    const tocLinks = new Map(
      Array.from(document.querySelectorAll(".policy__toc a")).map((a) => [
        a.getAttribute("href")?.slice(1),
        a,
      ])
    );

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("id");
          const link = tocLinks.get(id);
          if (!link) return;
          if (entry.isIntersecting) link.classList.add("active");
          else link.classList.remove("active");
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0.01 }
    );

    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const Section = ({ id, title, children }) => (
    <section id={id} className="policy__section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="policy__sectionTitle">{title}</h2>
      <div className="policy__sectionContent">{children}</div>
    </section>
  );

  const today = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="policy" role="main">
      <header className="policy__head">
        <h1 className="policy__title">นโยบายการจัดส่ง (Shipping Policy)</h1>
        <p className="policy__intro">
          เอกสารนี้กำหนดเงื่อนไข วิธีการ และความรับผิดเกี่ยวกับการจัดส่งสินค้าของ ToyStore
          เพื่อให้ผู้ซื้อได้รับประสบการณ์ที่โปร่งใส ปลอดภัย และตรวจสอบได้
        </p>
      </header>

      <nav className="policy__toc" aria-label="สารบัญ">
        <ol>
          <li><a href="#scope">1) ขอบเขตและคำนิยาม</a></li>
          <li><a href="#methods">2) วิธี/ผู้ให้บริการจัดส่ง</a></li>
          <li><a href="#fees-times">3) ค่าบริการและระยะเวลา (SLA)</a></li>
          <li><a href="#tracking">4) การติดตามพัสดุ</a></li>
          <li><a href="#delay-damage">5) ความล่าช้า สูญหาย หรือเสียหาย</a></li>
          <li><a href="#address-change">6) เปลี่ยนที่อยู่/ส่งคืน</a></li>
          <li><a href="#responsibility">7) ความรับผิดชอบของคู่สัญญา</a></li>
          <li><a href="#restrictions">8) ข้อจำกัดการขนส่ง</a></li>
          <li><a href="#contact">9) ช่องทางติดต่อ</a></li>
          <li><a href="#versioning">10) เวอร์ชันและการแก้ไข</a></li>
        </ol>
      </nav>

      {/* 1) */}
      <Section id="scope" title="1) ขอบเขตและคำนิยาม">
        <ul>
          <li>
            “การจัดส่ง” หมายถึงกระบวนการที่ ToyStore หรือผู้ให้บริการขนส่งคู่สัญญา
            จัดส่งสินค้าจากคลัง/ร้านค้าถึงผู้รับตามที่อยู่ที่ระบุในระบบ
          </li>
          <li>
            นโยบายนี้ครอบคลุมคำสั่งซื้อที่ชำระเงินสำเร็จในเว็บไซต์/แอป ToyStore เท่านั้น
            และใช้กับคำสั่งซื้อภายในประเทศไทยโดยหลัก (ระบุไว้ในข้อ 8 กรณีต่างประเทศ)
          </li>
          <li>
            คำว่า “วันทำการ” หมายถึงวันจันทร์–ศุกร์ (ไม่นับรวมวันหยุดราชการและวันหยุดนักขัตฤกษ์)
          </li>
          <li>
            กรณีมีเอกสารกำหนดเงื่อนไขเฉพาะแคมเปญ จะถือว่าเอกสารนั้นเป็นส่วนเพิ่มเติมของนโยบายฉบับนี้
          </li>
        </ul>
      </Section>

      {/* 2) */}
      <Section id="methods" title="2) วิธี/ผู้ให้บริการจัดส่ง">
        <p>
          เราใช้บริการจากผู้ให้บริการขนส่งมาตรฐานในประเทศ (เช่น ไปรษณีย์ไทย, Kerry, J&amp;T, Flash ฯลฯ)
          โดยระบบจะเลือกวิธีที่เหมาะสมตามน้ำหนัก ขนาด ปลายทาง และตัวเลือกที่ลูกค้าเลือกในขั้นตอนชำระเงิน
        </p>
        <ul>
          <li><strong>ช่องทางจัดส่ง:</strong> Standard / Express / Same-day (เฉพาะบางพื้นที่)</li>
          <li><strong>การแพ็กสินค้า:</strong> ใช้วัสดุกันกระแทกและกล่องที่เหมาะสม ลดความเสี่ยงต่อความเสียหาย</li>
          <li><strong>พื้นที่ห่างไกล:</strong> ระยะเวลาจัดส่งอาจนานขึ้น และ/หรือมีค่าบริการเพิ่มเติมตามเรทผู้ให้บริการ</li>
          <li><strong>ที่อยู่กลุ่มชุมชนหรืออาคารสูง:</strong> อาจต้องนัดหมายส่งกับผู้รับ/นิติบุคคลตามระเบียบสถานที่</li>
        </ul>
      </Section>

      {/* 3) */}
      <Section id="fees-times" title="3) ค่าบริการและระยะเวลาโดยประมาณ (SLA)">
        <div className="policy__note">ระยะเวลาต่อไปนี้เป็นการประมาณการ ไม่ถือเป็นการรับประกัน เนื่องจากอาจได้รับผลกระทบจากปัจจัยภายนอก เช่น สภาพอากาศ ปริมาณพัสดุช่วงแคมเปญ หรือเหตุสุดวิสัย</div>
        <div className="policy__tableWrap">
          <table className="policy__table" aria-label="SLA ตารางระยะเวลาจัดส่งโดยประมาณ">
            <thead>
              <tr>
                <th>วิธีจัดส่ง</th>
                <th>พื้นที่</th>
                <th>ระยะเวลาโดยประมาณ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Standard</td>
                <td>กรุงเทพฯ และปริมณฑล</td>
                <td>1–2 วันทำการ</td>
              </tr>
              <tr>
                <td>Standard</td>
                <td>ต่างจังหวัด</td>
                <td>2–5 วันทำการ</td>
              </tr>
              <tr>
                <td>Express</td>
                <td>เขตที่รองรับ</td>
                <td>ภายใน 1–2 วันทำการ</td>
              </tr>
              <tr>
                <td>Same-day</td>
                <td>พื้นที่ให้บริการ</td>
                <td>ภายในวันเดียวกัน (สั่งก่อนรอบตัด)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul>
          <li><strong>ค่าจัดส่ง:</strong> แสดงที่หน้าชำระเงินตามเรทผู้ให้บริการ/โปรโมชัน (ถ้ามี)</li>
          <li><strong>รอบตัด:</strong> คำสั่งซื้อที่ชำระหลัง <u>14:00 น.</u> อาจถูกนับเป็นรอบวันทำการถัดไป</li>
          <li><strong>พรีออเดอร์/แยกส่ง:</strong> หากรายการมีสินค้าพรีออเดอร์ ระบบอาจส่งครั้งเดียวเมื่อครบ หรือแยกส่งตามความเหมาะสม (อาจมีค่าจัดส่งเพิ่ม)</li>
          <li><strong>ตรวจสอบที่อยู่ก่อนชำระเงิน:</strong> เพื่อหลีกเลี่ยงความล่าช้า/ตีกลับ</li>
        </ul>
      </Section>

      {/* 4) */}
      <Section id="tracking" title="4) การติดตามพัสดุ">
        <p>
          เมื่อร้านค้าส่งของและกรอกเลขพัสดุ ระบบจะแสดงสถานะในหน้า “คำสั่งซื้อของฉัน” และ/หรือส่งอีเมลแจ้งเตือน
          ลูกค้าสามารถคลิกเพื่อติดตามสถานะจากผู้ให้บริการขนส่งได้โดยตรง
        </p>
        <ul>
          <li>หากไม่พบสถานะ กรุณารอ 4–8 ชั่วโมงหลังได้รับเลขพัสดุ แล้วลองใหม่อีกครั้ง</li>
          <li>ช่วงเทศกาลหรือแคมเปญใหญ่ อาจเกิดการอัปเดตสถานะล่าช้า</li>
        </ul>
      </Section>

      {/* 5) */}
      <Section id="delay-damage" title="5) ความล่าช้า สูญหาย หรือเสียหาย">
        <ul>
          <li>หากพัสดุล่าช้าเกินกรอบโดยประมาณ กรุณาติดต่อฝ่ายบริการลูกค้าพร้อมเลขคำสั่งซื้อและเลขพัสดุ</li>
          <li>
            กรณีพัสดุสูญหาย/แตกหัก/ชำรุด โปรดถ่ายรูปสภาพพัสดุ (กล่องภายนอก ฉลากขนส่ง และสินค้า)
            และแจ้งภายใน <strong>48 ชั่วโมง</strong> นับจากวันที่ได้รับพัสดุ เพื่อเริ่มกระบวนการตรวจสอบ/เคลม
          </li>
          <li>การชดเชยเป็นไปตามหลักฐานและเกณฑ์ของผู้ให้บริการขนส่ง/เงื่อนไขสินค้า</li>
          <li>ความล่าช้าที่เกิดจากเหตุสุดวิสัย (ฝนตกหนัก น้ำท่วม ภัยธรรมชาติ ฯลฯ) ไม่อยู่ในการรับประกัน SLA</li>
        </ul>
      </Section>

      {/* 6) */}
      <Section id="address-change" title="6) การเปลี่ยนแปลงที่อยู่/การส่งคืน">
        <ul>
          <li>การเปลี่ยนที่อยู่หลังชำระเงินสำเร็จอาจทำไม่ได้ หากคำสั่งซื้อเข้าสู่ขั้นตอนเตรียมจัดส่งแล้ว</li>
          <li>หากจัดส่งไม่สำเร็จ (ผู้รับไม่อยู่/ที่อยู่ผิด/ปฏิเสธรับ) พัสดุอาจถูกตีกลับและอาจต้องชำระค่าจัดส่งใหม่ในการส่งซ้ำ</li>
          <li>กรุณาตรวจสอบความถูกต้องของชื่อผู้รับ เบอร์โทรศัพท์ และที่อยู่ก่อนชำระเงินทุกครั้ง</li>
        </ul>
      </Section>

      {/* 7) */}
      <Section id="responsibility" title="7) ความรับผิดชอบของคู่สัญญา">
        <ul>
          <li><strong>ToyStore/ผู้ขาย:</strong> แพ็กสินค้าให้เหมาะสม ระบุเลขติดตาม และจัดส่งภายในกรอบที่ประกาศ</li>
          <li><strong>ผู้ซื้อ:</strong> กรอกที่อยู่/เบอร์ติดต่อให้ถูกต้อง ตรวจรับสินค้าเก็บหลักฐานเมื่อพบความเสียหาย</li>
          <li>กรณีสินค้าพิเศษ (ของสะสม/แตกหักง่าย) อาจกำหนดขั้นตอนรับ-ส่งเฉพาะเพื่อป้องกันความเสียหาย</li>
        </ul>
      </Section>

      {/* 8) */}
      <Section id="restrictions" title="8) ข้อจำกัดการขนส่ง">
        <ul>
          <li>ยังไม่รองรับการจัดส่งไปต่างประเทศ เว้นแต่จะประกาศเป็นกรณีพิเศษ</li>
          <li>ไม่รับจัดส่งสินค้าที่ผิดกฎหมาย/อันตราย/ต้องใช้ใบอนุญาตพิเศษ ตามข้อกำหนดของผู้ให้บริการขนส่ง</li>
          <li>ชิ้นใหญ่หรือมีแบตเตอรี่ลิเธียมอาจมีเรทค่าขนส่ง/เงื่อนไขพิเศษตามกฎผู้ให้บริการขนส่ง</li>
        </ul>
      </Section>

      {/* 9) */}
      <Section id="contact" title="9) ช่องทางติดต่อ">
        <p>
          ฝ่ายบริการลูกค้า ToyStore อีเมล: <a href="mailto:support@toystore.example">support@toystore.example</a>
          {" "}| โทร: 02-123-4567 (จันทร์–ศุกร์ 9:00–18:00)
        </p>
      </Section>

      {/* 10) */}
      <Section id="versioning" title="10) เวอร์ชันและการแก้ไข">
        <p>นโยบายนี้อาจได้รับการปรับปรุงเป็นครั้งคราว โดยมีผลตั้งแต่วันที่ประกาศบนเว็บไซต์</p>
        <p className="policy__muted">อัปเดตล่าสุด: {today}</p>
      </Section>

      <div className="policy__bottom">
        <a href="#top" className="policy__backtotop" aria-label="กลับขึ้นด้านบน">▲ กลับขึ้นด้านบน</a>
      </div>
    </main>
  );
}