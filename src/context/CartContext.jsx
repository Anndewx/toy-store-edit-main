import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  addToCart,
  clearCart, createOrder,
  fetchCart,
  removeFromCart,
  updateCartQty,
} from "../lib/api";

const CartCtx = createContext(null);
export const useCart = () => useContext(CartCtx);

export default function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const data = await fetchCart();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("fetch cart failed:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function add(product_id, qty = 1) { await addToCart(product_id, qty); await refresh(); }
  async function updateQty(product_id, qty) { await updateCartQty(product_id, qty); await refresh(); }
  async function remove(product_id) { await removeFromCart(product_id); await refresh(); }
  async function clear() { await clearCart(); await refresh(); }

  // ✅ โหมดจริง + โหมดจำลอง (เดโม)
  async function checkout(payload = {}) {
    const snapshot = {
      at: new Date().toISOString(),
      items: items.map(i => ({ ...i })),
      subtotal: items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0),
    };

    // 1) พยายามยิง API จริงก่อน
    try {
      const res = await createOrder(payload);
      if (res?.ok) {
        localStorage.setItem("lastOrder", JSON.stringify({
          ...snapshot,
          order_id: res.order_id,
          total: res.total,
          method: payload.method || "unknown",
          payload, // เก็บข้อมูล (ไว้โชว์ในใบเสร็จ)
        }));
        await refresh();
        return res;
      }
    } catch (e) {
      // ผ่านไปใช้โหมดจำลอง
      console.warn("createOrder failed, fallback to demo mode:", e);
    }

    // 2) โหมดจำลอง (เดโม) — ไม่ต้องติดต่อเซิร์ฟเวอร์ก็มีใบเสร็จ
    const demoRes = {
      ok: true,
      order_id: `SIM-${Date.now().toString().slice(-6)}`,
      total: snapshot.subtotal,
    };

    localStorage.setItem("lastOrder", JSON.stringify({
      ...snapshot,
      order_id: demoRes.order_id,
      total: demoRes.total,
      method: payload.method || "demo",
      payload,
      demo: true,
    }));

    // เคลียร์ตะกร้าแบบ local ให้ฟีลสะอาดตา
    try { await clearCart(); } catch {}
    await refresh();

    return demoRes;
  }

  useEffect(() => { refresh(); }, []);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0),
    [items]
  );
  const count = useMemo(
    () => items.reduce((s, i) => s + Number(i.quantity), 0),
    [items]
  );

  return (
    <CartCtx.Provider
      value={{ items, loading, subtotal, count, add, updateQty, remove, clear, checkout, refresh }}
    >
      {children}
    </CartCtx.Provider>
  );
}
