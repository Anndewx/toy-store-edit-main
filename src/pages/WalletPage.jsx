import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { listOrders } from "../lib/api";

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

  return (
    <div className="container py-4">
      <h2 className="mb-3">กระเป๋าของฉัน (ประวัติคำสั่งซื้อ)</h2>
      {orders.length === 0 ? (
        <p className="text-muted">ยังไม่มีคำสั่งซื้อ</p>
      ) : (
        <ul className="list-group">
          {orders.map((o) => (
            <li
              key={o.order_id}
              className={`list-group-item d-flex justify-content-between ${String(o.order_id) === String(highlight) ? "border border-warning" : ""}`}
            >
              <div>
                <div>คำสั่งซื้อ #{o.order_id}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  {new Date(o.created_at).toLocaleString()}
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <strong>฿{Number(o.total_price).toFixed(2)}</strong>
                <Link to={`/receipt?order=${o.order_id}`} className="btn btn-sm btn-outline-dark">
                  รายละเอียด
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
