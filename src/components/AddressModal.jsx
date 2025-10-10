import React, { useEffect, useMemo, useRef, useState } from "react";
import "./AddressModal.css";

export default function AddressModal({
  open = false,
  onClose,
  onSubmit,
  initialValue = {},
}) {
  const overlayRef = useRef(null);
  const [data, setData] = useState({
    name: initialValue.name || "",
    phone: initialValue.phone || "",
    line1: initialValue.line1 || "",
    street: initialValue.street || "",
    subdistrict: initialValue.subdistrict || "",
    district: initialValue.district || "",
    province: initialValue.province || "",
    postcode: initialValue.postcode || "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setData({
      name: initialValue.name || "",
      phone: initialValue.phone || "",
      line1: initialValue.line1 || "",
      street: initialValue.street || "",
      subdistrict: initialValue.subdistrict || "",
      district: initialValue.district || "",
      province: initialValue.province || "",
      postcode: initialValue.postcode || "",
    });
  }, [initialValue, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const clickOverlay = (e) => {
    if (e.target === overlayRef.current) onClose?.();
  };

  const canSubmit = useMemo(() => {
    return (
      data.name.trim() &&
      data.phone.trim() &&
      data.line1.trim() &&
      data.subdistrict.trim() &&
      data.district.trim() &&
      data.province.trim() &&
      String(data.postcode || "").trim()
    );
  }, [data]);

  const handleChange = (key) => (e) => {
    setData((s) => ({ ...s, [key]: e.target.value }));
  };

  async function submit() {
    if (!canSubmit || submitting) return;
    try {
      setSubmitting(true);
      await onSubmit?.(data);
      onClose?.();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="am__overlay" ref={overlayRef} onMouseDown={clickOverlay}>
      <section
        className="am"
        role="dialog"
        aria-modal="true"
        aria-label="เพิ่มที่อยู่จัดส่ง"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="am__header">
          <h3 className="am__title">📦 เพิ่มที่อยู่จัดส่ง</h3>
          <button className="am__x" onClick={onClose} aria-label="ปิด">✕</button>
        </header>

        <div className="am__body">
          <div className="am__grid am__grid--2">
            <div className="am__field">
              <label className="am__label">ชื่อ-นามสกุล</label>
              <input
                className="am__input"
                value={data.name}
                onChange={handleChange("name")}
                placeholder="เช่น อัครพนธ์ ใจดี"
              />
            </div>
            <div className="am__field">
              <label className="am__label">เบอร์โทร</label>
              <input
                className="am__input"
                value={data.phone}
                onChange={handleChange("phone")}
                placeholder="เช่น 0812345678"
              />
            </div>
          </div>

          <div className="am__field">
            <label className="am__label">ที่อยู่ (บ้านเลขที่ / อาคาร)</label>
            <input
              className="am__input"
              value={data.line1}
              onChange={handleChange("line1")}
              placeholder="เลขที่ / อาคาร / หมู่บ้าน / ชั้น / ห้อง"
            />
          </div>

          <div className="am__field">
            <label className="am__label">ถนน / ซอย</label>
            <input
              className="am__input"
              value={data.street}
              onChange={handleChange("street")}
              placeholder="เช่น ถนนพหลโยธิน ซอย 15"
            />
          </div>

          <div className="am__grid am__grid--3">
            <div className="am__field">
              <label className="am__label">ตำบล / แขวง</label>
              <input
                className="am__input"
                value={data.subdistrict}
                onChange={handleChange("subdistrict")}
              />
            </div>
            <div className="am__field">
              <label className="am__label">อำเภอ / เขต</label>
              <input
                className="am__input"
                value={data.district}
                onChange={handleChange("district")}
              />
            </div>
            <div className="am__field">
              <label className="am__label">จังหวัด</label>
              <input
                className="am__input"
                value={data.province}
                onChange={handleChange("province")}
              />
            </div>
          </div>

          <div className="am__field am__field--sm">
            <label className="am__label">รหัสไปรษณีย์</label>
            <input
              className="am__input"
              value={data.postcode}
              onChange={handleChange("postcode")}
              placeholder="เช่น 13000"
              inputMode="numeric"
            />
          </div>
        </div>

        <footer className="am__footer">
          <button className="am__btn am__btn--ghost" onClick={onClose}>
            ❌ ยกเลิก
          </button>
          <button
            className="am__btn am__btn--primary"
            onClick={submit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? "กำลังบันทึก..." : "✅ เพิ่มที่อยู่"}
          </button>
        </footer>
      </section>
    </div>
  );
}
