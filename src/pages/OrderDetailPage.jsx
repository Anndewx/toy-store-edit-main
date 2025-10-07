import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { getOrder } from "../lib/api";

// แปลงชื่อวิธีจ่ายเป็นข้อความไทย
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

const thb = (n) => `฿${Number(n || 0).toFixed(2)}`;

export default function OrderDetailPage() {
  const { id: idFromParams } = useParams();
  const { search } = useLocation();
  const idFromQuery = new URLSearchParams(search).get("order");
  const id = idFromParams || idFromQuery;

  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!id) return;
        const res = await getOrder(id);
        if (alive) setData(res || null);
      } catch (e) {
        console.error(e);
        if (alive) setData(null);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (!data) return <div className="container py-4">กำลังโหลด...</div>;

  // จาก API ของคุณ: { order: {...}, items: [...] }
  const order = data.order || {};
  const items = Array.isArray(data.items) ? data.items : [];

  // สำรองค่าจาก localStorage (เราบันทึกไว้ตอน checkout)
  let methodRaw = order.payment_method;
  if (!methodRaw) {
    try {
      const last = JSON.parse(localStorage.getItem("lastOrder") || "{}");
      methodRaw = last?.method;
    } catch {}
  }
  const methodTH = paymentLabel(methodRaw);

  return (
    <div className="container py-4" style={{ maxWidth: 920 }}>
      {/* หัวใบเสร็จ */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <h3 className="mb-3">ใบเสร็จรับเงิน</h3>
            <div className="text-muted">#{order.order_id}</div>
          </div>

          <div className="d-flex justify-content-between text-muted">
            <div>วันที่</div>
            <div>{order.created_at ? new Date(order.created_at).toLocaleString() : "-"}</div>
          </div>

          <div className="d-flex justify-content-between text-muted">
            <div>วิธีชำระเงิน</div>
            <div style={{ fontWeight: 700 }}>{methodTH}</div>
          </div>
        </div>
      </div>

      {/* รายการสินค้า */}
      <ul className="list-group mb-3">
        <li className="list-group-item d-flex justify-content-between fw-bold">
          <span>รายการ</span>
          <span className="d-flex" style={{ gap: 56 }}>
            <span>จำนวน</span>
            <span>ราคา</span>
          </span>
        </li>
        {items.map((it) => (
          <li key={`${it.order_id}-${it.product_id}`} className="list-group-item d-flex justify-content-between">
            <div>{it.name}</div>
            <div className="d-flex" style={{ gap: 56 }}>
              <span>{it.quantity}</span>
              <span>{thb(it.price * it.quantity)}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* รวมทั้งสิ้น */}
      <div className="d-flex justify-content-between fw-bold fs-5">
        <span>ยอดรวม</span>
        <span>{thb(order.total_price)}</span>
      </div>

      <div className="mt-3 d-flex gap-2">
        <Link to="/wallet" className="btn btn-outline-secondary">กลับหน้าแรก</Link>
        <button className="btn btn-primary" onClick={() => window.print()}>พิมพ์</button>
      </div>
    </div>
  );
}
