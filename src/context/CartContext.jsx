import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  addToCart,
  clearCart,
  createOrder,
  fetchCart,
  removeFromCart,
  updateCartQty,
} from "../lib/api";

const CartCtx = createContext(null);
export const useCart = () => useContext(CartCtx);

export default function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  function hasToken() {
    return !!localStorage.getItem("token");
  }

  function authHeader() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function handleUnauthorized() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setItems([]);
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  async function refresh() {
    setLoading(true);
    try {
      if (hasToken()) {
        const data = await fetchCart({ headers: authHeader() });
        setItems(Array.isArray(data) ? data : []);
      } else {
        setItems([]);
      }
    } catch (e) {
      console.error("fetch cart failed:", e);
      if ((e?.message || "").includes("401")) handleUnauthorized();
      else setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function add(product_id, qty = 1) {
    if (!hasToken()) {
      alert("กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า");
      window.location.href = "/login";
      return;
    }
    try {
      await addToCart(product_id, qty, { headers: authHeader() });
      await refresh();
    } catch (e) {
      if ((e?.message || "").includes("401")) handleUnauthorized();
      else throw e;
    }
  }

  // ✅ ฟังก์ชันซื้อเลย: ล้างตะกร้า -> เพิ่มสินค้าใหม่ -> refresh
  async function buyNow(product_id, qty = 1) {
    if (!hasToken()) {
      alert("กรุณาเข้าสู่ระบบก่อนทำรายการ");
      window.location.href = "/login";
      return;
    }
    try {
      await clearCart({ headers: authHeader() });
      await addToCart(product_id, qty, { headers: authHeader() });
      await refresh();
    } catch (e) {
      if ((e?.message || "").includes("401")) handleUnauthorized();
      else throw e;
    }
  }

  async function updateQty(product_id, qty) {
    if (!hasToken()) return;
    try {
      await updateCartQty(product_id, qty, { headers: authHeader() });
      await refresh();
    } catch (e) {
      if ((e?.message || "").includes("401")) handleUnauthorized();
    }
  }

  function changeQty(product_id, delta) {
    const item = items.find(i => Number(i.product_id) === Number(product_id));
    if (!item) return;
    const newQty = Math.max(1, Number(item.quantity) + Number(delta || 0));
    updateQty(product_id, newQty);
  }

  async function remove(product_id) {
    if (!hasToken()) return;
    try {
      await removeFromCart(product_id, { headers: authHeader() });
      await refresh();
    } catch (e) {
      if ((e?.message || "").includes("401")) handleUnauthorized();
    }
  }

  async function clear() {
    if (!hasToken()) return;
    try {
      await clearCart({ headers: authHeader() });
      await refresh();
    } catch (e) {
      if ((e?.message || "").includes("401")) handleUnauthorized();
    }
  }

  async function checkout(payload = {}) {
    if (!hasToken()) {
      alert("กรุณาเข้าสู่ระบบก่อนทำรายการสั่งซื้อ");
      window.location.href = "/login";
      return;
    }

    const snapshot = {
      at: new Date().toISOString(),
      items: items.map((i) => ({ ...i })),
      subtotal: items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0),
    };

    try {
      const res = await createOrder(payload, { headers: authHeader() });
      if (res?.ok) {
        localStorage.setItem(
          "lastOrder",
          JSON.stringify({
            ...snapshot,
            order_id: res.order_id,
            total: res.total,
            method: payload.method || "unknown",
            payload,
          })
        );
        await refresh();
        return res;
      }
    } catch (e) {
      if ((e?.message || "").includes("401")) {
        handleUnauthorized();
        return;
      }
      if (hasToken()) {
        console.warn("createOrder failed, fallback to demo:", e);
        const demoRes = {
          ok: true,
          order_id: `SIM-${Date.now().toString().slice(-6)}`,
          total: snapshot.subtotal,
        };
        localStorage.setItem(
          "lastOrder",
          JSON.stringify({
            ...snapshot,
            order_id: demoRes.order_id,
            total: demoRes.total,
            method: payload.method || "demo",
            payload,
            demo: true,
          })
        );
        try {
          await clearCart({ headers: authHeader() });
        } catch {}
        await refresh();
        return demoRes;
      }
      throw e;
    }
  }

  useEffect(() => {
    if (hasToken()) refresh();
  }, []);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0),
    [items]
  );
  const count = useMemo(() => items.reduce((s, i) => s + Number(i.quantity), 0), [items]);

  return (
    <CartCtx.Provider
      value={{
        items,
        loading,
        subtotal,
        count,
        add,
        buyNow, // ✅ เพิ่มตรงนี้
        updateQty,
        changeQty,
        remove,
        clear,
        checkout,
        refresh
      }}
    >
      {children}
    </CartCtx.Provider>
  );
}
