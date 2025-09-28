// src/pages/Checkout.jsx
import "./Checkout.css";
import { useCart } from "../context/CartContext";
import { useState } from "react";

export default function Checkout() {
  const { items, subtotal, checkout } = useCart();
  const [method, setMethod] = useState("card"); // 'card' | 'bank'

  async function placeOrder(e) {
    e.preventDefault();
    const res = await checkout();
    if (res?.ok) alert(`สั่งซื้อสำเร็จ (#${res.order_id}) ยอดรวม $${res.total}`);
  }

  return (
    <div className="co-wrap">
      <h2>ชำระเงิน</h2>

      <div className="co-grid">
        <section className="co-left">
          <div className="tabs">
            <button className={method==='card'?'active':''} onClick={() => setMethod('card')}>Credit / Debit Card</button>
            <button className={method==='bank'?'active':''} onClick={() => setMethod('bank')}>Bank Transfer</button>
          </div>

          {method === 'card' ? <CardForm onSubmit={placeOrder} /> : <BankForm onSubmit={placeOrder} />}
        </section>

        <aside className="co-right">
          <h3>สรุปรายการ</h3>
          <ul className="co-list">
            {items.map(i => (
              <li key={i.product_id}>
                <span>{i.name} × {i.quantity}</span>
                <b>${(Number(i.price)*Number(i.quantity)).toFixed(2)}</b>
              </li>
            ))}
          </ul>
          <div className="co-total">
            <span>ยอดรวม</span>
            <b>${subtotal.toFixed(2)}</b>
          </div>
          <button className="co-pay" onClick={placeOrder}>ยืนยันชำระเงิน</button>
        </aside>
      </div>
    </div>
  );
}

function CardForm({ onSubmit }) {
  return (
    <form className="panel" onSubmit={onSubmit}>
      <div className="row">
        <label>Card Number</label>
        <input required placeholder="1234 5678 9012 3456" />
      </div>
      <div className="row2">
        <div>
          <label>Name on Card</label>
          <input required placeholder="AKARAPON T." />
        </div>
        <div>
          <label>Expiry</label>
          <input required placeholder="MM/YY" />
        </div>
        <div>
          <label>CVC</label>
          <input required placeholder="123" />
        </div>
      </div>
      <div className="row">
        <label>Billing Address</label>
        <input placeholder="บ้านเลขที่/ถนน/แขวง/เขต" />
      </div>
    </form>
  );
}

function BankForm({ onSubmit }) {
  return (
    <form className="panel" onSubmit={onSubmit}>
      <div className="row">
        <label>ธนาคาร</label>
        <select required>
          <option>กสิกรไทย</option>
          <option>ไทยพาณิชย์</option>
          <option>กรุงไทย</option>
          <option>กรุงเทพ</option>
        </select>
      </div>
      <div className="row2">
        <div>
          <label>ชื่อบัญชี</label>
          <input required placeholder="AKARAPON T." />
        </div>
        <div>
          <label>หมายเลขบัญชี</label>
          <input required placeholder="XXX-X-XXXXX-X" />
        </div>
      </div>
      <p className="hint">โอนแล้วแนบหลักฐานในหน้าติดตามออเดอร์ได้ภายหลัง</p>
    </form>
  );
}
