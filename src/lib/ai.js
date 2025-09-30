// src/lib/ai.js
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function fetchAIRecommendations(params = {}) {
  const q = new URLSearchParams({ limit: 12, ...params }).toString();
  const res = await fetch(`${API_BASE}/api/ai/recommendations?${q}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch AI recommendations");
  return res.json();
}

export async function fetchHeroBanners() {
  return fetchAIRecommendations({ popular: 1, onSale: 1, limit: 5 });
}
