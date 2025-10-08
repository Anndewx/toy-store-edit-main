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

/* === normalize ชื่อสถานะจาก backend ให้เข้ากับ OrderTracking.jsx === */
const mapStatus = (s) => {
  const k = String(s || "").toLowerCase();
  if (k === "received" || k === "new" || k === "created") return "placed";
  if (k === "packing" || k === "packed" || k === "processing") return "processing";
  if (k === "shipped" || k === "shipping") return "shipping";
  if (k === "complete" || k === "completed" || k === "delivered") return "delivered";
  return k || "placed";
};

/* polling */
const TERMINAL_STATES = new Set(["delivered", "completed", "cancelled"]);
const REFRESH_MS = 10_000;

export default function ReceiptPage() {
  const { search } = useLocation();
  const orderId = new URLSearchParams(search).get("order");
  const [data, setData] = useState(null);

  /* โหลดครั้งแรก (กันแคช + normalize) */
  useEffect(() => {
    (async () => {
      try {
        if (!orderId) throw new Error("no id");
        const json = await get(`/orders/${encodeURIComponent(orderId)}?t=${Date.now()}`); // { order, items }
        const order = json.order || {};
        const items = Array.isArray(json.items) ? json.items : [];

        let map = {}, last = {};
        try { map = JSON.parse(localStorage.getItem("orderMethods") || "{}"); } catch {}
        try { last = JSON.parse(localStorage.getItem("lastOrder") || "{}"); } catch {}

        const methodRaw = order.payment_method || map[String(order.order_id)] || last.method;

        setData({
          id: order.order_id,
          at: order.created_at,
          status: mapStatus(order.status || "placed"),
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
              status: mapStatus(last.status || "placed"),
              method: last.method,
              items: last.items || [],
              total: Number(last.total || 0),
            });
          }
        } catch {}
      }
    })();
  }, [orderId]);

  /* polling ทุก 10 วิ (กันแคช + normalize) */
  useEffect(() => {
    if (!data?.id) return;

    let alive = true;
    let timerId = null;

    const tick = async () => {
      try {
        const curStatus = String(data.status || "").toLowerCase();
        if (TERMINAL_STATES.has(curStatus)) return;

        const json = await get(`/orders/${encodeURIComponent(data.id)}?t=${Date.now()}`);
        const order = json.order || {};
        const items = Array.isArray(json.items) ? json.items : [];

        if (!alive) return;

        setData((prev) => ({
          ...(prev || {}),
          id: order.order_id ?? prev?.id,
          at: order.created_at ?? prev?.at,
          status: mapStatus(order.status || prev?.status || "placed"),
          method: (order.payment_method ?? prev?.method),
          items,
          total: Number(order.total_price ?? order.total ?? prev?.total ?? 0),
        }));

        const nextStatusStr = mapStatus(order.status || "");
        if (TERMINAL_STATES.has(nextStatusStr) && timerId) {
          clearInterval(timerId);
        }
      } catch {
        // ignore
      }
    };

    tick();
    timerId = setInterval(tick, REFRESH_MS);

    return () => {
      alive = false;
      if (timerId) clearInterval(timerId);
    };
  }, [data?.id]); // ไม่ต้องใส่ data.status เพื่อไม่ให้รีเซ็ต interval บ่อย

  if (!data) return <div className="container py-4">กำลังโหลด...</div>;

  const methodText = paymentLabel(data.method);
  const methodCls = `pay-badge ${paymentKey(data.method)}`;

  return (
    <div className="container py-4" style={{ maxWidth: 1040 }}>
      <div className="mb-3">
        <OrderTracking status={data.status || "placed"} />
      </div>

      <div className="rc__card">
        <div className="rc__head">
          <h2 className="rc__title">ใบเสร็จรับเงิน</h2>
          <div className="rc__id">#{data.id}</div>
        </div>

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

        <div className="rc__actions">
          <a href="/wallet" className="btn-ghost">กลับ</a>
          <button className="btn-primary" onClick={() => window.print()}>พิมพ์</button>
        </div>
      </div>
    </div>
  );
}
