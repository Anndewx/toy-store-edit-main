import React, { useEffect, useRef, useState } from "react";
import "../styles/ai.css";
import { useCart } from "../context/CartContext";

const MAIN_BANNER_URL = "/images/banner-main.jpg";
const SIDE1_BANNER_URL = "/images/banner-side1.jpg";
const SIDE2_BANNER_URL = "/images/banner-side2.jpg";

const API_BASE = import.meta.env.VITE_API_BASE || "";
const fixImg = (url) => {
  if (!url) return "";
  if (/^https?:/i.test(url) || url.startsWith("/")) return url;
  return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
};

const DEFAULT_BANNERS = [
  { title: "โปรโมชั่นพิเศษ", image_url: MAIN_BANNER_URL },
  { title: "Superhero Zone", image_url: SIDE1_BANNER_URL },
  { title: "Game & Anime", image_url: SIDE2_BANNER_URL },
];

const CATEGORIES = [
  { key: "superhero", label: "ซูเปอร์ฮีโร่", emoji: "🧑‍🎤" },
  { key: "game", label: "เกม", emoji: "🎮" },
  { key: "anime", label: "อนิเมะ", emoji: "✨" },
  { key: "gundam", label: "หุ่นยนต์", emoji: "🤖" },
];

const isValidBannerUrl = (u) => {
  if (typeof u !== "string" || !u.trim()) return false;
  if (/^https?:\/\//i.test(u)) return true;
  if (u.startsWith("/images/")) return true;
  return false;
};

export default function AISearchSection() {
  const [hero, setHero] = useState(DEFAULT_BANNERS);
  const [loadingHero, setLoadingHero] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("แนะนำสำหรับคุณ");
  const { add } = useCart();

  useEffect(() => {
    (async () => {
      setLoadingHero(true);
      try {
        const r = await fetch("/api/banners");
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data) && data.length) {
            const merged = DEFAULT_BANNERS.map((def, i) => {
              const api = data[i] || {};
              const useUrl = isValidBannerUrl(api.image_url)
                ? api.image_url
                : def.image_url;
              return { title: api.title || def.title, image_url: useUrl };
            });
            setHero(merged);
          } else setHero(DEFAULT_BANNERS);
        } else setHero(DEFAULT_BANNERS);
      } catch {
        setHero(DEFAULT_BANNERS);
      } finally {
        setLoadingHero(false);
      }
    })();
  }, []);

  useEffect(() => {
    fetchProducts({ popular: 1 }, "แนะนำสำหรับคุณ");
  }, []);

  const fetchProducts = async (params, heading) => {
    setLoading(true);
    setTitle(heading);
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`/api/products/search?${qs}`);
      const data = res.ok ? await res.json() : [];
      const mapped = (Array.isArray(data) ? data : [])
        .map((p, i) => ({
          id: p.product_id ?? p.id ?? `tmp-${i}`,
          name: p.name,
          price: p.price,
          img: fixImg(p.image || p.image_url || p.thumbnail),
          on_sale: p.on_sale ?? 0,
        }))
        .filter((x) => x.id && x.img);
      setItems(mapped.slice(0, 10));
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    fetchProducts({ q: prompt }, `ค้นหา: ${prompt}`);
  };

  const handleCategory = (slug) => {
    fetchProducts(
      { category: slug, popular: 1 },
      `หมวด: ${CATEGORIES.find((c) => c.key === slug)?.label || slug}`
    );
  };

  const handleAdd = (p) => {
    add(p.id, 1);
    const el = document.querySelector(".ai-toast");
    if (el) {
      el.textContent = `+ เพิ่ม ${p.name} ลงตะกร้าแล้ว`;
      el.classList.add("show");
      setTimeout(() => el.classList.remove("show"), 1200);
    }
  };

  return (
    <>
      <section className="heroLight">
        <div className="heroWrap">
          {loadingHero ? (
            <div className="heroGrid">
              <div className="heroMain skeleton" />
              <div className="heroSide skeleton" />
              <div className="heroSide skeleton" />
            </div>
          ) : (
            <div className="heroGrid">
              {hero.map((b, i) => (
                <div
                  key={`hero-${i}`}
                  className={i === 0 ? "heroMain" : "heroSide"}
                >
                  <img
                    src={b.image_url}
                    alt={b.title}
                    className="heroImg"
                    draggable="false"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="shopLight">
        <div className="shopWrap">
          <div className="sBar">
            <form className="sInput" onSubmit={handleSearch}>
              <span className="sIc">🔎</span>
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="ค้นหา: gundam"
              />
            </form>
            <button className="sBtn" onClick={handleSearch}>
              Search
            </button>
          </div>

          <ProductsRow
            title={title}
            loading={loading}
            items={items}
            onAdd={handleAdd}
          />
        </div>
      </section>

      <section className="fabCats">
        <div className="fabWrap fabWrap--center">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              className="fabBtn"
              onClick={() => handleCategory(c.key)}
            >
              <span className="em">{c.emoji}</span> {c.label}
            </button>
          ))}
        </div>
      </section>

      <div className="ai-toast" aria-live="polite" />
    </>
  );
}

function ProductsRow({ title, loading, items, onAdd }) {
  const railRef = useRef(null);

  const scrollBy = (dir) => {
    const el = railRef.current;
    if (!el) return;
    const step = Math.min(el.clientWidth * 0.8, 560);
    el.scrollBy({ left: dir === "right" ? step : -step, behavior: "smooth" });
  };

  return (
    <div className="rowLight">
      <div className="rHead">
        <div className="rTitle">{title}</div>
        <div className="rCtrl">
          <button
            className="rArrow"
            onClick={() => scrollBy("left")}
            aria-label="ก่อนหน้า"
          >
            ‹
          </button>
          <button
            className="rArrow"
            onClick={() => scrollBy("right")}
            aria-label="ถัดไป"
          >
            ›
          </button>
        </div>
      </div>

      <div className="rRail" ref={railRef}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="rCard skeleton" />
          ))
        ) : items.length ? (
          items.map((p) => (
            <article
              key={p.id || `item-${p.name}`}
              className="rCard"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* ✅ ปรับ layout แบบมืออาชีพ */}
              <div
                className="rThumb"
                style={{
                  width: "100%",
                  height: "230px",
                  borderRadius: 14,
                  overflow: "hidden",
                  background: "#f6f7f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "10px",
                }}
              >
                {p.on_sale ? <span className="rBadge">SALE</span> : null}
                <img
                  src={p.img}
                  alt={p.name}
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                    borderRadius: 14,
                  }}
                />
              </div>

              <div style={{ padding: "0 4px 8px" }}>
                <h3
                  className="rName"
                  title={p.name}
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    textAlign: "center",
                    color: "#222",
                  }}
                >
                  {p.name}
                </h3>
                <div
                  className="rPrice"
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    textAlign: "center",
                    marginBottom: 8,
                    color: "#00994d",
                  }}
                >
                  ฿{Number(p.price).toFixed(2)}
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <button
                    className="rAdd"
                    onClick={() => onAdd(p)}
                    style={{
                      width: "85%",
                      borderRadius: 10,
                      padding: "8px 0",
                      fontWeight: 600,
                      background: "#00c04b",
                    }}
                  >
                    เพิ่มลงตะกร้า
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rEmpty">ยังไม่มีสินค้าตามเงื่อนไข</div>
        )}
      </div>
    </div>
  );
}
