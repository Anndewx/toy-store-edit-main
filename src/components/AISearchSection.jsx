// src/components/AISearchSection.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../styles/ai.css";
import { useCart } from "../context/CartContext";

// ============= helpers (คงสไตล์เดิม) =============
const fixImg = (u) =>
  !u ? "" : u.startsWith("http") ? u : (u.startsWith("/") ? u : `/${u}`);

const parsePrompt = (input) => {
  const s = (input || "").toLowerCase();
  const p = {};
  if (/sale|ลด|โปร/.test(s)) p.onSale = 1;
  const m = s.match(/(\d{2,6})/);
  if (m) p.maxPrice = Number(m[1]);
  p.q = s.replace(/sale|ลด|โปร/g, "").replace(/\d{2,6}/g, "").trim();
  return p;
};

const TOPICS = [
  { key: "foryou",   label: "สำหรับคุณ",  icon: "✨", params: { popular: 1 } },
  { key: "trending", label: "มาแรง",      icon: "📈", params: { popular: 1, newest: 1 } },
  { key: "sale",     label: "ราคาพิเศษ",  icon: "💸", params: { onSale: 1 } },
  { key: "new",      label: "มาใหม่",      icon: "🆕", params: { newest: 1 } },
];

// Fisher–Yates shuffle เพื่อสุ่มผลลัพธ์ก่อนเลือก 2 ชิ้น
const shuffle = (arr) => {
  if (!Array.isArray(arr)) return [];
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function AISearchSection() {
  const [prompt, setPrompt] = useState("");
  const [topic, setTopic] = useState("foryou");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { add } = useCart();

  const topicParams = useMemo(
    () => TOPICS.find((t) => t.key === topic)?.params || { popular: 1 },
    [topic]
  );

  const pickTop = (arr, n = 2) => (Array.isArray(arr) ? arr.slice(0, n) : []);

  const fetchReal = async (params) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: 8, ...params }).toString();
      let data = [];

      // 1) เรียก /search ก่อน (คงพฤติกรรมเดิม แต่เพิ่มเช็ค r.ok)
      try {
        const r1 = await fetch(`/api/products/search?${qs}`);
        if (r1.ok) {
          data = await r1.json();
        } else {
          console.error("Search failed:", r1.status);
        }
      } catch (_) {}

      // 2) ถ้าไม่ได้ → fallback ไป /new และกัน cache
      if (!Array.isArray(data) || data.length === 0) {
        try {
          const r2 = await fetch(`/api/products/new?limit=8&_=${Date.now()}`);
          if (r2.ok) {
            data = await r2.json();
          } else {
            console.error("Fallback /new failed:", r2.status);
          }
        } catch (_) {}
      }

      // 3) map → filter เหมือนเดิม แล้ว "สุ่ม" ก่อนเลือก 2 ชิ้น
      const mapped = (Array.isArray(data) ? data : [])
        .map((p) => ({
          id: p.product_id ?? p.id,
          name: p.name,
          price: p.price,
          img: fixImg(p.image || p.image_url || p.thumbnail),
          tag: p.category_slug || "",
          discount: p.discount ?? null,
        }))
        .filter((x) => x.id && x.img);

      setItems(pickTop(shuffle(mapped), 2));
    } finally {
      setLoading(false);
    }
  };

  const onAI = (e) => {
    e?.preventDefault();
    const extra = parsePrompt(prompt);
    const params = { ...topicParams, ...extra };
    fetchReal(params);
  };

  const onPickTopic = (key) => {
    setTopic(key);
    const params = { ...TOPICS.find((t) => t.key === key)?.params };
    fetchReal(params);
  };

  useEffect(() => {
    // สิงห์เดิม: ฟัง custom event เพื่อ trigger ค้นหาแบบด่วน
    const handler = (e) => {
      const detail = e?.detail || {};
      fetchReal(detail);
    };
    window.addEventListener("ai:quickSearch", handler);
    return () => window.removeEventListener("ai:quickSearch", handler);
  }, []);

  const handleAddToCart = (p) => {
    const productId = p.id ?? p.product_id;
    if (!productId) return;
    try {
      add(productId, 1);
      const el = document.querySelector(".ai-toast");
      if (el) {
        el.textContent = `+ เพิ่ม ${p.name} ลงตะกร้าแล้ว`;
        el.classList.add("show");
        setTimeout(() => el.classList.remove("show"), 1600);
      }
    } catch (err) {
      console.error("add to cart failed:", err);
    }
  };

  // ============= JSX เดิมพร้อมคลาสเดิม (ai.css) =============
  return (
    <section className="ai-section">
      <div className="ai-shell">
        <div className="ai-sticky-wrap">
          {/* แถบค้นหา */}
          <div className="ai-rect-bar compact centered">
            <div className="ai-rect-left">
              <div className="ai-rect-avatar">🪄</div>
              <form className="ai-rect-search" onSubmit={onAI}>
                <span className="ai-rect-search-ic">🔎</span>
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="ค้นหาอัจฉริยะ: gundam"
                  aria-label="AI Search"
                />
              </form>
            </div>
            <div className="ai-rect-actions">
              <button className="ai-btn primary-y" onClick={onAI}>AI Suggest</button>
            </div>
          </div>

          {/* ปุ่มหัวข้อ */}
          <div className="ai-topics slim centered">
            {TOPICS.map((t) => (
              <button
                key={t.key}
                className={`topic ${topic === t.key ? "active" : ""}`}
                onClick={() => onPickTopic(t.key)}
                title={t.label}
              >
                <span className="t-ic">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Mini results */}
          <div className="ai-mini-results">
            {loading ? (
              <>
                <div className="ai-mini-card skeleton" />
                <div className="ai-mini-card skeleton" />
              </>
            ) : items.length > 0 ? (
              items.map((p) => (
                <div className="ai-mini-card" key={p.id}>
                  <div className="ai-mini-thumb">
                    <img src={p.img} alt={p.name} loading="lazy" />
                  </div>
                  <div className="ai-mini-body">
                    <div className="ai-mini-name" title={p.name}>{p.name}</div>
                    <div className="ai-mini-price">฿{Number(p.price).toFixed(2)}</div>
                    {p.discount
                      ? <div className="ai-mini-badge">แนะนำ · ลด {p.discount}%</div>
                      : <div className="ai-mini-badge">แนะนำโดย AI</div>}
                    <div className="ai-mini-actions">
                      <button className="add-btn" onClick={() => handleAddToCart(p)}>
                        🛒 เพิ่มลงตะกร้า
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="ai-empty ytext">ยังไม่มีสินค้าตามเงื่อนไข</div>
            )}
          </div>

          <div className="ai-toast" aria-live="polite" />
        </div>
      </div>
    </section>
  );
}
