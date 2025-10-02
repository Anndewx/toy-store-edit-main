// src/lib/api.js

// ✅ กำหนด BASE_URL ให้ชี้ไปที่ backend port 3001
const BASE_URL = import.meta?.env?.VITE_API_BASE || "http://localhost:3001";

// ===== Auth header helper =====
function authHeaders(extra = {}) {
  // ✅ เพิ่ม fallback เผื่อเก็บ token คนละ key
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("token");
  return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
}

// ===== Low-level HTTP helper =====
async function http(method, path, body, options = {}) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers: {
      ...(method !== "GET" ? { "Content-Type": "application/json" } : {}),
      ...authHeaders(options.headers || {}),
    },
    ...(method !== "GET" ? { body: JSON.stringify(body ?? {}) } : {}),
    credentials: "include",
  });

  const isJSON = (res.headers.get("content-type") || "").includes("application/json");
  if (!res.ok) {
    let errDetail = isJSON ? await res.json().catch(() => ({})) : await res.text().catch(() => "");
    const e = new Error(errDetail?.message || errDetail || `HTTP ${res.status}`);
    e.status = res.status;
    e.detail = errDetail;
    throw e;
  }
  if (res.status === 204) return null;
  return isJSON ? res.json() : res.text();
}

// ===== Shortcuts =====
export const get   = (p, o)        => http("GET", p, undefined, o);
export const post  = (p, b, o)     => http("POST", p, b, o);
export const patch = (p, b, o)     => http("PATCH", p, b, o);
export const del   = (p, o)        => http("DELETE", p, undefined, o);

// =====================================================================
// Products
// =====================================================================
export const fetchProducts     = (options)              => get(`/products`, options);
export const fetchProduct      = (id, options)          => get(`/products/${id}`, options);
export const searchProducts    = (q = "", options)      => get(`/products/search?q=${encodeURIComponent(q)}`, options);
export const fetchNewProducts  = (limit = 12, options)  => get(`/products/new?limit=${limit}`, options);

// =====================================================================
// Cart
// =====================================================================
export const fetchCart      = (options)                               => get(`/cart`, options);
export const addToCart      = (product_id, quantity = 1, options)     => post(`/cart`, { product_id, quantity }, options);
export const updateCartQty  = (product_id, quantity, options)         => patch(`/cart/${product_id}`, { quantity }, options);
export const removeFromCart = (product_id, options)                   => del(`/cart/${product_id}`, options);
export const clearCart      = (options)                               => del(`/cart`, options);

// =====================================================================
// Orders
// =====================================================================
export const createOrder    = (payload = {}, options)                 => post(`/orders`, payload, options);
export const getOrders      = (options)                                => get(`/orders`, options);
export const getOrder       = (id, options)                            => get(`/orders/${id}`, options);

export async function listOrders() {
  const remote = await get(`/orders`).catch(() => []);
  let demo = [];
  try {
    demo = JSON.parse(localStorage.getItem("wallet_demo_orders") || "[]");
    demo = demo.map(d => ({
      order_id: d.order_id,
      total_price: d.total,
      status: d.status || "completed",
      created_at: d.created_at || new Date().toISOString(),
      _demo: true,
    }));
  } catch (_) {}
  return [...demo, ...remote];
}

// =====================================================================
// Auth
// =====================================================================
export const loginApi       = (payload, options)                       => post(`/login`, payload, options);
export const registerApi    = (payload, options)                       => post(`/register`, payload, options);

// =====================================================================
// Local demo helpers
// =====================================================================
export function saveDemoOrder(order) {
  try {
    const key = "wallet_demo_orders";
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    arr.unshift(order);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (_) {}
}

export async function listOrdersMerged() {
  const remote = await get(`/orders`).catch(() => []);
  let demo = [];
  try {
    demo = JSON.parse(localStorage.getItem("wallet_demo_orders") || "[]");
    demo = demo.map(d => ({
      order_id: d.order_id,
      total_price: d.total,
      status: d.status || "completed",
      created_at: d.created_at || new Date().toISOString(),
      _demo: true,
    }));
  } catch (_) {}
  return [...demo, ...remote];
}
