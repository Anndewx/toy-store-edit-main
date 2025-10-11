// AIFloatingRecommender.jsx
// Strict filter: sale เฉพาะลดจริง, anime/gundam/superhero/game ใช้ category_slug เท่านั้น (ไม่ปนหมวด)

import { useEffect, useMemo, useRef, useState, useTransition, memo } from "react";
import { useCart } from "../context/CartContext";
import { fetchProducts, fetchRecommend } from "../lib/api";

const API_BASE = import.meta.env.VITE_API_BASE || "";

/* ---------- helpers เดิม + เพิ่ม predicate ที่เข้มงวด ---------- */
const Behavior = {
  get() { try { return JSON.parse(localStorage.getItem("ai_behavior") || "{}"); } catch { return {}; } },
  set(d) { localStorage.setItem("ai_behavior", JSON.stringify(d)); },
  viewed(p) { const b = this.get(); b.viewed = Array.from(new Set([...(b.viewed||[]), p.product_id])); this.set(b); },
  cart(p) { const b = this.get(); b.cart = [...(b.cart||[]), p.product_id]; this.set(b); }
};

const norm = (s="") => s.toString().toLowerCase().normalize("NFKC").trim();
const classNames = (...xs)=> xs.filter(Boolean).join(" ");
function productImage(p){
  const img = p.image_url || p.image || "";
  if (!img) return "https://picsum.photos/seed/placeholder/240/240";
  if (/^https?:/i.test(img)) return img;
  const path = img.startsWith("/") ? img : `/${img}`;
  return `${API_BASE}${path}`;
}

/* ✅ เข้มงวดเรื่องลดราคา */
const ON_SALE_VALUES = new Set([1, "1", true, "true", "TRUE"]);
function isOnSale(p){
  const flag = ON_SALE_VALUES.has(p?.on_sale);
  const byPrice = Number(p?.sale_price) > 0 && Number(p?.sale_price) < Number(p?.price);
  return !!(flag || byPrice);
}

/* ✅ กรองหมวดแบบ “slug เท่านั้น” ไม่อิงชื่อสินค้า */
function catOf(p){ return norm(p?.category_slug || ""); }
function isCat(p, key){
  const c = catOf(p);
  // รองรับรูปแบบ slug หลายชั้น เช่น figure/anime, toy/gundam ฯลฯ
  const has = (slug)=> new RegExp(`(^|/|\\b)${slug}(\\b|/|$)`).test(c);
  switch(key){
    case "anime":     return has("anime");
    case "gundam":    return has("gundam");
    case "superhero": return has("superhero");
    case "game":      return has("game");
    default:          return false;
  }
}

/* ---------- UI ชิ้นส่วน (คงเดิม) ---------- */
const SkeletonCard = memo(function SkeletonCard() {
  return (
    <div className="ai-card ai-skel">
      <div className="ai-thumb-wrap"><div className="ai-skel-thumb"/></div>
      <div className="ai-info">
        <div className="ai-skel-line" style={{width:180}}/>
        <div className="ai-skel-line" style={{width:120}}/>
      </div>
      <div className="ai-cta">
        <div className="ai-skel-pill" />
        <div className="ai-skel-btn" />
      </div>
    </div>
  );
});

const TOPICS = [
  { key:"foryou",    label:"สำหรับคุณ" },
  { key:"trending",  label:"มาแรง" },
  { key:"sale",      label:"ราคาพิเศษ" },
  { key:"new",       label:"มาใหม่" },
  { key:"anime",     label:"อนิเมะ" },
  { key:"gundam",    label:"กันดั้ม" },
  { key:"superhero", label:"ซูเปอร์ฮีโร่" },
  { key:"game",      label:"เกม" },
];

const ProductCard = memo(function ProductCard({ p, onAdd }){
  return (
    <article className="ai-card" tabIndex={0}>
      <div className="ai-thumb-wrap">
        {isOnSale(p) ? <span className="ai-badge">SALE</span> : null}
        <img alt={p.name} src={productImage(p)} className="ai-thumb" loading="lazy" />
      </div>
      <div className="ai-info">
        <h3 className="ai-name" title={p.name}>{p.name}</h3>
        <div className="ai-meta">
          <span className="ai-cat">{p.category_slug || "other"}</span>
        </div>
      </div>
      <div className="ai-cta">
        <div className="ai-price">฿{Number(p.price).toFixed(2)}</div>
        <button className="ai-add" onClick={()=>onAdd(p)}>เพิ่มลงตะกร้า</button>
      </div>
    </article>
  );
});

