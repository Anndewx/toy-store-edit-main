import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { listOrders } from "../lib/api";
import "./WalletPage.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  `${window.location.protocol}//${window.location.hostname}:3001`;

const paymentLabel = (v) => {
  switch ((v || "").toLowerCase()) {
    case "bank":
      return "โอนธนาคาร";
    case "cod":
      return "เก็บเงินปลายทาง (COD)";
    case "promptpay":
    case "other":
      return "PromptPay (สแกน QR)";
    case "card":
    case "credit":
      return "บัตรเครดิต/เดบิต";
    default:
      return "—";
  }
};

const thb = (n) =>
  `฿${Number(n || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
  })}`;

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
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return alert("กรุณาเข้าสู่ระบบใหม่");

    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok)
        setOrders((prev) => prev.filter((o) => o.order_id !== orderId));
      else alert(data?.error || "ลบไม่สำเร็จ");
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการลบ");
    }
  };

  let orderMethods = {};
  try {
    orderMethods = JSON.parse(localStorage.getItem("orderMethods") || "{}");
  } catch {}

  return (
    <div className="container py-4 wallet-page" style={{ maxWidth: 940 }}>
      <h2 className="wallet-title">📦 ประวัติคำสั่งซื้อของคุณ</h2>

      {!orders.length ? (
        <div className="wallet-empty">ยังไม่มีคำสั่งซื้อ</div>
      ) : (
        <ul className="list-group">
          {orders.map((o) => {
            const methodRaw =
              o.payment_method || orderMethods[String(o.order_id)] || null;
            const isHighlight = highlight === String(o.order_id);

            return (
              <li
                key={o.order_id}
                className={`list-group-item ${isHighlight ? "highlight" : ""}`}
              >
                <div className="wallet-info">
                  <div className="fw-semibold">คำสั่งซื้อ #{o.order_id}</div>
                  <div className="text-muted" style={{ fontSize: 13 }}>
                    {o.created_at
                      ? new Date(o.created_at).toLocaleString("th-TH")
                      : "-"}
                  </div>
                  <div className="wallet-payment">
                    วิธีชำระเงิน: <b>{paymentLabel(methodRaw)}</b>
                  </div>
                </div>

                <div className="d-flex wallet-right">
                  <strong>{thb(o.total_price)}</strong>
                  <Link
                    to={`/receipt?order=${o.order_id}`}
                    className="btn btn-sm btn-outline-dark"
                  >
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
