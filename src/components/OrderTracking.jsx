// Premium + Tooltips (CSS only)
// ใช้ร่วมกับ OrderTracking.css (premium) เวอร์ชันก่อนหน้าได้เลย
import "./OrderTracking.css";

export const ORDER_STEPS = [
  { key: "placed",     label: "ได้รับออเดอร์" },
  { key: "processing", label: "กำลังแพ็กของ" },
  { key: "shipping",   label: "กำลังจัดส่ง" },
  { key: "delivered",  label: "ถึงปลายทาง" },
];

/**
 * props:
 *  - status: 'placed' | 'processing' | 'shipping' | 'delivered'
 *  - etaText?: string
 *  - history?: Record<stepKey, string|Date>   // เวลาเปลี่ยนสถานะของแต่ละ step (optional)
 *     ตัวอย่าง:
 *       {
 *         placed: "2025-10-01T07:57:49Z",
 *         processing: "2025-10-01T09:30:00+07:00",
 *         shipping: null,
 *         delivered: null
 *       }
 */
export default function OrderTracking({ status = "placed", etaText, history = {} }) {
  const idx = Math.max(0, ORDER_STEPS.findIndex(s => s.key === status));
  const percent = (idx / (ORDER_STEPS.length - 1)) * 100;

  const fmt = (v) => {
    if (!v) return null;
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    return d.toLocaleString(); // ใช้ locale ของเบราว์เซอร์
  };

  return (
    <div className="ot ot--premium" role="group" aria-label="สถานะการจัดส่ง">
      <div className="ot__card">
        <div className="ot__track">
          {/* เส้นพื้นหลัง */}
          <div className="ot__rail" />
          {/* เส้นความคืบหน้า + แสงวิ่ง */}
          <div className="ot__progress" style={{ width: `${percent}%` }}>
            <span className="ot__shine" />
          </div>
          {/* รถ SVG */}
          <div className="ot__truck" style={{ left: `calc(${percent}% - 16px)` }} aria-hidden>
            <svg width="32" height="22" viewBox="0 0 64 44" fill="none">
              <rect x="2" y="10" width="36" height="18" rx="4" fill="#111827"/>
              <rect x="38" y="14" width="18" height="14" rx="4" fill="#111827"/>
              <rect x="42" y="16" width="10" height="6" rx="2" fill="#f3f4f6"/>
              <circle cx="14" cy="32" r="6" fill="#0ea5e9"/>
              <circle cx="50" cy="32" r="6" fill="#0ea5e9"/>
              <circle cx="14" cy="32" r="3" fill="#fff"/>
              <circle cx="50" cy="32" r="3" fill="#fff"/>
            </svg>
          </div>

          {/* จุดสถานะ + tooltip เวลา */}
          {ORDER_STEPS.map((s, i) => {
            const reached = i <= idx;
            const current = i === idx;
            const when = fmt(history?.[s.key]);
            return (
              <div className="ot__step" key={s.key} aria-current={current ? "step" : undefined}>
                <div className={`ot__dot ${reached ? "is-on" : ""} ${current ? "is-current" : ""}`}>
                  {reached && !current ? "✓" : i + 1}
                </div>
                <div className={`ot__label ${reached ? "is-on" : ""}`}>{s.label}</div>

                {/* Tooltip – แสดงเฉพาะเมื่อมีเวลาบันทึก */}
                {when && (
                  <div className="ot__tip" role="tooltip">
                    <div className="ot__tip-title">{s.label}</div>
                    <div className="ot__tip-time">อัปเดตเมื่อ: <b>{when}</b></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {etaText && (
          <div className="ot__eta" aria-live="polite">
            ประมาณการส่งถึง: <b>{etaText}</b>
          </div>
        )}
      </div>
    </div>
  );
}
