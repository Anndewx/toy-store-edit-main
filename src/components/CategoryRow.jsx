import React, { useState } from "react";

const categories = [
  
];

export default function CategoryRow() {
  const [active, setActive] = useState("hero");

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="flex flex-wrap justify-center gap-6">
        {categories.map((cat) => {
          const isActive = active === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActive(cat.key)}
              className={[
                "px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 shadow-lg border",
                isActive
                  ? "bg-white text-black border-white scale-105"
                  : "bg-transparent text-white border-white/30 hover:bg-white/10 hover:scale-105",
              ].join(" ")}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
