import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { listOrders } from "../lib/api";

// ให้ลบโดยชี้ไป API จริง (3001) ถ้าไม่ได้ตั้ง proxy
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  `${window.location.protocol}//${window.location.hostname}:3001`;

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

  const deleteOrder = async (orderId) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบคำสั่งซื้อ #${orderId}?`)) return;

    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    if (!token) {
      alert("กรุณาเข้าสู่ระบบใหม่ (ไม่พบโทเค็น)");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // credentials: "include", // ถ้า backend ใช้คุกกี้ด้วย ค่อยเปิดบรรทัดนี้
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setOrders(prev => prev.filter(o => o.order_id !== orderId));
      } else {
        alert(data?.error || "ลบไม่สำเร็จ");
      }
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการลบ");
    }
  };

  let orderMethods = {};
  try { orderMethods = JSON.parse(localStorage.getItem("orderMethods") || "{}"); } catch {}

  return (
    <div className="container py-4" style={{ maxWidth: 940 }}>
      <h3 className="mb-3">ประวัติการสั่งซื้อ</h3>

      {!orders.length ? (
        <div className="card"><div className="card-body text-muted">ยังไม่มีคำสั่งซื้อ</div></div>
      ) : (
        <ul className="list-group">
          {orders.map((o) => {
            const methodRaw = o.payment_method || orderMethods[String(o.order_id)] || null;

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

                <div className="d-flex align-items-center gap-2">
                  <strong>{thb(o.total_price)}</strong>
                  <Link to={`/receipt?order=${o.order_id}`} className="btn btn-sm btn-outline-dark">
                    รายละเอียด
                  </Link>
                  <button
                    onClick={() => deleteOrder(o.order_id)}
                    className="btn btn-sm btn-outline-danger"
                  >
                    ลบ
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
