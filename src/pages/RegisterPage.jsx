import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./ReceiptPage.css";

// ✅ ใช้ helper ที่แนบ Authorization ให้อัตโนมัติ
import { get } from "../lib/api";
// ✅ คอมโพเนนต์แถบติดตามสถานะ
import OrderTracking from "../components/OrderTracking";

function mask(s = "", left = 4, right = 2) {
  const str = String(s).replace(/\s/g, "");
  if (str.length <= left + right) return "****";
  return str.slice(0, left) + "****".repeat(3) + str.slice(-right);
}

export default function ReceiptPage() {
  const { search } = useLocation();
  const orderId = new URLSearchParams(search).get("order");
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      // ถ้ามี order param → ดึงจาก API
      if (orderId) {
        try {
          // ⛔️ ห้าม fetch ตรง /api/... เพราะจะไม่แนบ Bearer
          // ✅ ใช้ get() จาก lib/api (แนบ Authorization อัตโนมัติ)
          const json = await get(`/orders/${encodeURIComponent(orderId)}`); // { order, items }

          const order = json.order || {};
          const items = (json.items || []).map((i) => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
          }));

          // เตรียม history (ถ้ามีฟิลด์เวลาใน response จะถูกส่งเข้า OrderTracking)
          const history = {
            placed: order.placed_at || null,
            processing: order.processing_at || null,
            shipping: order.shipping_at || null,
            delivered: order.delivered_at || null,
          };

          setData({
            order_id: order.order_id,
            at: order.created_at,
            method: "unknown", // ฝั่ง server ยังไม่เก็บ method → แสดง unknown
            payload: {},
            items,
            total: Number(order.total_price || 0),
            demo: false,
            status: order.status || "placed",
            eta_text: order.eta_text || null,
            history, // 👉 ส่งต่อให้ OrderTracking
          });
          return;
        } catch {
          // ถ้าเรียก API ไม่สำเร็จ จะไปใช้ข้อมูลสำรองด้านล่าง
        }
      }

      // ไม่ได้ดึงจาก API → ใช้ข้อมูลสำรองจาก localStorage
      const raw = localStorage.getItem("lastOrder");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (!parsed.status) parsed.status = "placed";
          // เผื่อรองรับ premium tooltip ถ้ามีข้อมูลเวลาใน local
          parsed.history = parsed.history || {};
          setData(parsed);
          return;
        } catch {}
      }
      setData(null);
    })();
  }, [orderId]);

  if (!data || !data.order_id) {
    return (
      <div className="rcp">
        <div className="rcp__box">
          <h2>ไม่พบใบเสร็จ</h2>
          <p>กรุณาทำรายการสั่งซื้อใหม่อีกครั้ง</p>
        </div>
      </div>
    );
  }

  const method = (data.method || "unknown").toUpperCase();
  const pay = data.payload || {};
  const cardMasked = pay.card_number ? mask(pay.card_number) : null;

  return (
    <div className="rcp">
      {/* ✅ แสดงแถบติดตามสถานะ (รถวิ่ง) ด้านบนกล่องใบเสร็จ */}
      <div style={{ maxWidth: 960, margin: "0 auto 16px" }}>
        <OrderTracking
          status={data.status || "placed"}
          etaText={data.eta_text || undefined}
          history={data.history || undefined}
        />
      </div>

      <div className="rcp__box">
        <h2>ใบเสร็จรับเงิน</h2>
        {data.demo && <div className="rcp__tag">DEMO</div>}

        <div className="rcp__row"><span>หมายเลขใบเสร็จ</span><b>#{data.order_id}</b></div>
        <div className="rcp__row"><span>วันที่</span><b>{new Date(data.at).toLocaleString()}</b></div>
        <div className="rcp__row"><span>วิธีชำระเงิน</span><b>{method}</b></div>
        {cardMasked && <div className="rcp__row"><span>หมายเลขบัตร</span><b>{cardMasked}</b></div>}

        <div className="rcp__table">
          <div className="rcp__thead"><span>รายการ</span><span>จำนวน</span><span>ราคา</span></div>
          {data.items?.map((i, idx) => (
            <div className="rcp__tr" key={idx}>
              <span>{i.name}</span>
              <span>{i.quantity}</span>
              <span>฿{(Number(i.price) * Number(i.quantity)).toFixed(2)}</span>
            </div>
          ))}
          <div className="rcp__tfoot">
            <span>ยอดรวม</span>
            <span />
            <b>฿{Number(data.total || 0).toFixed(2)}</b>
          </div>
        </div>

        <div className="rcp__actions">
          <a href="/" className="rcp__btn">กลับหน้าแรก</a>
          <button className="rcp__btn ghost" onClick={() => window.print()}>พิมพ์</button>
        </div>
      </div>
    </div>
  );
}
