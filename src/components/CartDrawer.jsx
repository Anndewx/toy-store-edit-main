import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import "./CartDrawer.css";

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
                <img className="cd__thumb" src={i.image_url} alt={i.name} />
                <div className="cd__grow">
                  <div className="cd__name">{i.name}</div>
                  <div className="cd__muted">
                    ${Number(i.price).toFixed(2)} × {i.quantity}
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
            <span>ยอดรวม</span><b>${subtotal.toFixed(2)}</b>
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
