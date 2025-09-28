// src/lib/api.js

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function http(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(method !== "GET" ? { "Content-Type": "application/json" } : {}),
      ...authHeaders(),
    },
    ...(method !== "GET" ? { body: JSON.stringify(body ?? {}) } : {}),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

export const get   = (p)    => http("GET",    p);
export const post  = (p,b)  => http("POST",   p, b);
export const patch = (p,b)  => http("PATCH",  p, b);
export const del   = (p)    => http("DELETE", p);

// -------- Products --------
export const fetchProducts     = ()        => get(`/products`);
export const fetchProductById  = (id)      => get(`/products/${id}`);
export const fetchProduct      = (id)      => get(`/products/${id}`);

// -------- Cart --------
export const fetchCart       = ()                         => get(`/cart`);
export const addToCart       = (product_id, quantity=1)   => post(`/cart`, { product_id, quantity });
export const updateCartQty   = (product_id, quantity)     => patch(`/cart`, { product_id, quantity });
export const removeFromCart  = (product_id)               => del(`/cart/${product_id}`);
export const clearCart       = ()                         => del(`/cart`);

// -------- Orders / Wallet (เหมือนเดิม) --------
export const createOrder   = (payload = {}) => post(`/orders`, payload);

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
export const loginApi    = (payload) => post(`/auth/login`, payload);
export const registerApi = (payload) => post(`/auth/register`, payload);
