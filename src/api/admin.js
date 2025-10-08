// src/api/admin.js
// เรียก API แบบแนบ token และ path ให้ตรงกับ backend ของคุณ

const API = import.meta.env.VITE_API_BASE || "http://localhost:3001";

function getToken() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

async function jfetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.message || j?.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// ------- Orders -------
export const adminGetOrders = () => jfetch("/api/admin/orders");

// ✅ ให้ตรง contract backend: ใช้ PUT และ body เป็น { action, to }
export function adminUpdateOrderStatus(orderId, statusOrAction) {
  // ถ้าหน้า Admin ส่งมาเป็น string (เช่น 'packing') ให้ใช้ action 'set'
  let body;
  if (typeof statusOrAction === "string") {
    body = { action: "set", to: statusOrAction };
  } else if (statusOrAction && typeof statusOrAction === "object") {
    // รองรับ { action: 'next' } หรือ { action: 'prev' }
    body = statusOrAction;
  } else {
    body = { action: "next" };
  }

  return jfetch(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// ------- Products / Stock -------
export const adminGetProducts = () => jfetch("/api/admin/products");
export const adminUpdateStock = (productId, stock) =>
  jfetch(`/api/admin/products/${encodeURIComponent(productId)}/stock`, {
    method: "PATCH",
    body: JSON.stringify({ stock: Number(stock) }),
  });
