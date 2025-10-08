import { useEffect, useState } from "react";
import { adminGetOrders, adminUpdateOrderStatus } from "../../api/admin";

// ✅ ใช้สถานะเดียวกับ OrderTracking/ใบเสร็จ
const FLOW = ["placed", "processing", "shipping", "delivered"];
const LABELS = {
  placed: "ได้รับออเดอร์",
  processing: "กำลังแพ็กของ",
  shipping: "กำลังจัดส่ง",
  delivered: "ถึงปลายทาง",
};

export default function AdminOrders() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await adminGetOrders();
        setRows(data || []);
      } catch (e) {
        alert("โหลดคำสั่งซื้อไม่สำเร็จ: " + e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const nextStatus = (s) => {
    const i = FLOW.indexOf(s);
    return i === -1 ? FLOW[0] : FLOW[Math.min(i + 1, FLOW.length - 1)];
  };

  const handleNext = async (order) => {
    const to = nextStatus(order.status);
    if (to === order.status) return; // ถึงปลายทางแล้ว
    try {
      await adminUpdateOrderStatus(order.order_id, to);
      setRows((prev) =>
        prev.map((r) => (r.order_id === order.order_id ? { ...r, status: to } : r))
      );
    } catch (e) {
      alert("อัปเดตสถานะไม่สำเร็จ: " + e.message);
    }
  };

  if (loading) return <div>กำลังโหลด...</div>;

  return (
    <div>
      <h2>คำสั่งซื้อทั้งหมด</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>Order#</th>
            <th style={th}>User</th>
            <th style={th}>ยอดรวม</th>
            <th style={th}>จ่ายโดย</th>
            <th style={th}>สถานะ</th>
            <th style={th}>อัปเดต</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.order_id}>
              <td style={td}>{o.order_id}</td>
              <td style={td}>{o.user_id}</td>
              <td style={td}>{Number(o.total_price).toFixed(2)}</td>
              <td style={td}>{o.payment_method || "-"}</td>
              <td style={td}>{LABELS[o.status] || LABELS.placed}</td>
              <td style={td}>
                <button onClick={() => handleNext(o)}>
                  ไปขั้นถัดไป ({LABELS[nextStatus(o.status)]})
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td style={td} colSpan={6}>
                ไม่มีคำสั่งซื้อ
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const th = { textAlign: "left", borderBottom: "1px solid #eee", padding: 8 };
const td = { borderBottom: "1px solid #f4f4f4", padding: 8 };
