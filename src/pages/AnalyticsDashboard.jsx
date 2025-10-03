import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
  Tooltip, Legend, Filler, Title
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import "./AnalyticsDashboard.css";

// ลงทะเบียน Chart.js
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
  Tooltip, Legend, Filler, Title
);

/** -------------------------------
 *  🔧 Mock API (เหมือนไฟล์เดิมของคุณ)
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

      resolve({ trend, kpis, byCategory, channels, topProducts, updatedAt: today.toISOString() });
    }, 900);
  });
}

const COLORS = ["#38bdf8","#a78bfa","#22c55e","#f59e0b","#ef4444"];
const fmtMoney = (n=0) => {
  try { return n.toLocaleString("en-US",{ style:"currency", currency:"USD" }); }
  catch { return `$${Number(n).toFixed(2)}`; }
};

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

  // ====== Chart.js datasets/options ======
  const lineData = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.trend.map(d => d.month),
      datasets: [
        {
          type: "line",
          label: "Revenue",
          data: data.trend.map(d => d.revenue),
          borderColor: COLORS[0],
          backgroundColor: "rgba(56,189,248,0.18)",
          fill: true,
          tension: 0.35,
          yAxisID: "y1",
          pointRadius: 2,
          borderWidth: 2,
        },
        {
          type: "line",
          label: "Orders",
          data: data.trend.map(d => d.orders),
          borderColor: COLORS[1],
          backgroundColor: COLORS[1],
          fill: false,
          tension: 0.35,
          yAxisID: "y2",
          pointRadius: 2,
          borderWidth: 2,
        },
      ],
    };
  }, [data]);

  const lineOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { labels: { color: "#cbd5e1" } },
      tooltip: {
        callbacks: {
          label: (ctx) => ctx.dataset.label === "Revenue" ? fmtMoney(ctx.raw) : `${ctx.raw}`,
        }
      }
    },
    scales: {
      x: { ticks: { color: "#cbd5e1" }, grid: { color: "#394150" } },
      y1:{ position:"left", ticks:{ color:"#cbd5e1", callback:(v)=>`${Math.round(v/1000)}k`}, grid:{ color:"#394150" } },
      y2:{ position:"right", ticks:{ color:"#cbd5e1" }, grid:{ drawOnChartArea:false } },
    }
  }), []);

  const barData = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.byCategory.map(d => d.name),
      datasets: [{
        label: "Sales",
        data: data.byCategory.map(d => d.value),
        backgroundColor: "rgba(56,189,248,0.6)",
        borderColor: COLORS[0],
        borderWidth: 1,
        borderRadius: 10,
      }]
    };
  }, [data]);

  const barOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { color: "#cbd5e1" }, grid: { color: "#394150" } },
      y: { ticks: { color: "#cbd5e1", callback:(v)=>`${Math.round(v/1000)}k` }, grid: { color: "#394150" } },
    },
    plugins: { legend: { labels: { color: "#cbd5e1" } } }
  }), []);

  const pieData = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.channels.map(d => d.name),
      datasets: [{
        data: data.channels.map(d => d.value),
        backgroundColor: COLORS,
        borderColor: "#0b1220",
        borderWidth: 2,
      }]
    };
  }, [data]);

  const pieOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: "#cbd5e1" } } }
  }), []);

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
        <div className="dash__error">{error}</div>
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
                {lineData && <Line data={lineData} options={lineOptions} />}
              </div>
            </article>

            <article className="card">
              <h3>Sales by Category</h3>
              <div className="chart">
                {barData && <Bar data={barData} options={barOptions} />}
              </div>
            </article>
          </section>

          {/* Charts row 2 */}
          <section className="row">
            <article className="card">
              <h3>Channel Mix</h3>
              <div className="chart">
                {pieData && <Doughnut data={pieData} options={pieOptions} />}
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
