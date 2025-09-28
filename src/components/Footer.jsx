import React from "react";
import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="ft" aria-labelledby="site-footer">
      <div className="ft__container">
        {/* Brand + Mission */}
        <div className="ft__col">
          <h3 id="site-footer" className="ft__brand">ToyStore</h3>
          <p className="ft__desc">
            เราสร้างประสบการณ์เลือกของเล่นที่ปลอดภัย คุณภาพดี และสนุกสำหรับทุกวัย
            พร้อมข้อมูลเชิงลึกด้านยอดขายเพื่อพัฒนาธุรกิจอย่างยั่งยืน
          </p>
        </div>

        {/* Quick Links */}
        <nav className="ft__col" aria-label="ลิงก์ด่วน">
          <h4 className="ft__title">ลิงก์</h4>
          <ul className="ft__list">
            <li><a href="/about">เกี่ยวกับเรา</a></li>
            <li><a href="/products">สินค้า</a></li>
            <li><a href="/orders">คำสั่งซื้อ</a></li>
            <li><a href="/dashboard">แดชบอร์ด</a></li>
          </ul>
        </nav>

        {/* Contact */}
        <div className="ft__col">
          <h4 className="ft__title">ติดต่อ</h4>
          <ul className="ft__list">
            <li><a href="mailto:support@toystore.example">support@toystore.example</a></li>
            <li>โทร: 02-123-4567</li>
            <li>เวลาทำการ: จันทร์–ศุกร์ 9:00–18:00</li>
          </ul>
        </div>

        {/* Social (SVG ไอคอนไม่ต้องติดตั้งเพิ่ม) */}
        <div className="ft__col">
          <h4 className="ft__title">ติดตามเรา</h4>
          <div className="ft__social">
            <a className="ft__icon" href="#" aria-label="Facebook" title="Facebook">
              {/* FB Icon */}
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M22 12.07C22 6.48 17.52 2 11.93 2 6.35 2 1.87 6.48 1.87 12.07c0 5.02 3.67 9.19 8.47 9.98v-7.06H7.9v-2.92h2.44V9.41c0-2.41 1.43-3.74 3.62-3.74 1.05 0 2.15.19 2.15.19v2.36h-1.21c-1.19 0-1.56.74-1.56 1.5v1.8h2.65l-.42 2.92h-2.23v7.06c4.8-.79 8.47-4.96 8.47-9.98z"/></svg>
            </a>
            <a className="ft__icon" href="#" aria-label="Instagram" title="Instagram">
              {/* IG Icon */}
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5zm5.75-2.75a1 1 0 1 1-1 1 1 1 0 0 1 1-1z"/></svg>
            </a>
            <a className="ft__icon" href="#" aria-label="YouTube" title="YouTube">
              {/* YT Icon */}
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.2C19.3 3.5 12 3.5 12 3.5s-7.3 0-9.4.5A3 3 0 0 0 .5 6.2 31.1 31.1 0 0 0 0 12a31.1 31.1 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.2c2.1.5 9.4.5 9.4.5s7.3 0 9.4-.5a3 3 0 0 0 2.1-2.2A31.1 31.1 0 0 0 24 12a31.1 31.1 0 0 0-.5-5.8zM9.75 15.02V8.98L15.5 12z"/></svg>
            </a>
          </div>
        </div>
      </div>

      <div className="ft__bottom">
        <a className="ft__backtotop" href="#top">▲ กลับขึ้นด้านบน</a>
        <span className="ft__copy">© {year} ToyStore. All rights reserved.</span>
      </div>
    </footer>
  );
}
