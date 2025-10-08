import { useEffect, useState } from "react";
import { adminGetProducts, adminUpdateStock } from "../../api/admin";

export default function AdminProducts() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await adminGetProducts();
        setRows(data || []);
      } catch (e) {
        alert("โหลดรายการสินค้าไม่สำเร็จ: " + e.message);
      }
    })();
  }, []);

  const save = async (id, stock) => {
    try {
      setBusy(id);
      await adminUpdateStock(id, stock);
      setRows((prev) => prev.map((p) => (p.product_id === id ? { ...p, stock } : p)));
    } catch (e) {
      alert("อัปเดตสต๊อกไม่สำเร็จ: " + e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <h2>จัดการสต๊อกสินค้า</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>สินค้า</th>
            <th style={th}>ราคา</th>
            <th style={th}>สต๊อก</th>
            <th style={th}>บันทึก</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.product_id}>
              <td style={td}>{p.product_id}</td>
              <td style={td}>{p.name}</td>
              <td style={td}>{Number(p.price).toFixed(2)}</td>
              <td style={td}>
                <input
                  type="number"
                  min={0}
                  defaultValue={p.stock ?? 0}
                  onChange={(e) =>
                    (p._newStock = Math.max(0, parseInt(e.target.value || "0", 10)))
                  }
                  style={{ width: 100 }}
                />
              </td>
              <td style={td}>
                <button
                  disabled={busy === p.product_id}
                  onClick={() => save(p.product_id, p._newStock ?? p.stock ?? 0)}
                >
                  {busy === p.product_id ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td style={td} colSpan={5}>ไม่มีสินค้า</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const th = { textAlign: "left", borderBottom: "1px solid #eee", padding: 8 };
const td = { borderBottom: "1px solid #f4f4f4", padding: 8 };
