import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart, Area,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend
} from "recharts";
import "./AnalyticsDashboard.css";

/** -------------------------------
 *  🔧 Mock API: จำลองดึงข้อมูล
 *  (ภายหลังสลับเป็น fetch('/api/...') ได้เลย)
 *-------------------------------- */
function fakeFetch() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const today = new Date();
      const months = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

      const trend = Array.from({ length: 12 }).map((_, idx) => {
        const base = 12000 + Math.random()*15000;
        const orders = 60 + Math.round(Math.random()*90);
        const conv = +(Math.random()*2.2 + 1.2).toFixed(2);
        return {
          month: months[idx],
          revenue: Math.round(base),
          orders,
          aov: +(base/orders).toFixed(2),
          conversion: conv,
        };
      });

      const kpis = {
        revenue: trend.reduce((s,i)=> s+i.revenue, 0),
        orders: trend.reduce((s,i)=> s+i.orders, 0),
        aov: +(trend.reduce((s,i)=> s+i.revenue,0)/trend.reduce((s,i)=> s+i.orders,0)).toFixed(2),
        conversion: +(
          trend.reduce((s,i)=> s+i.conversion,0)/trend.length
        ).toFixed(2),
        growth: +((trend.at(-1).revenue - trend.at(-2).revenue) / trend.at(-2).revenue * 100).toFixed(1),
      };

      const byCategory = [
        { name: "Gundam", value: 42000 + Math.random()*5000 },
        { name: "Superhero", value: 26500 + Math.random()*4000 },
        { name: "Anime", value: 33800 + Math.random()*4500 },
        { name: "Game", value: 30100 + Math.random()*3500 },
      ].map(x => ({ ...x, value: Math.round(x.value) }));

      const channels = [
        { name: "Search", value: 46 },
        { name: "Social", value: 27 },
        { name: "Direct", value: 17 },
        { name: "Referral", value: 10 },
      ];

      const topProducts = [
        { sku:"MG-EXIA", name:"MG 1/100 GUNDAM EXIA", price: 61.36, sold: 212, stock: 8 },
        { sku:"MSN-SAZABI", name:"MSN-04 Sazabi", price: 70.61, sold: 189, stock: 5 },
        { sku:"AST-RED", name:"Gundam Astray Red Frame", price: 53.96, sold: 173, stock: 7 },
        { sku:"B-GROOT", name:"Baby Groot", price: 39.78, sold: 160, stock: 8 },
      ];

      resolve({
        trend,
        kpis,
        byCategory,
        channels,
        topProducts,
        updatedAt: today.toISOString()
      });
    }, 1200); // จำลองโหลด ~1.2s
  });
}

const COLORS = ["#38bdf8","#a78bfa","#22c55e","#f59e0b","#ef4444"];

