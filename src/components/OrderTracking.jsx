import "./OrderTracking.css";

export const ORDER_STEPS = [
  { key: "placed", label: "ได้รับออเดอร์" },
  { key: "processing", label: "กำลังแพ็กของ" },
  { key: "shipping", label: "กำลังจัดส่ง" },
  { key: "delivered", label: "ถึงปลายทาง" },
];

export default function OrderTracking({ status = "placed", etaText, history = {} }) {
  const idx = Math.max(0, ORDER_STEPS.findIndex((s) => s.key === status));
  const percent = (idx / (ORDER_STEPS.length - 1)) * 100;

  const fmt = (v) => {
    if (!v) return null;
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    return d.toLocaleString();
  };

  return (
    <div className="ot ot--premium" role="group" aria-label="สถานะการจัดส่ง">
      <div className="ot__card">
        <div className="ot__track">
          {/* เส้นพื้นหลัง */}
          <div className="ot__rail" />
          {/* แถบความคืบหน้า */}
          <div className="ot__progress" style={{ width: `${percent}%` }}>
            <span className="ot__shine" />
          </div>

          {/* 🚚 รถเวอร์ชันการ์ตูนน่ารัก */}
          <div
            className="ot__truck"
            style={{ left: `calc(${percent}% - 22px)` }}
            aria-hidden
          >
            <svg
              width="42"
              height="26"
              viewBox="0 0 64 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* ตัวถัง (เหลืองทอง) */}
              <rect x="2" y="12" width="38" height="16" rx="4" fill="#facc15" />
              {/* ตู้บรรทุกหลัง (น้ำเงินพาสเทล) */}
              <rect x="38" y="14" width="20" height="13" rx="3" fill="#60a5fa" />
              {/* หน้าต่าง (ฟ้าสดใส) */}
              <rect x="43" y="15" width="9" height="6" rx="1.5" fill="#bae6fd" />
              {/* ไฟหน้า */}
              <circle cx="59" cy="20.5" r="2.2" fill="#fde68a" />
              {/* กันชน */}
              <rect x="0" y="26" width="40" height="2" fill="#d4d4d8" />
              {/* ล้อ (ดำขอบขาว) */}
              <circle cx="14" cy="31.5" r="5.5" fill="#1e293b" />
              <circle cx="50" cy="31.5" r="5.5" fill="#1e293b" />
              <circle cx="14" cy="31.5" r="3" fill="#fff" />
              <circle cx="50" cy="31.5" r="3" fill="#fff" />
              {/* เงาใต้รถ */}
              <ellipse cx="32" cy="38" rx="18" ry="2.8" fill="rgba(0,0,0,0.15)" />
            </svg>
          </div>

          {/* จุดสถานะ */}
          {ORDER_STEPS.map((s, i) => {
            const reached = i <= idx;
            const current = i === idx;
            const when = fmt(history?.[s.key]);
            return (
              <div
                className="ot__step"
                key={s.key}
                aria-current={current ? "step" : undefined}
              >
                <div
                  className={`ot__dot ${reached ? "is-on" : ""} ${
                    current ? "is-current" : ""
                  }`}
                >
                  {reached && !current ? "✓" : i + 1}
                </div>
                <div className={`ot__label ${reached ? "is-on" : ""}`}>
                  {s.label}
                </div>

                {when && (
                  <div className="ot__tip" role="tooltip">
                    <div className="ot__tip-title">{s.label}</div>
                    <div className="ot__tip-time">
                      อัปเดตเมื่อ: <b>{when}</b>
                    </div>
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
