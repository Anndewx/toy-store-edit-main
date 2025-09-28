import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrder } from "../lib/api";

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getOrder(id);
        setOrder(data);
      } catch (e) {
        console.error(e);
        setOrder(null);
      }
    })();
  }, [id]);

  if (!order) return <div className="container py-4">กำลังโหลด...</div>;

  return (
    <div className="container py-4" style={{ maxWidth: 820 }}>
      <h3 className="mb-2">คำสั่งซื้อ #{order.order.order_id}</h3>
      <div className="text-muted mb-3">{new Date(order.order.created_at).toLocaleString()}</div>

      <ul className="list-group mb-3">
        {order.items.map((it) => (
          <li key={`${it.order_id}-${it.product_id}`} className="list-group-item d-flex justify-content-between">
            <div>{it.name} × {it.quantity}</div>
            <div>${(it.price * it.quantity).toFixed(2)}</div>
          </li>
        ))}
      </ul>

      <div className="d-flex justify-content-between fw-bold">
        <span>รวมทั้งสิ้น</span>
        <span>${Number(order.order.total_price).toFixed(2)}</span>
      </div>

      <Link to="/wallet" className="btn btn-dark mt-3">กลับไป Wallet</Link>
    </div>
  );
}