function fmtMoney(n=0) {
  try { return n.toLocaleString("en-US",{ style:"currency", currency:"USD" }); }
  catch { return `$${Number(n).toFixed(2)}`; }
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData]     = useState(null);
  const [error, setError]   = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fakeFetch();
        if (!alive) return;
        setData(res);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError("ไม่สามารถโหลดข้อมูลได้");
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const lastMonth = useMemo(() => data?.trend?.at(-1) ?? null, [data]);
  const updatedText = useMemo(() => data?.updatedAt ? new Date(data.updatedAt).toLocaleString() : "-", [data]);

  return (
    <div className="dash">
      {/* Header */}
      <header className="dash__head">
        <div>
          <h1>Sales Analytics</h1>
          <p>ภาพรวมประสิทธิภาพการขายของร้านคุณแบบเรียลไทม์</p>
        </div>
        <div className="dash__updated">อัปเดตล่าสุด: {updatedText}</div>
      </header>

      {/* Loading */}
      {loading && (
        <section className="dash__loading">
          <div className="spinner" />
          <div className="skeleton kpi" />
          <div className="skeleton chart" />
          <div className="skeleton chart" />
          <div className="skeleton table" />
        </section>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="dash__error">
          {error}
        </div>
      )}

      {/* Content */}
      {!loading && !error && data && (
        <>
          {/* KPIs */}
          <section className="kpis">
            <Kpi title="ยอดขายรวม (YTD)" value={fmtMoney(data.kpis.revenue)} sub={data.kpis.growth >= 0 ? `+${data.kpis.growth}% vs last mo.` : `${data.kpis.growth}% vs last mo.`} trend={data.kpis.growth >= 0 ? "up":"down"} />
            <Kpi title="คำสั่งซื้อ" value={data.kpis.orders.toLocaleString()} sub={`AOV: ${fmtMoney(data.kpis.aov)}`} />
            <Kpi title="Conversion Rate" value={`${data.kpis.conversion}%`} sub={`เดือนล่าสุด: ${lastMonth?.conversion ?? "-" }%`} />
            <Kpi title="ยอดขายเดือนล่าสุด" value={fmtMoney(lastMonth?.revenue || 0)} sub={`${lastMonth?.orders || 0} orders`} />
          </section>

          {/* Charts row 1 */}
          <section className="row">
            <article className="card">
              <h3>Revenue & Orders (12M)</h3>
              <div className="chart">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedTrend data={data.trend} />
                </ResponsiveContainer>
              </div>
            </article>

            <article className="card">
              <h3>Sales by Category</h3>
              <div className="chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#394150" />
                    <XAxis dataKey="name" stroke="#cbd5e1" />
                    <YAxis stroke="#cbd5e1" tickFormatter={(v)=> (v/1000)+"k"} />
                    <Tooltip formatter={(v)=>fmtMoney(v)} contentStyle={{ background:"#0b1220", border:"1px solid #1f2937", borderRadius:10, color:"#e5e7eb" }} />
                    <Legend />
                    <Bar dataKey="value" radius={[10,10,0,0]} fill={COLORS[0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          {/* Charts row 2 */}
          <section className="row">
            <article className="card">
              <h3>Channel Mix</h3>
              <div className="chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={{ background:"#0b1220", border:"1px solid #1f2937", borderRadius:10, color:"#e5e7eb" }} />
                    <Legend />
                    <Pie data={data.channels} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                      {data.channels.map((_, i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="card">
              <h3>Top Products</h3>
              <div className="table">
                <div className="thead">
                  <span>สินค้า</span>
                  <span>ราคา</span>
                  <span>ขายแล้ว</span>
                  <span>คงเหลือ</span>
                </div>
                {data.topProducts.map((p) => (
                  <div key={p.sku} className="trow">
                    <span className="pname">
                      <span className="pill">{p.sku}</span> {p.name}
                    </span>
                    <span>{fmtMoney(p.price)}</span>
                    <span>{p.sold.toLocaleString()}</span>
                    <span className={p.stock<=5 ? "danger":""}>{p.stock}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </>
      )}
    </div>
  );
}

/* ---------- Components ---------- */
function Kpi({ title, value, sub, trend }) {
  return (
    <div className="kpi">
      <div className="kpi__title">{title}</div>
      <div className="kpi__value">{value}</div>
      {sub && (
        <div className={`kpi__sub ${trend === "up" ? "up":"down"}`}>
          {trend === "up" ? "▲ " : trend === "down" ? "▼ " : ""}{sub}
        </div>
      )}
    </div>
  );
}

function ComposedTrend({ data }) {
  return (
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#394150" />
      <XAxis dataKey="month" stroke="#cbd5e1" />
      <YAxis yAxisId="left" stroke="#cbd5e1" tickFormatter={(v)=> (v/1000)+"k"} />
      <YAxis yAxisId="right" orientation="right" stroke="#cbd5e1" />
      <Tooltip
        contentStyle={{ background:"#0b1220", border:"1px solid #1f2937", borderRadius:10, color:"#e5e7eb" }}
        formatter={(v, name) => name === "revenue" ? fmtMoney(v) : v}
      />
      <Legend />
      <Area
        yAxisId="left"
        type="monotone"
        dataKey="revenue"
        stroke="#38bdf8"
        fill="url(#revGrad)"
        strokeWidth={2}
        dot={{ r: 2 }}
        isAnimationActive={false}
        activeDot={{ r: 4 }}
      />
      <Line
        yAxisId="right"
        type="monotone"
        dataKey="orders"
        stroke="#a78bfa"
        strokeWidth={2}
        dot={{ r: 1.8 }}
        isAnimationActive={false}
      />

      {/* Gradient for Area */}
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.45}/>
          <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.05}/>
        </linearGradient>
      </defs>
    </LineChart>
  );
}
