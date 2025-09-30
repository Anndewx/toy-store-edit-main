// src/lib/api.js

function authHeaders(extra = {}) {
  const token = localStorage.getItem("token");
  return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
}

async function http(method, path, body, options = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(method !== "GET" ? { "Content-Type": "application/json" } : {}),
      ...authHeaders(options.headers || {}),
    },
    ...(method !== "GET" ? { body: JSON.stringify(body ?? {}) } : {}),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

export const get   = (p, o)   => http("GET",    p, null, o);
export const post  = (p, b, o)=> http("POST",   p, b,   o);
export const patch = (p, b, o)=> http("PATCH",  p, b,   o);
export const del   = (p, o)   => http("DELETE", p, null, o);

// -------- Products --------
export const fetchProducts     = ()        => get(`/products`);
export const fetchProductById  = (id)      => get(`/products/${id}`);
export const fetchProduct      = (id)      => get(`/products/${id}`);

// -------- Cart --------
export const fetchCart       = (options)                        => get(`/cart`, options);
export const addToCart       = (product_id, quantity=1, options)=> post(`/cart`, { product_id, quantity }, options);
// ✅ ปรับให้ updateCartQty ใช้ PATCH ที่ `/cart/{id}` ให้ตรง backend
export const updateCartQty   = (product_id, quantity, options)  => patch(`/cart/${product_id}`, { quantity }, options);
export const removeFromCart  = (product_id, options)            => del(`/cart/${product_id}`, options);
export const clearCart       = (options)                        => del(`/cart`, options);

// -------- Orders / Wallet (เหมือนเดิม) --------
export const createOrder   = (payload = {}, options) => post(`/orders`, payload, options);

export function saveDemoOrder(order) {
  try {
    const key = "wallet_demo_orders";
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    arr.unshift(order);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (_) {}
}

export async function listOrders() {
  let remote = [];
  try { remote = await get(`/orders`); } catch (_) { remote = []; }

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

export const getOrder    = (id) => get(`/orders/${id}`);
export const loginApi    = (payload) => post(`/login`, payload);
export const registerApi = (payload) => post(`/register`, payload);
