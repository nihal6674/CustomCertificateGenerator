import { API_BASE_URL } from "./config";
const API_URL = `${API_BASE_URL}/api/users`;

export async function getUsers() {
  const res = await fetch(API_URL, {
    credentials: "include", // send JWT cookie
  });

  if (!res.ok) {
    throw new Error("Failed to fetch users");
  }

  return res.json();
}

export async function toggleUserStatus(userId) {
  const res = await fetch(
    `${API_URL}/${userId}/status`,
    {
      method: "PATCH",
      credentials: "include",
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const error = new Error(data.message || "Action failed");
    error.status = res.status;
    throw error;
  }

  return res.json();
}

export async function updateUser(userId, payload) {
  const res = await fetch(`${API_URL}/${userId}/role`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to update user");
  }

  return res.json();
}

export async function createUser(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const error = new Error(data.message || "Failed to create user");
    error.status = res.status;
    throw error;
  }

  return res.json();
}