/* ---------- คอมโพเนนต์หลัก (เน้นส่วนกรองที่เปลี่ยน) ---------- */
export default function AIFloatingRecommender(){
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [baseProducts, setBaseProducts] = useState([]);

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [mode, setMode] = useState("foryou");
  const [sortKey, setSortKey] = useState("ai");
  const [budgetMax, setBudgetMax] = useState(null);
  const [isPending, startTransition] = useTransition();

  const [visible, setVisible] = useState(12);
  const loadMoreRef = useRef(null);
  const panelRef = useRef(null);
  const searchRef = useRef(null);
  const { add: addToRealCart } = useCart();

  useEffect(() => { const t = setTimeout(() => setDebounced(query.trim()), 320); return () => clearTimeout(t); }, [query]);

  useEffect(()=>{
    if (!open || baseProducts.length) return;
    (async()=>{
      try{
        const data = await fetchProducts();
        setBaseProducts(Array.isArray(data) ? data : (data?.data || []));
      }catch(e){ console.error(e); }
    })();
  },[open, baseProducts.length]);

  useEffect(()=>{
    if (!open) return;
    let ignore = false, controller = new AbortController();
    (async()=>{
      setLoading(true); setVisible(12);
      try{
        const data = debounced
          ? await fetchRecommend({ q: debounced, limit: 36, signal: controller.signal })
          : await fetchProducts({ signal: controller.signal });
        if (!ignore){
          const arr = Array.isArray(data) ? data : (data?.data || []);
          setProducts(arr);
        }
      }catch(e){ /* ignore */ }
      setLoading(false);
    })();
    return ()=>{ ignore = true; controller.abort(); };
  },[debounced, open]);

  useEffect(()=>{ if (open) setTimeout(()=> searchRef.current?.focus(), 10); }, [open]);
  useEffect(()=>{
    function onDocClick(e){ if (open && panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); }
    function onKey(e){ if (!open) return; if (e.key==="Escape") setOpen(false); if (e.key==="Enter") setQuery(q=>q.trim()); }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return ()=>{ document.removeEventListener("mousedown", onDocClick); document.removeEventListener("keydown", onKey); };
  },[open]);

  /* ✅ คำนวณหัวข้อที่ “มีสินค้า” เพื่อซ่อนหัวข้อว่าง */
  const topicHasInventory = useMemo(()=>{
    const pool = baseProducts.length ? baseProducts : products;
    return {
      sale: pool.some(isOnSale),
      new:  pool.length>0,
      trending: pool.length>0,
      anime: pool.some(p => isCat(p,"anime")),
      gundam: pool.some(p => isCat(p,"gundam")),
      superhero: pool.some(p => isCat(p,"superhero")),
      game: pool.some(p => isCat(p,"game")),
    };
  },[baseProducts, products]);

  const topics = useMemo(()=> TOPICS.filter(t=> t.key==="foryou" || topicHasInventory[t.key]), [topicHasInventory]);

  /* ✅ ตัวกรอง “เข้มงวด” ตามที่ขอ */
  const finalList = useMemo(()=>{
    let pool = products.slice();

    // --- โหมดหลัก (strict) ---
    switch(mode){
      case "sale":      pool = pool.filter(isOnSale); break;
      case "anime":     pool = pool.filter(p => isCat(p,"anime")   && !isCat(p,"gundam")); break; // กันไม่ให้กั้นดั้มปน
      case "gundam":    pool = pool.filter(p => isCat(p,"gundam")); break;
      case "superhero": pool = pool.filter(p => isCat(p,"superhero")); break;
      case "game":      pool = pool.filter(p => isCat(p,"game")); break;
      case "new":       pool = [...pool].sort((a,b)=> Number(b.product_id||0) - Number(a.product_id||0)); break;
      case "trending":  pool = [...pool].sort((a,b)=> (isOnSale(b)?1:0)-(isOnSale(a)?1:0) || Number(a.price)-Number(b.price)); break;
      default: break; // foryou → ไม่กรองหมวด
    }

    // --- งบประมาณเร็ว ---
    if (budgetMax != null) pool = pool.filter(p => Number(p.price) <= budgetMax);

    // --- จัดเรียงเพิ่มเติม ---
    const sorters = {
      ai: (a,b)=> (isOnSale(b)?1:0) - (isOnSale(a)?1:0) || Number(a.price)-Number(b.price),
      "price-asc": (a,b)=> Number(a.price) - Number(b.price),
      "price-desc": (a,b)=> Number(b.price) - Number(a.price),
      "newest": (a,b)=> Number(b.product_id||0) - Number(a.product_id||0),
    };
    pool = [...pool].sort(sorters[sortKey] || sorters.ai);

    return pool;
  }, [products, mode, budgetMax, sortKey]);

  async function addToCart(product){
    try{
      await addToRealCart(product.product_id, 1);
      Behavior.cart(product);
      window.dispatchEvent(new Event("open-cart"));
    }catch(e){
      console.error("addToCart failed", e);
      alert("เพิ่มลงตะกร้าไม่สำเร็จ");
    }
  }

  return (
    <>
      <style>{styles}</style>
      {open && <div aria-hidden className="ai-overlay" onClick={()=>setOpen(false)} />}

      <button className="ai-fab" aria-label="ผู้ช่วยแนะนำสินค้า" onClick={()=>setOpen(v=>!v)} title="ผู้ช่วยแนะนำสินค้า (AI)">
        <span className="ai-fab-icon">🧠</span>
      </button>

      {open && (
        <section ref={panelRef} className="ai-panel" role="dialog" aria-label="ผู้ช่วยแนะนำสินค้า" aria-expanded={open} aria-live="polite">
          <header className="ai-header">
            <div className="ai-logo">AI</div>
            <div className="ai-title">
              <div className="ai-title-main">ผู้ช่วยแนะนำสินค้า</div>
              <div className="ai-title-sub">เลือกหัวข้อหรือพิมพ์ค้นหา แล้วกรองได้แบบเข้มงวด</div>
            </div>
            <button className="ai-x" onClick={()=>setOpen(false)}>✕</button>
          </header>

          <div className="ai-searchbar">
            <div className="ai-search-icon">🔎</div>
            <input
              ref={searchRef}
              value={query}
              onChange={(e)=> startTransition(()=> setQuery(e.target.value))}
              placeholder="พิมพ์ชื่อสินค้า (เช่น deadpool) หรือกดหัวข้อด้านล่าง"
              className="ai-input"
            />
            {query && <button className="ai-clear" onClick={()=>startTransition(()=>setQuery(""))} aria-label="ล้างคำค้น">⌫</button>}
            <button className="ai-primary" onClick={()=>startTransition(()=>setQuery(q=>q.trim()))}>แนะนำ</button>
          </div>

          <div className="ai-tabs" role="tablist">
            {topics.map(t=>(
              <button key={t.key} role="tab" aria-selected={mode===t.key}
                className={classNames("ai-tab", mode===t.key && "ai-tab--active")}
                onClick={()=> startTransition(()=> setMode(t.key))}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* แถบตัวกรองย่อ (งบ / จัดเรียง) */}
          <div className="ai-filterbar">
            <div className="ai-filter-group">
              <span className="ai-filter-label">งบเร็ว:</span>
              {[40,60,100].map(v=>(
                <button key={v}
                  className={classNames("ai-pill", budgetMax===v && "ai-pill--active")}
                  onClick={()=> startTransition(()=> setBudgetMax(budgetMax===v?null:v))}
                >≤ {v}</button>
              ))}
              <button className="ai-pill" onClick={()=> startTransition(()=> setBudgetMax(null))}>ล้างงบ</button>
            </div>
            <div className="ai-filter-group">
              <span className="ai-filter-label">จัดเรียง:</span>
              <select className="ai-select" value={sortKey} onChange={(e)=> startTransition(()=> setSortKey(e.target.value))}>
                <option value="ai">AI แนะนำ</option>
                <option value="price-asc">ราคาต่ำ → สูง</option>
                <option value="price-desc">ราคาสูง → ต่ำ</option>
                <option value="newest">มาใหม่ก่อน</option>
              </select>
            </div>
            {isPending && <div className="ai-pending">กำลังคำนวณ…</div>}
          </div>

          {/* รายการสินค้า */}
          <div className="ai-content">
            {loading
              ? Array.from({length:8}).map((_,i)=> <SkeletonCard key={i}/>)
              : <>
                  {finalList.slice(0, visible).map(p => <ProductCard key={p.product_id} p={p} onAdd={addToCart} />)}
                  {finalList.length>visible && <div ref={loadMoreRef} className="ai-loadmore">กำลังโหลดเพิ่มเติม…</div>}
                  {!finalList.length && (
                    <div className="ai-empty">
                      <div className="ai-empty-emoji">🔎</div>
                      <div className="ai-empty-title">ยังไม่พบสินค้าที่ตรงใจ</div>
                      <div className="ai-empty-sub">ลองเปลี่ยนหัวข้อหรือเพิ่มงบประมาณดูนะ</div>
                    </div>
                  )}
                </>
            }
          </div>
        </section>
      )}
    </>
  );
}

function buildQuery(q, tags){
  const t = (tags||[]).map(x=> x.startsWith("#")?x:`#${x}`).join(" ");
  return [q, t].filter(Boolean).join(" ").trim();
}

/* ============ Styles (เหมือนเวอร์ชันก่อน) ============ */
const styles = `
:root{
  --ai-bg: rgba(12, 19, 34, .78);
  --ai-surface: rgba(16, 24, 40, .85);
  --ai-border: rgba(255,255,255,.08);
  --ai-text: #E8EEFC;
  --ai-sub: #9db1d9;
  --ai-primary: #1f7cff;
  --ai-primary-2: #6aa6ff;
  --ai-green: #22c55e;
  --ai-muted: #0c1627;
}
.ai-overlay{ position:fixed; inset:0; background:rgba(4,10,20,.35); backdrop-filter: blur(2px); animation: fadeIn .18s ease-out; }
.ai-fab{
  position:fixed; left:20px; bottom:20px; width:58px; height:58px; border-radius:999px;
  border:none; cursor:pointer; z-index:9999; color:#fff;
  background: radial-gradient(120% 120% at 10% 10%, var(--ai-primary-2), var(--ai-primary));
  box-shadow: 0 14px 28px rgba(31,124,255,.38), 0 2px 8px rgba(0,0,0,.25);
  transition: transform .12s ease, box-shadow .12s ease, filter .12s ease;
}
.ai-fab:hover{ transform: translateY(-2px); filter: brightness(1.05); }
.ai-fab:active{ transform: translateY(0); filter: brightness(.98); }
.ai-fab-icon{ font-size:22px; font-weight:800; }

.ai-panel{
  position:fixed; left:20px; bottom:92px; width:min(560px,94vw); max-height:84vh;
  display:flex; flex-direction:column; overflow:hidden; z-index:10000;
  background: linear-gradient(180deg, #101827 0%, #0b1424 64%);
  border:1px solid var(--ai-border); border-radius:18px;
  box-shadow: 0 20px 48px rgba(0,0,0,.45);
  color: var(--ai-text); backdrop-filter: blur(10px);
  animation: slideUp .18s ease-out;
}
.ai-header{ display:flex; align-items:center; gap:12px; padding:12px 14px; border-bottom:1px solid var(--ai-border); }
.ai-logo{ width:30px; height:30px; border-radius:10px; font-weight:900; display:grid; place-items:center;
  background: linear-gradient(145deg, var(--ai-primary), var(--ai-primary-2)); color:#fff; letter-spacing:.5px; }
.ai-title-main{ font-size:15px; font-weight:800; }
.ai-title-sub{ font-size:12px; color:var(--ai-sub); }
.ai-x{ margin-left:auto; background:transparent; color:#b8c7e6; border:none; font-size:20px; cursor:pointer; padding:4px 6px; border-radius:8px; }
.ai-x:hover{ background: rgba(255,255,255,.06); }

.ai-searchbar{ display:flex; align-items:center; gap:8px; padding:10px 12px; border-bottom:1px solid var(--ai-border); background: rgba(8,14,26,.5); }
.ai-search-icon{ opacity:.8; }
.ai-input{ flex:1; border-radius:12px; background:#0b1424; border:1px solid var(--ai-border); color:var(--ai-text); padding:10px 12px; outline:none; }
.ai-input:focus{ border-color:#2a64ff; box-shadow: 0 0 0 2px rgba(42,100,255,.25); }
.ai-clear{ background:transparent; color:#9fb1d5; border:1px solid var(--ai-border); border-radius:10px; padding:6px 8px; cursor:pointer; }
.ai-primary{ background: var(--ai-primary); color:white; border:none; border-radius:12px; padding:10px 14px; font-weight:800; cursor:pointer; transition: filter .12s ease, transform .12s ease; }
.ai-primary:hover{ filter:brightness(1.05); transform: translateY(-1px); }

.ai-tabs{ display:flex; gap:8px; padding:10px 12px; border-bottom:1px solid var(--ai-border); flex-wrap:wrap; background: rgba(8,14,26,.35); }
.ai-tab{ padding:8px 12px; border-radius:999px; border:1px solid var(--ai-border); background:#0c1627; color:#dbe7ff; font-size:12px; cursor:pointer; transition: transform .08s ease, background .12s ease; }
.ai-tab:hover{ transform: translateY(-1px); background:#0e1a31; }
.ai-tab--active{ background:#142a55; border-color:#2a64ff; box-shadow: 0 0 0 2px rgba(42,100,255,.18) inset; }

.ai-chips{ display:flex; gap:8px; flex-wrap:wrap; padding:10px 12px; border-bottom:1px solid var(--ai-border); }
.ai-chip{ padding:8px 10px; border-radius:999px; border:1px solid var(--ai-border); background:#0c1627; color:#dbe7ff; font-size:12px; cursor:pointer; transition: transform .08s ease, background .12s ease; }
.ai-chip:hover{ transform: translateY(-1px); background:#0e1a31; }
.ai-chip--active{ background:#13274e; border-color:#274aa8; }

.ai-filterbar{ display:flex; justify-content:space-between; align-items:center; gap:8px; padding:8px 12px; border-bottom:1px solid var(--ai-border); background:rgba(8,14,26,.3); flex-wrap:wrap; }
.ai-filter-group{ display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.ai-filter-label{ color:#b7c7e8; font-size:12px; }
.ai-pill{ padding:6px 10px; font-size:12px; border-radius:999px; border:1px solid var(--ai-border); background:var(--ai-muted); color:#dbe7ff; cursor:pointer; }
.ai-pill--active{ background:#13274e; border-color:#2a64ff; }
.ai-select{ background:#0b1424; color:#dbe7ff; border:1px solid var(--ai-border); border-radius:10px; padding:6px 8px; }
.ai-pending{ font-size:12px; color:#9db1d9; }

.ai-content{ padding:12px; overflow:auto; max-height: calc(84vh - 268px); display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap:12px; }
.ai-content::-webkit-scrollbar{ width:10px; }
.ai-content::-webkit-scrollbar-thumb{ background:rgba(255,255,255,.09); border-radius:8px; }

.ai-card{ display:grid; grid-template-columns: 92px 1fr auto; gap:12px; align-items:center; padding:12px; border-radius:14px; background:#0f1625; border:1px solid var(--ai-border); transition: transform .08s ease, border-color .12s ease, background .12s ease; will-change: transform; }
.ai-card:hover{ transform: translateY(-1px); background:#101a2f; }
.ai-thumb{ width:92px; height:92px; object-fit:cover; border-radius:12px; display:block; box-shadow: 0 4px 10px rgba(0,0,0,.25); }
.ai-badge{ position:absolute; top:6px; left:6px; font-size:10px; font-weight:900; background:#1ee3a2; color:#052119; border-radius:999px; padding:2px 6px; box-shadow:0 1px 6px rgba(0,0,0,.25); }
.ai-info{ min-width:0; }
.ai-name{ font-size:14px; font-weight:800; margin:0 0 6px 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ai-meta{ font-size:12px; color:var(--ai-sub); display:flex; gap:8px; flex-wrap:wrap; }
.ai-cat{ padding:2px 8px; border:1px solid var(--ai-border); border-radius:999px; background:#0c1627; }
.ai-cta{ text-align:right; display:grid; gap:8px; align-content:center; }
.ai-price{ font-weight:900; font-size:15px; }
.ai-add{ background:var(--ai-green); color:#04110a; border:none; border-radius:10px; padding:8px 10px; font-weight:900; cursor:pointer; transition: transform .08s ease, filter .12s ease; }
.ai-add:hover{ transform: translateY(-1px); filter:brightness(1.03); }

.ai-empty{ grid-column: 1/-1; text-align:center; color:var(--ai-sub); padding:24px 8px; }
.ai-empty-emoji{ font-size:28px; }
.ai-empty-title{ font-weight:800; margin-top:6px; color:var(--ai-text); }
.ai-empty-sub{ font-size:12px; margin-top:2px; }
.ai-loadmore{ grid-column: 1/-1; text-align:center; padding:12px; color:#9db1d9; }

.ai-skel .ai-skel-thumb{ width:92px; height:92px; border-radius:12px; background:rgba(255,255,255,.06); }
.ai-skel .ai-skel-line{ height:10px; border-radius:6px; background:rgba(255,255,255,.06); margin:6px 0; }
.ai-skel .ai-skel-pill{ width:70px; height:18px; border-radius:999px; background:rgba(255,255,255,.06); }
.ai-skel .ai-skel-btn{ width:110px; height:34px; border-radius:10px; background:rgba(255,255,255,.06); }

@keyframes slideUp { from{ transform: translateY(8px); opacity:0 } to { transform: translateY(0); opacity:1 } }
@keyframes fadeIn  { from{ opacity:0 } to { opacity:1 } }
`;
