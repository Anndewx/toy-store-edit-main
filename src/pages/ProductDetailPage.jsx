import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./ProductDetail.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  `${window.location.protocol}//${window.location.hostname}:3001`;

function resolveImageSrc(obj) {
  const raw0 = obj?.image_url ?? obj?.image ?? "";
  const raw = String(raw0).trim();
  if (!raw) return "/images/placeholder.jpg";
  if (/^https?:\/\//i.test(raw)) return raw;
  const onlyFile = /^[^/\\]+\.[a-z0-9]{2,5}$/i.test(raw);
  if (onlyFile) return `${API_BASE}/images/${raw}`;
  if (raw.startsWith("/images")) return `${API_BASE}${raw}`;
  if (raw.startsWith("images"))  return `${API_BASE}/${raw}`;
  if (raw.startsWith("/"))       return `${API_BASE}${raw}`;
  return `${API_BASE}/${raw}`;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const { add } = useCart();
  const [item, setItem] = useState(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch(`/api/products/${id}`);
      const data = res.ok ? await res.json() : null;
      if (alive) setItem(data);
    })();
    return () => { alive = false; };
  }, [id]);

  if (!item) return <div className="container-narrow" style={{ paddingTop: 24 }}>กำลังโหลด...</div>;

  const { name, price, original_price, stock, description, category } = item;
  const imgSrc = resolveImageSrc(item);
  const isOnSale = Number(original_price) > Number(price);
  const lowStock = Number(stock) > 0 && Number(stock) < 10;

  return (
    <div className="container-narrow" style={{ paddingTop: 24 }}>
      {/* Breadcrumb */}
      <nav className="pd__breadcrumb" aria-label="breadcrumb">
        <Link to="/">Home</Link>
        {" / "}
        <Link to={`/category/${category?.slug || "gundam"}`}>{category?.name || "Gundam"}</Link>
        {" / "}
        <span aria-current="page">{name}</span>
      </nav>

      <div className="pd">
        {/* ซ้าย: รูป + badge */}
        <div className="pd__left">
          <div className="pd__imageWrap">
            {isOnSale && <span className="pd__badge sale">ลดราคา</span>}
            {lowStock && <span className="pd__badge low">เหลือน้อย!</span>}
            <img
              src={imgSrc}
              alt={name}
              loading="lazy"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/placeholder.jpg"; }}
            />
          </div>

          {/* การันตีเล็ก ๆ ใต้ภาพ */}
          <ul className="pd__trust">
            <li>✓ สินค้าแท้ 100%</li>
            <li>✓ แพ็กอย่างดี กันกระแทก</li>
            <li>✓ คืน/เปลี่ยนได้ภายใน 7 วัน (ตามเงื่อนไข)</li>
          </ul>
        </div>

        {/* ขวา: รายละเอียดสรุป */}
        <div className="pd__right">
          <h1 className="pd__title">{name}</h1>

          <div className="pd__meta">
            คงเหลือในสต็อก: <strong>{stock ?? "-"}</strong>
          </div>

          <div className="pd__price">
            <span className="price">฿{Number(price).toFixed(2)}</span>
            {isOnSale && <span className="ori">฿{Number(original_price).toFixed(2)}</span>}
          </div>

          {/* จำนวน */}
          <div className="pd__qty" role="group" aria-label="จำนวน">
            <button aria-label="ลดจำนวน" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <input aria-label="จำนวน" value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value)||1))}/>
            <button aria-label="เพิ่มจำนวน" onClick={() => setQty(q => Math.min(stock || 99, q + 1))}>＋</button>
          </div>

          {/* CTA + แชร์ */}
          <div className="pd__ctaRow">
            <button className="pd__add" onClick={() => add(item.product_id, qty)}>
              เพิ่มลงตะกร้า
            </button>

            <div className="pd__share" aria-label="แชร์">
              แชร์:
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(name)}`} target="_blank" rel="noopener noreferrer">X</a>
            </div>
          </div>

          {/* รายละเอียด/สเปก */}
          <details className="pd__details" open>
            <summary>รายละเอียดสินค้า</summary>
            <div className="pd__detailsBody">
              {description ? <p>{description}</p> : <p className="muted">ไม่มีรายละเอียดเพิ่มเติม</p>}
            </div>
          </details>

          <details className="pd__details">
            <summary>ข้อมูลจำเพาะ</summary>
            <div className="pd__detailsBody">
              <ul className="pd__spec">
                <li>วัสดุ: ABS / PVC</li>
                <li>สเกล: 1/144</li>
                <li>ยี่ห้อ: Bandai</li>
                <li>น้ำหนักโดยประมาณ: ~350 กรัม</li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
