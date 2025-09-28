// src/components/CartDrawer.jsx
import { useCart } from "../context/CartContext";
import { normalizeImage } from "../utils/image";
import { Link, useNavigate } from "react-router-dom";
import "./cartdrawer.css"; // ถ้าจะทำสไตล์เพิ่ม ให้สร้างไฟล์นี้ก็ได้ (ไม่บังคับ)

export default function CartDrawer({ open, onClose }) {
  const { items, total, changeQty, remove, clear } = useCart();
  const nav = useNavigate();

  return (
    <div className={`ct-drawer ${open ? "open" : ""}`}>
      <div className="ct-drawer__backdrop" onClick={onClose} />
      <aside className="ct-drawer__panel">
        <header className="ct-drawer__header">
          <h3>ตะกร้าของคุณ</h3>
          <button className="ct-close" onClick={onClose}>×</button>
        </header>

        <div className="ct-drawer__body">
          {items.length === 0 ? (
            <p className="muted">ยังไม่มีสินค้าในตะกร้า</p>
          ) : (
            items.map(it => (
              <div className="ct-cart-row" key={it.id}>
                <img src={normalizeImage(it.image_url)} alt={it.name}/>
                <div className="info">
                  <Link to={`/product/${it.id}`} onClick={onClose}>{it.name}</Link>
                  <div className="qty">
                    <button onClick={() => changeQty(it.id, it.qty - 1)}>-</button>
                    <input value={it.qty} onChange={e => changeQty(it.id, Number(e.target.value)||1)} />
                    <button onClick={() => changeQty(it.id, it.qty + 1)}>+</button>
                  </div>
                </div>
                <div className="price">฿{(it.price * it.qty).toFixed(2)}</div>
                <button className="rm" onClick={() => remove(it.id)}>ลบ</button>
              </div>
            ))
          )}
        </div>

        <footer className="ct-drawer__footer">
          <div className="sum">ยอดรวม: <b>฿{total.toFixed(2)}</b></div>
          <div className="actions">
            <button className="ghost" onClick={clear}>ล้างตะกร้า</button>
            <button
              className="primary"
              disabled={items.length === 0}
              onClick={() => { onClose?.(); nav("/checkout"); }}
            >
              ไปชำระเงิน
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
