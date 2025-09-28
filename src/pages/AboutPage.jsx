import React from "react";
import "./AboutPage.css";

export default function AboutPage() {
  return (
    <main id="top" className="about">
      <section className="about__hero">
        <div className="about__container">
          <h1 className="about__title">About ToyStore</h1>
          <p className="about__subtitle">
            เราเชื่อว่าของเล่นที่ดีช่วยพัฒนาทักษะ ความคิดสร้างสรรค์ และความสุขของทุกวัย
          </p>
        </div>
      </section>

      <section className="about__container about__grid">
        <article className="about__card">
          <h3>วิสัยทัศน์</h3>
          <p>
            เป็นแพลตฟอร์มของเล่นที่เชื่อถือได้ที่สุดในภูมิภาค
            ด้วยข้อมูลเชิงลึกด้านยอดขายแบบเรียลไทม์และบริการที่เป็นมิตร
          </p>
        </article>

        <article className="about__card">
          <h3>พันธกิจ</h3>
          <ul className="about__list">
            <li>คัดสรรของเล่นที่ปลอดภัยและได้มาตรฐาน</li>
            <li>ให้ประสบการณ์ซื้อของที่เรียบง่าย รวดเร็ว</li>
            <li>ใช้ข้อมูลเพื่อพัฒนาคลังสินค้าและบริการหลังการขาย</li>
          </ul>
        </article>

        <article className="about__card">
          <h3>สิ่งที่เราเชื่อ</h3>
          <p>
            ความโปร่งใส ระยะยาว และการเรียนรู้อย่างต่อเนื่อง—เราลงมือทดลอง
            และปรับปรุงจากข้อมูลจริงเสมอ
          </p>
        </article>
      </section>

      <section className="about__container about__stats">
        <div className="stat">
          <div className="stat__num">1,200+</div>
          <div className="stat__label">สินค้าในสต็อก</div>
        </div>
        <div className="stat">
          <div className="stat__num">98%</div>
          <div className="stat__label">ความพึงพอใจลูกค้า</div>
        </div>
        <div className="stat">
          <div className="stat__num">24/7</div>
          <div className="stat__label">ระบบสั่งซื้อออนไลน์</div>
        </div>
      </section>

      <section className="about__container about__values">
        <h2>ค่านิยมหลัก</h2>
        <div className="values__grid">
          <div className="value">
            <h4>Customer First</h4>
            <p>รับฟังจริง แก้ปัญหาไว และส่งมอบเกินความคาดหวัง</p>
          </div>
          <div className="value">
            <h4>Quality</h4>
            <p>มาตรฐานความปลอดภัยสูง ผ่านการคัดเลือกทุกชิ้น</p>
          </div>
          <div className="value">
            <h4>Innovation</h4>
            <p>ใช้ข้อมูลและเทคโนโลยีผลักดันการเติบโตธุรกิจ</p>
          </div>
        </div>
      </section>

      <section className="about__container about__cta">
        <h2>ร่วมเป็นส่วนหนึ่งกับเรา</h2>
        <p>กำลังมองหาพาร์ทเนอร์หรือสมัครงาน สามารถติดต่อทีมเราได้เลย</p>
        <a className="btn" href="mailto:support@toystore.example">ติดต่อทีมงาน</a>
      </section>
    </main>
  );
}
