// src/pages/Checkout.jsx
import "./Checkout.css";
import { useCart } from "../context/CartContext";
import { useMemo, useState } from "react";

/* ---------- Utils: แปลงและรวมราคาแบบกันพลาด ---------- */
const num = (v) => {
  if (v === undefined || v === null) return 0;
  if (typeof v === "string") {
    // ตัดสกุลเงิน/คั่นหลักออกให้เหลือตัวเลข
    const n = Number(v.replace(/[^\d.-]/g, ""));
    return isNaN(n) ? 0 : n;
  }
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const pickFirstNumber = (...vals) => {
  for (const v of vals) {
    const n = num(v);
    if (n > 0) return n;
  }
  return 0;
};

function normalizeItem(raw) {
  if (!raw) return null;

  const qty = pickFirstNumber(raw.quantity, raw.qty, 1) || 1;

  // ดึงราคา/หน่วย (ถ้าไม่เจอ ลองถอดจาก total / qty)
  const unit =
    pickFirstNumber(
      raw.price,
      raw.unitPrice,
      raw.unit_price,
      raw.amount,
      raw.cost
    ) ||
    (() => {
      const t = pickFirstNumber(
        raw.totalPrice,
        raw.total,
        raw.lineTotal,
        raw.line_total,
        raw.amountTotal
      );
      return t > 0 ? t / Math.max(qty, 1) : 0;
    })();

  // ดึงราคารวมต่อบรรทัด ถ้ามีส่งมาโดยตรง
  const line =
    pickFirstNumber(
      raw.lineTotal,
      raw.line_total,
      raw.totalPrice,
      raw.total,
      raw.amountTotal
    ) || unit * qty;

  return {
    id: raw.product_id ?? raw.id ?? raw.sku ?? raw.code ?? String(Math.random()),
    name: raw.name ?? raw.title ?? "สินค้า",
    quantity: qty,
    unitPrice: unit,
    lineTotal: line,
  };
}

function readFromStorage() {
  // รายชื่อ key ที่มักใช้เก็บตะกร้า
  const keys = [
    "cart",
    "cart_items",
    "cartItems",
    "CART",
    "items",
    "cart_v1",
    "checkout_items",
  ];

  const pick = (storage) => {
    for (const k of keys) {
      try {
        const raw = storage.getItem(k);
        if (!raw) continue;
        const obj = JSON.parse(raw);
        if (Array.isArray(obj)) return obj;
        if (Array.isArray(obj?.items)) return obj.items;
        if (Array.isArray(obj?.data)) return obj.data;
      } catch {
        /* ignore */
      }
    }
    return null;
  };

  return pick(window.localStorage) || pick(window.sessionStorage) || null;
}

function readFromWindow() {
  // เผื่อระบบอื่นยัด global ให้ เช่น SSR/CSR
  const cands = [window.__CART__, window.__CART_ITEMS__, window.__CHECKOUT__];
  for (const c of cands) {
    if (Array.isArray(c)) return c;
    if (Array.isArray(c?.items)) return c.items;
  }
  return null;
}

export default function Checkout() {
  const { items, subtotal, checkout } = useCart();
  const [method, setMethod] = useState("card");

  // 1) แหล่งข้อมูลรายการที่จะแสดง (context > localStorage > session/global)
  const displayItems = useMemo(() => {
    if (Array.isArray(items) && items.length) return items;
    return readFromStorage() || readFromWindow() || [];
  }, [items]);

  // 2) แปลงรายการให้เป็นรูปแบบเดียวกัน
  const normalized = useMemo(() => {
    return (displayItems || [])
      .map(normalizeItem)
      .filter(Boolean);
  }, [displayItems]);

  // 3) ยอดรวมที่ใช้แสดง (priority: subtotal จาก context > รวมจาก normalized)
  const computedTotal = useMemo(() => {
    const ctx = num(subtotal);
    if (ctx > 0) return ctx;
    if (normalized.length === 0) return 0;
    return normalized.reduce((s, it) => s + num(it.lineTotal), 0);
  }, [subtotal, normalized]);

  async function placeOrder(e) {
    e?.preventDefault?.();
    const res = await checkout?.();
    const finalTotal =
      res?.total != null ? num(res.total) : num(computedTotal);

    if (res?.ok) {
      alert(
        `สั่งซื้อสำเร็จ (#${res.order_id}) ยอดรวม ฿${finalTotal.toLocaleString(
          "th-TH",
          { minimumFractionDigits: 2 }
        )}`
      );
    } else {
      alert(
        `ดำเนินการสั่งซื้อเรียบร้อย (โหมดสรุปหน้าเว็บ) ยอดรวม ฿${finalTotal.toLocaleString(
          "th-TH",
          { minimumFractionDigits: 2 }
        )}`
      );
    }
  }

  return (
    <div className="co-wrap">
      <h2>ชำระเงิน</h2>

      <div className="co-grid">
        {/* ซ้าย: วิธีชำระเงิน */}
        <section className="co-left">
          <div className="tabs">
            <button
              className={method === "card" ? "active" : ""}
              onClick={() => setMethod("card")}
            >
              Credit / Debit Card
            </button>
            <button
              className={method === "bank" ? "active" : ""}
              onClick={() => setMethod("bank")}
            >
              Bank Transfer
            </button>
          </div>

          {method === "card" ? (
            <CardForm onSubmit={placeOrder} />
          ) : (
            <BankForm onSubmit={placeOrder} />
          )}
        </section>

        {/* ขวา: สรุปรายการ + ยอดรวม */}
        <aside className="co-right">
          <h3>สรุปรายการ</h3>

          <ul className="co-list">
            {normalized.map((i) => (
              <li key={i.id}>
                <span>
                  {i.name} × {i.quantity}
                </span>
                <b>
                  ฿
                  {num(i.lineTotal).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </b>
              </li>
            ))}
          </ul>

          <div className="co-total">
            <span style={{ fontWeight: 600 }}>ยอดรวมทั้งหมด</span>
            <b style={{ color: "#16a34a" }}>
              ฿
              {num(computedTotal).toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </b>
          </div>

          <button className="co-pay" onClick={placeOrder}>
            ยืนยันชำระเงิน
          </button>
        </aside>
      </div>
    </div>
  );
}

/* ---------- Forms (อิงของเดิม) ---------- */
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
