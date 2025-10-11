// src/pages/CheckoutPage.jsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createOrder } from "../lib/api";
import "./CheckoutPage.css";

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();

  const [processing, setProcessing] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("bank"); // bank | cod | other

  // ───────── payload แต่ละวิธี ─────────
  const [bank, setBank] = useState({ bankName: "", last4: "", paidAt: "", slip: null });
  const [cod, setCod] = useState({ receiver: "", phone: "", note: "" });
  const [other, setOther] = useState({ ref: "", paidAt: "", slip: null });

  const openPayModal = () => {
    if (!items?.length || processing) return;
    setShowPayModal(true);
  };
  const payloadOf = () =>
    paymentMethod === "bank" ? bank : paymentMethod === "cod" ? cod : other;

  // ===== Helper numbers =====
  const num = (v) => {
    if (v === undefined || v === null) return 0;
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  // ✅ รวมยอดแบบกันพลาด: ใช้ total จาก context ถ้ามี; ไม่งั้นรวมจาก items
  const computedTotal = useMemo(() => {
    const ctx = num(total);
    if (ctx > 0) return ctx;

    const list = Array.isArray(items) ? items : [];
    return list.reduce((sum, it) => {
      const qty = num(it.quantity ?? it.qty ?? 1);
      const unit =
        num(it.price) ||
        num(it.unitPrice) ||
        num(it.amount) ||
        num(it.cost);
      return sum + unit * (qty || 1);
    }, 0);
  }, [items, total]);

  // บันทึก lastOrder + map orderMethods
  const saveLocalOrder = (data, isDemo = false) => {
    const now = new Date().toISOString();
    const receipt = {
      order_id: data.order_id,
      items: data.items,
      total: data.total,
      method: paymentMethod, // bank | cod | other
      payload: payloadOf(),
      at: now,
      demo: isDemo,
    };
    localStorage.setItem("lastOrder", JSON.stringify(receipt));
    try {
      const map = JSON.parse(localStorage.getItem("orderMethods") || "{}");
      map[String(data.order_id)] = paymentMethod;
      localStorage.setItem("orderMethods", JSON.stringify(map));
    } catch {}
  };

  async function confirmPayment() {
    if (!items?.length || processing) return;
    setProcessing(true);

    try {
      const resp = await createOrder({ payment_method: paymentMethod });
      if (resp?.ok && resp?.order_id) {
        const packed = {
          order_id: resp.order_id,
          total: num(resp.total) || computedTotal,
          items:
            resp.items?.map((i) => ({
              name: i.name,
              quantity: i.quantity,
              price: i.price,
            })) ||
            items.map((i) => ({
              name: i.name,
              quantity: i.quantity,
              price: i.price,
            })),
        };
        saveLocalOrder(packed, false);
        clear();
        setShowPayModal(false);
        navigate(`/wallet?order=${encodeURIComponent(resp.order_id)}`);
        return;
      }
      throw new Error("createOrder failed");
    } catch {
      // โหมดเดโม่
      const demoId = `DEMO-${Date.now()}`;
      const packed = {
        order_id: demoId,
        total: computedTotal,
        items: (items || []).map((i) => ({
          name: i.name,
          quantity: i.quantity ?? i.qty ?? 1,
          price: i.price ?? i.unitPrice ?? i.amount ?? 0,
        })),
      };
      saveLocalOrder(packed, true);
      clear();
      setShowPayModal(false);
      navigate(`/wallet?order=${encodeURIComponent(demoId)}`);
    } finally {
      setProcessing(false);
    }
  }

  // ข้อมูลบัญชี auto-fill ตามธนาคารที่เลือก (ตัวอย่าง)
  const bankAccounts = {
    kbank: { acc: "123-456-7890", name: "บริษัท ทอยสโตร์ จำกัด" },
    bbl: { acc: "111-222-3333", name: "บริษัท ทอยสโตร์ จำกัด" },
    scb: { acc: "999-888-7777", name: "บริษัท ทอยสโตร์ จำกัด" },
    ktb: { acc: "555-444-3333", name: "บริษัท ทอยสโตร์ จำกัด" },
    gsb: { acc: "222-333-4444", name: "บริษัท ทอยสโตร์ จำกัด" },
  };
  const selectedBank = bankAccounts[bank.bankName];

  return (
    <div className="container py-4">
      <h2>ชำระเงิน</h2>

      {/* สรุปคำสั่งซื้อ */}
      <div className="card mb-3">
        <div className="card-body">
          <h5>สรุปคำสั่งซื้อ</h5>
          <ul className="list-group list-group-flush">
            {(items || []).map((item) => {
              const qty = num(item.quantity ?? item.qty ?? 1);
              const unit =
                num(item.price) ||
                num(item.unitPrice) ||
                num(item.amount) ||
                0;
              const line = unit * (qty || 1);
              return (
                <li
                  key={item.product_id ?? item.id ?? item.name}
                  className="list-group-item d-flex justify-content-between"
                >
                  <span>
                    {item.name} x {qty}
                  </span>
                  <span>฿{line.toFixed(2)}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 d-flex justify-content-between">
            <strong>ราคารวม:</strong>
            <strong className="text-primary">
              ฿{computedTotal.toFixed(2)}
            </strong>
          </div>
        </div>
      </div>

      <div className="d-flex gap-2">
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/cart")}
          disabled={processing}
        >
          ย้อนกลับ
        </button>
        <button
          className="btn btn-success flex-fill"
          onClick={openPayModal}
          disabled={processing || !items?.length}
        >
          {processing ? "กำลังดำเนินการ..." : "ยืนยันการชำระเงิน"}
        </button>
      </div>

      {/* ───────── Modal ───────── */}
      {showPayModal && (
        <div
          className="pay-backdrop"
          onClick={() => !processing && setShowPayModal(false)}
        >
          <div className="pay-box" onClick={(e) => e.stopPropagation()}>
            <h4>เลือกวิธีชำระเงิน</h4>

            <div className="pay-options">
              <div
                className={`pay-card ${paymentMethod === "bank" ? "active" : ""}`}
                onClick={() => setPaymentMethod("bank")}
              >
                🏦 โอนธนาคาร
              </div>
              <div
                className={`pay-card ${paymentMethod === "cod" ? "active" : ""}`}
                onClick={() => setPaymentMethod("cod")}
              >
                📦 เก็บเงินปลายทาง
              </div>
              <div
                className={`pay-card ${paymentMethod === "other" ? "active" : ""}`}
                onClick={() => setPaymentMethod("other")}
              >
                💳 PromptPay
              </div>
            </div>

            {/* ─── โอนธนาคาร ─── */}
            {paymentMethod === "bank" && (
              <div className="pay-form mt-3">
                <div className="bank-logos">
                  {[
                    { id: "kbank", name: "กสิกรไทย", img: "/bank/kbank.jpg" },
                    { id: "bbl", name: "กรุงเทพ", img: "/bank/bbl.jpg" },
                    { id: "scb", name: "ไทยพาณิชย์", img: "/bank/scb.jpg" },
                    { id: "ktb", name: "กรุงไทย", img: "/bank/ktb.jpg" },
                    { id: "gsb", name: "ออมสิน", img: "/bank/gsb.jpg" },
                  ].map((b) => (
                    <label
                      key={b.id}
                      className={`bank-option ${bank.bankName === b.id ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="bank-select"
                        value={b.id}
                        checked={bank.bankName === b.id}
                        onChange={() => setBank({ ...bank, bankName: b.id })}
                      />
                      <img
                        src={b.img}
                        alt={b.name}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <span>{b.name}</span>
                    </label>
                  ))}
                </div>

                <label className="form-label">เลือกธนาคาร</label>
                <select
                  className="form-select mb-2"
                  value={bank.bankName}
                  onChange={(e) =>
                    setBank({ ...bank, bankName: e.target.value })
                  }
                  required
                >
                  <option value="">-- เลือกธนาคาร --</option>
                  <option value="kbank">🏦 กสิกรไทย</option>
                  <option value="bbl">🏦 กรุงเทพ</option>
                  <option value="scb">🏦 ไทยพาณิชย์</option>
                  <option value="ktb">🏦 กรุงไทย</option>
                  <option value="gsb">🏦 ออมสิน</option>
                </select>

                {selectedBank && (
                  <>
                    <div className="mb-2">
                      <label className="form-label">เลขบัญชี</label>
                      <div className="copy-row">
                        <input
                          className="form-control"
                          value={selectedBank.acc}
                          readOnly
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-warning copy-btn"
                          onClick={() =>
                            navigator.clipboard.writeText(selectedBank.acc)
                          }
                        >
                          คัดลอก
                        </button>
                      </div>
                    </div>
                    <div className="mb-2">
                      <label className="form-label">ชื่อบัญชีผู้รับ</label>
                      <input
                        className="form-control"
                        value={selectedBank.name}
                        readOnly
                      />
                    </div>
                  </>
                )}

                <label className="form-label">เลขบัญชี (4 ตัวท้าย)</label>
                <input
                  className="form-control mb-2"
                  maxLength={4}
                  value={bank.last4}
                  placeholder="กรอก 4 ตัวท้ายจากสลิป"
                  onChange={(e) =>
                    setBank({
                      ...bank,
                      last4: e.target.value.replace(/\D/g, "").slice(0, 4),
                    })
                  }
                  required
                />

                <label className="form-label">เวลาที่โอน</label>
                <input
                  type="datetime-local"
                  className="form-control mb-2"
                  value={bank.paidAt}
                  onChange={(e) => setBank({ ...bank, paidAt: e.target.value })}
                  required
                />

                <label className="form-label">อัปโหลดสลิป</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={(e) =>
                    setBank({ ...bank, slip: e.target.files?.[0] || null })
                  }
                  required
                />
              </div>
            )}

            {/* ─── COD ─── */}
            {paymentMethod === "cod" && (
              <div className="pay-form mt-3">
                <label className="form-label">ชื่อผู้รับ</label>
                <input
                  className="form-control mb-2"
                  placeholder="ชื่อ-นามสกุล"
                  value={cod.receiver}
                  onChange={(e) => setCod({ ...cod, receiver: e.target.value })}
                  required
                />
                <label className="form-label">เบอร์โทร</label>
                <input
                  className="form-control mb-2"
                  placeholder="เช่น 0812345678"
                  value={cod.phone}
                  onChange={(e) => setCod({ ...cod, phone: e.target.value })}
                  required
                />
                <label className="form-label">หมายเหตุ (ถ้ามี)</label>
                <textarea
                  rows={2}
                  className="form-control"
                  placeholder="เช่น กรุณาโทรก่อนส่ง / ฝากไว้กับ รปภ."
                  value={cod.note}
                  onChange={(e) => setCod({ ...cod, note: e.target.value })}
                />
              </div>
            )}

            {/* ─── QR code ─── */}
            {paymentMethod === "other" && (
              <div className="pay-form mt-3">
                <label className="form-label">สแกน QR เพื่อชำระเงิน</label>
                <div className="pay__qr text-center mb-3">
                  <img
                    src="/images/qr-promptpay.png"
                    alt="PromptPay QR"
                    style={{ width: 240, borderRadius: 12 }}
                  />
                </div>

                <label className="form-label">เวลาที่ชำระ</label>
                <input
                  type="datetime-local"
                  className="form-control mb-2"
                  value={other.paidAt}
                  onChange={(e) =>
                    setOther({ ...other, paidAt: e.target.value })
                  }
                  required
                />

                <label className="form-label">รหัสอ้างอิง / Ref (ถ้ามี)</label>
                <input
                  className="form-control mb-2"
                  placeholder="เช่น QR-2024-xxxxx"
                  value={other.ref}
                  onChange={(e) => setOther({ ...other, ref: e.target.value })}
                />

                <label className="form-label">อัปโหลดสลิป</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={(e) =>
                    setOther({ ...other, slip: e.target.files?.[0] || null })
                  }
                  required
                />
              </div>
            )}

            <div className="d-flex justify-content-end mt-3">
              <button
                className="btn btn-danger me-2"
                onClick={() => !processing && setShowPayModal(false)}
              >
                ยกเลิก
              </button>
              <button
                className="btn btn-primary"
                onClick={confirmPayment}
                disabled={processing}
              >
                {processing ? "กำลังยืนยัน..." : "ยืนยันการชำระเงิน"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
