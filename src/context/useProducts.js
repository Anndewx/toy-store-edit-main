// src/hooks/useProducts.js
import { useEffect, useState, useCallback } from "react";

const api = (path) => fetch(path, { credentials: "include" });

export function useProducts(initial = true) {
  const [items, setItems]   = useState([]);
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState(null);

  const list = useCallback(async (q = "") => {
    try {
      setLoad(true); setError(null);
      const url = q ? `/api/products?q=${encodeURIComponent(q)}` : "/api/products";
      const r = await api(url);
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setItems(data);
    } catch (e) {
      setError(e.message || "fetch failed");
    } finally {
      setLoad(false);
    }
  }, []);

  const get = useCallback(async (id) => {
    const r = await api(`/api/products/${id}`);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }, []);

  useEffect(() => { if (initial) list(); }, [initial, list]);

  return { items, loading, error, list, get };
}

export default useProducts; // เผื่อกรณีมีการ import แบบ default
