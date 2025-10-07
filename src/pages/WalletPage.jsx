import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { listOrders } from "../lib/api";

// ป้ายวิธีชำระเงิน
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

export default function WalletPage() {
  const [orders, setOrders] = useState([]);
  const { search } = useLocation();
  const highlight = new URLSearchParams(search).get("order");

  useEffect(() => {
    (async () => {
      try {
        const data = await listOrders();
        setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setOrders([]);
      }
    })();
  }, []);

  // โหลด mapping และ lastOrder สำหรับ fallback
  let orderMethods = {};
  try { orderMethods = JSON.parse(localStorage.getItem("orderMethods") || "{}"); } catch {}
  let lastMethod = null;
  try { lastMethod = JSON.parse(localStorage.getItem("lastOrder") || "{}")?.method; } catch {}

  return (
    <div className="container py-4" style={{ maxWidth: 940 }}>
      <h3 className="mb-3">ประวัติการสั่งซื้อ</h3>

      {!orders.length ? (
        <div className="card"><div className="card-body text-muted">ยังไม่มีคำสั่งซื้อ</div></div>
      ) : (
        <ul className="list-group">
          {orders.map((o) => {
            const methodRaw = o.payment_method || orderMethods[String(o.order_id)] || lastMethod;
            return (
              <li
                key={o.order_id}
                className="list-group-item d-flex justify-content-between align-items-center"
                style={highlight === String(o.order_id) ? { boxShadow: "0 0 0 3px rgba(250,204,21,.25)" } : {}}
              >
                <div>
                  <div className="fw-semibold">คำสั่งซื้อ #{o.order_id}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {o.created_at ? new Date(o.created_at).toLocaleString() : "-"}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    วิธีชำระเงิน: <b>{paymentLabel(methodRaw)}</b>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <strong>{thb(o.total_price)}</strong>
                  <Link to={`/receipt?order=${o.order_id}`} className="btn btn-sm btn-outline-dark">รายละเอียด</Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
