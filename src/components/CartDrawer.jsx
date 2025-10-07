import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import "./CartDrawer.css";

/** ให้ URL รูปเป็นแบบ absolute เหมือนหน้า ProductDetail */
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  `${window.location.protocol}//${window.location.hostname}:3001`;

function resolveImageSrc(obj) {
  const raw0 = obj?.image_url ?? obj?.image ?? "";
  const raw = String(raw0 || "").trim();
  if (!raw) return "/images/placeholder.jpg";
  if (/^https?:\/\//i.test(raw)) return raw;
  const onlyFile = /^[^/\\]+\.[a-z0-9]{2,5}$/i.test(raw);
  if (onlyFile) return `${API_BASE}/images/${raw}`;
  if (raw.startsWith("/images")) return `${API_BASE}${raw}`;
  if (raw.startsWith("images"))  return `${API_BASE}/${raw}`;
  if (raw.startsWith("/"))       return `${API_BASE}${raw}`;
  return `${API_BASE}/${raw}`;
}

export default function CartDrawer() {
  const { items, subtotal, remove, updateQty, clear } = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openFn = () => setOpen(true);
    window.addEventListener("open-cart", openFn);
    return () => window.removeEventListener("open-cart", openFn);
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  return (
    <div className="cd__overlay" onClick={() => setOpen(false)}>
      <aside className="cd" onClick={(e) => e.stopPropagation()}>
        <header className="cd__h">
          <b>ตะกร้าสินค้า</b>
          <button className="cd__close" onClick={() => setOpen(false)}>✕</button>
        </header>

        <div className="cd__b">
          {items.length === 0 ? (
            <p>ยังไม่มีสินค้า</p>
          ) : (
            items.map((i) => (
              <div className="cd__row" key={i.product_id}>
                <img
                  className="cd__thumb"
                  src={resolveImageSrc(i)}
                  alt={i.name}
                  onError={(e)=>{e.currentTarget.onerror=null; e.currentTarget.src="/images/placeholder.jpg";}}
                />
                <div className="cd__grow">
                  <div className="cd__name">{i.name}</div>
                  <div className="cd__muted">
                    ฿{Number(i.price).toFixed(2)} × {i.quantity}
                  </div>
                </div>
                <div className="cd__qty">
                  <button onClick={() => updateQty(i.product_id, Math.max(1, i.quantity - 1))}>−</button>
                  <span>{i.quantity}</span>
                  <button onClick={() => updateQty(i.product_id, i.quantity + 1)}>＋</button>
                </div>
                <button className="cd__link" onClick={() => remove(i.product_id)}>ลบ</button>
              </div>
            ))
          )}
        </div>

        <footer className="cd__f">
          <div className="cd__sum">
            <span>ยอดรวม</span><b>฿{subtotal.toFixed(2)}</b>
          </div>
          <div className="cd__actions">
            <button className="ghost" onClick={clear}>ล้างตะกร้า</button>
            <a className="primary" href="/checkout">ชำระเงิน</a>
          </div>
        </footer>
      </aside>
    </div>
  );
}
