// src/components/CategoryRow.jsx
import React from "react";
import "../styles/ai.css";

/**
 * ใช้ key ให้ตรงกับ category_slug ในฐานข้อมูลจริง
 * จากตารางของคุณมี: gundam, superhero, anime, game
 */
const CATS = [
  { key: "superhero", label: "ซูเปอร์ฮีโร่", icon: "🦸‍♂️" },
  { key: "game",      label: "เกม",        icon: "🎮" },
  { key: "anime",     label: "อนิเมะ",     icon: "✨" },
  { key: "gundam",    label: "หุ่นยนต์",    icon: "🤖" }, // หุ่นยนต์ = หมวด gundam
];

export default function CategoryRow() {
  const handlePick = (cat) => {
    // ส่ง event ให้ AISearchSection ไปยิง /api/products/search แทนการเปลี่ยนหน้า
    const payload = { q: cat.key, popular: 1, limit: 8 };
    window.dispatchEvent(new CustomEvent("ai:quickSearch", { detail: payload }));
  };

  return (
    <div className="cat-row centered">
      {CATS.map((c) => (
        <button
          key={c.key}
          className="cat-pill"
          onClick={() => handlePick(c)}
          title={c.label}
        >
          <span className="cat-ic">{c.icon}</span>
          <span className="cat-txt">{c.label}</span>
        </button>
      ))}
    </div>
  );
}
