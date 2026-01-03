import { API_BASE_URL } from "./config";
const API_URL = `${API_BASE_URL}/api`;

/**
 * Fetch signed view URL for a file stored in R2
 * @param {string} key - R2 object key
 * @returns {string} signed URL
 */
export async function viewFile(key) {
  const res = await fetch(`${API_URL}/files/view?key=${encodeURIComponent(key)}`, {
    credentials: "include", // ✅ send JWT cookie
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to load file");
  }

  const data = await res.json();
  return data.url; // 🔑 signed URL
}
