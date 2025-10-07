import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./ReceiptPage.css";
import { get } from "../lib/api";
import OrderTracking from "../components/OrderTracking";

const paymentLabel = (v) => {
  switch ((v || "").toLowerCase()) {
    case "bank":      return "โอนธนาคาร";
    case "cod":       return "เก็บเงินปลายทาง (COD)";
    case "other":
    case "promptpay": return "PromptPay (สแกน QR)";
    case "card":
    case "credit":    return "บัตรเครดิต/เดบิต";
    default:          return "—";
  }
};
const paymentKey = (v) => {
  const k = String(v || "").toLowerCase();
  if (["other", "promptpay"].includes(k)) return "promptpay";
  if (["card", "credit"].includes(k)) return "card";
  if (["bank", "cod"].includes(k)) return k;
  return "unknown";
};
const thb = (n) => `฿${Number(n || 0).toFixed(2)}`;

export default function ReceiptPage() {
  const { search } = useLocation();
  const orderId = new URLSearchParams(search).get("order");
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        if (!orderId) throw new Error("no id");
        const json = await get(`/orders/${encodeURIComponent(orderId)}`); // { order, items }
        const order = json.order || {};
        const items = Array.isArray(json.items) ? json.items : [];

        let map = {}, last = {};
        try { map = JSON.parse(localStorage.getItem("orderMethods") || "{}"); } catch {}
        try { last = JSON.parse(localStorage.getItem("lastOrder") || "{}"); } catch {}

        const methodRaw = order.payment_method || map[String(order.order_id)] || last.method;

        setData({
          id: order.order_id,
          at: order.created_at,
          status: order.status || "placed",
          method: methodRaw,
          items,
          total: Number(order.total_price || 0)
        });
      } catch {
        try {
          const last = JSON.parse(localStorage.getItem("lastOrder") || "{}");
          if (last?.order_id) {
            setData({
              id: last.order_id,
              at: last.at,
              status: last.status || "placed",
              method: last.method,
              items: last.items || [],
              total: Number(last.total || 0),
            });
          }
        } catch {}
      }
    })();
  }, [orderId]);

  if (!data) return <div className="container py-4">กำลังโหลด...</div>;

  const methodText = paymentLabel(data.method);
  const methodCls = `pay-badge ${paymentKey(data.method)}`;

  return (
    <div className="container py-4" style={{ maxWidth: 1040 }}>
      <div className="mb-3">
        <OrderTracking status={data.status || "placed"} />
      </div>

      <div className="rc__card">
        {/* หัวการ์ด */}
        <div className="rc__head">
          <h2 className="rc__title">ใบเสร็จรับเงิน</h2>
          <div className="rc__id">#{data.id}</div>
        </div>

        {/* meta */}
        <div className="rc__meta">
          <div className="rc__meta-row">
            <span>วันที่</span>
            <b>{data.at ? new Date(data.at).toLocaleString() : "-"}</b>
          </div>
          <div className="rc__meta-row">
            <span>วิธีชำระเงิน</span>
            <span className={methodCls}>{methodText}</span>
          </div>
        </div>

        {/* ตารางรายการ */}
        <div className="rc__table">
          <div className="rc__thead">
            <span>รายการ</span>
            <span>จำนวน</span>
            <span>ราคา</span>
          </div>

          {data.items.map((i, idx) => (
            <div className="rc__tr" key={idx}>
              <span>{i.name}</span>
              <span>{i.quantity}</span>
              <span>{thb(Number(i.price) * Number(i.quantity))}</span>
            </div>
          ))}

          <div className="rc__tfoot">
            <span>ยอดรวม</span>
            <span />
            <b>{thb(data.total)}</b>
          </div>
        </div>

        {/* ปุ่ม */}
        <div className="rc__actions">
          <a href="/wallet" className="btn-ghost">กลับ</a>
          <button className="btn-primary" onClick={() => window.print()}>พิมพ์</button>
        </div>
      </div>
    </div>
  );
}
