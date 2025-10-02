import { useCart } from "../context/CartContext";
import { get } from "../lib/api"; // ✅ เพิ่ม: ใช้เรียก /api/addresses

export default function CartPage() {
  const { cart, remove } = useCart();

  // ✅ เพิ่ม: เช็กว่ามีที่อยู่ก่อนอนุญาตให้สั่งซื้อ
  async function handleCheckout() {
    try {
      const list = await get("/addresses");      // เรียก backend จริง
      if (!Array.isArray(list) || list.length === 0) {
        alert("กรุณาเพิ่มที่อยู่จัดส่งก่อนทำการสั่งซื้อ");
        // คุณอาจเปิด Modal/พาไปหน้าโปรไฟล์ได้ที่นี่
        return;
      }
      const def = list.find(a => a.is_default) || list[0];
      // เก็บ address ที่เลือกไว้ให้ขั้นตอนถัดไปอ่านได้
      localStorage.setItem("selected_address_id", String(def.address_id));
      localStorage.setItem("selected_address_short", `${def.line1} ${def.subdistrict} ${def.postcode}`);
      // 👉 ถึงจุดนี้ถือว่า “ผ่านเงื่อนไขมีที่อยู่แล้ว”
      // คุณสามารถนำทางไปหน้า Checkout หรือยิง POST /orders ต่อได้ตาม flow เดิม
      // ตัวอย่าง: window.location.href = "/checkout";
      alert("พร้อมชำระเงิน (มีที่อยู่จัดส่งแล้ว)");
    } catch (e) {
      console.error("load addresses failed:", e);
      alert("ไม่สามารถตรวจสอบที่อยู่ได้ กรุณาลองใหม่อีกครั้ง");
    }
  }

  return (
    <div className="container-narrow">
      <h2>ตะกร้าสินค้า</h2>
      {cart.length === 0 ? (
        <p>ยังไม่มีสินค้าในตะกร้า</p>
      ) : (
        <>
          {cart.map((c) => (
            <div key={c.product_id}>
              {c.name} x {c.qty}
              <button onClick={() => remove(c.product_id)}>ลบ</button>
            </div>
          ))}
          {/* ✅ เพิ่ม: ปุ่มสั่งซื้อ + เช็กที่อยู่ก่อน */}
          <div style={{ marginTop: 12 }}>
            <button onClick={handleCheckout}>สั่งซื้อ</button>
          </div>
        </>
      )}
    </div>
  );
}
