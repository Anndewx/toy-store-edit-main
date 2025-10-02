import React from "react";

export default function ShippingPolicy() {
  const Section = ({ id, title, children }) => (
    <section id={id} style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 8 }}>{title}</h2>
      <div style={{ lineHeight: 1.75 }}>{children}</div>
    </section>
  );

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: 12 }}>
        นโยบายการจัดส่ง (Shipping Policy)
      </h1>
      <p style={{ color: "rgba(0,0,0,.7)", marginBottom: 22 }}>
        เอกสารนี้กำหนดเงื่อนไข วิธีการ และความรับผิดเกี่ยวกับการจัดส่งสินค้าของ ToyStore
        เพื่อให้ผู้ซื้อได้รับประสบการณ์ที่โปร่งใสและปลอดภัย
      </p>

      <nav aria-label="สารบัญ" style={{ marginBottom: 24 }}>
        <ol style={{ listStyle: "decimal", paddingLeft: 20, display: "grid", gap: 6 }}>
          <li><a href="#scope">ขอบเขตและคำนิยาม</a></li>
          <li><a href="#methods">วิธี/ผู้ให้บริการจัดส่ง</a></li>
          <li><a href="#fees-times">ค่าบริการและระยะเวลาโดยประมาณ (SLA)</a></li>
          <li><a href="#tracking">การติดตามพัสดุ</a></li>
          <li><a href="#delay-damage">ความล่าช้า สูญหาย หรือเสียหาย</a></li>
          <li><a href="#address-change">การเปลี่ยนแปลงที่อยู่/การส่งคืน</a></li>
          <li><a href="#responsibility">ความรับผิดชอบของคู่สัญญา</a></li>
          <li><a href="#contact">การติดต่อฝ่ายช่วยเหลือ</a></li>
        </ol>
      </nav>

      <Section id="scope" title="1) ขอบเขตและคำนิยาม">
        <ul style={{ listStyle: "disc", paddingLeft: 20, display: "grid", gap: 6 }}>
          <li>
            “การจัดส่ง” หมายถึง ขั้นตอนที่ ToyStore หรือผู้ให้บริการขนส่งคู่สัญญา
            จัดส่งสินค้าจากคลัง/ร้านค้าถึงผู้รับตามที่อยู่ที่ระบุในระบบ
          </li>
          <li>
            นโยบายนี้ครอบคลุมคำสั่งซื้อที่ชำระเงินสำเร็จในเว็บไซต์/แอป ToyStore เท่านั้น
          </li>
        </ul>
      </Section>

      <Section id="methods" title="2) วิธี/ผู้ให้บริการจัดส่ง">
        <p>
          เราใช้บริการจากผู้ให้บริการขนส่งมาตรฐานในประเทศ (เช่น ไปรษณีย์ไทย, Kerry, J&T, Flash ฯลฯ)
          โดยระบบจะเลือกวิธีที่เหมาะสมตามน้ำหนัก ขนาด ปลายทาง และตัวเลือกที่ลูกค้าเลือกในขั้นตอนชำระเงิน
        </p>
        <p style={{ marginTop: 8 }}>
          <strong>การจัดเตรียมพัสดุ:</strong> ร้านค้าจะทำการแพ็กสินค้าให้เหมาะสม ลดความเสี่ยงต่อความเสียหายระหว่างขนส่ง
        </p>
      </Section>

      <Section id="fees-times" title="3) ค่าบริการและระยะเวลาโดยประมาณ (SLA)">
        <ul style={{ listStyle: "disc", paddingLeft: 20, display: "grid", gap: 6 }}>
          <li><strong>ค่าจัดส่ง:</strong> แสดงที่หน้าชำระเงินตามเรทของผู้ให้บริการ/โปรโมชัน (ถ้ามี)</li>
          <li>
            <strong>ระยะเวลาจัดส่งโดยประมาณ:</strong> ภายในประเทศ 1–5 วันทำการ (ขึ้นกับพื้นที่/ผู้ให้บริการ/ฤดูกาล)
          </li>
          <li>
            <strong>ตัดรอบ:</strong> คำสั่งซื้อที่ชำระเงินหลังเวลา 14:00 อาจถูกนับเป็นรอบวันทำการถัดไป
          </li>
          <li>
            ระยะเวลาที่แสดงเป็นการประมาณการและไม่ถือเป็นการรับประกัน (force majeure/ช่วงแคมเปญใหญ่
            อาจทำให้ล่าช้า)
          </li>
        </ul>
      </Section>

      <Section id="tracking" title="4) การติดตามพัสดุ">
        <p>
          เมื่อร้านค้าส่งของและกรอกเลขพัสดุ ระบบจะแสดงสถานะในหน้า “คำสั่งซื้อของฉัน”
          และ/หรือส่งอีเมลแจ้ง ลูกค้าสามารถคลิกเพื่อติดตามสถานะจากผู้ให้บริการขนส่งได้โดยตรง
        </p>
      </Section>

      <Section id="delay-damage" title="5) ความล่าช้า สูญหาย หรือเสียหาย">
        <ul style={{ listStyle: "disc", paddingLeft: 20, display: "grid", gap: 6 }}>
          <li>
            หากพัสดุล่าช้าเกินกว่ากรอบเวลาโดยประมาณ กรุณาติดต่อฝ่ายบริการลูกค้าพร้อมเลขคำสั่งซื้อและเลขพัสดุ
          </li>
          <li>
            หากพัสดุสูญหาย/แตกหัก/ชำรุด โปรดถ่ายรูปสภาพพัสดุ (กล่องภายนอก/ฉลากขนส่ง/สินค้า)
            และแจ้งภายใน 48 ชั่วโมงนับแต่ได้รับพัสดุ เพื่อเริ่มกระบวนการตรวจสอบ/เคลม
          </li>
          <li>
            การชดเชยเป็นไปตามหลักฐานและเกณฑ์ของผู้ให้บริการขนส่ง/เงื่อนไขสินค้า
            (เช่น จำกัดมูลค่าสูงสุดต่อรายการตามข้อกำหนดของขนส่ง)
          </li>
        </ul>
      </Section>

      <Section id="address-change" title="6) การเปลี่ยนแปลงที่อยู่/การส่งคืน">
        <ul style={{ listStyle: "disc", paddingLeft: 20, display: "grid", gap: 6 }}>
          <li>
            การเปลี่ยนที่อยู่หลังชำระเงินสำเร็จอาจทำไม่ได้ หากคำสั่งซื้อเข้าสู่ขั้นตอนเตรียมจัดส่งแล้ว
          </li>
          <li>
            หากจัดส่งไม่สำเร็จ (ผู้รับไม่อยู่/ที่อยู่ไม่ถูกต้อง) พัสดุอาจถูกตีกลับและต้องชำระค่าจัดส่งใหม่
            ในการส่งซ้ำ (ถ้ามี)
          </li>
        </ul>
      </Section>

      <Section id="responsibility" title="7) ความรับผิดชอบของคู่สัญญา">
        <ul style={{ listStyle: "disc", paddingLeft: 20, display: "grid", gap: 6 }}>
          <li>
            <strong>ToyStore/ผู้ขาย:</strong> แพ็กสินค้าให้เหมาะสม ระบุเลขติดตาม จัดส่งภายในกรอบที่ประกาศ
          </li>
          <li>
            <strong>ผู้ซื้อ:</strong> กรอกที่อยู่/เบอร์ติดต่อให้ถูกต้อง ตรวจรับสินค้าและเก็บหลักฐานเมื่อพบความเสียหาย
          </li>
        </ul>
      </Section>

      <Section id="contact" title="8) ช่องทางติดต่อ">
        <p>
          ฝ่ายบริการลูกค้า ToyStore อีเมล: <a href="mailto:support@toystore.example">support@toystore.example</a> |
          โทร: 02-123-4567 (จันทร์–ศุกร์ 9:00–18:00)
        </p>
      </Section>
    </main>
  );
}
