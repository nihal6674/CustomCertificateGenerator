const API_URL = "http://localhost:3000/api/templates";


export async function getTemplates() {
  const res = await fetch("http://localhost:3000/api/templates", {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch templates");
  }

  return res.json();
}

export async function createTemplate(formData) {
  const res = await fetch("http://localhost:3000/api/templates", {
    method: "POST",
    credentials: "include",
    body: formData, // multipart/form-data
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to create template");
  }

  return res.json();
}

export async function toggleTemplateStatus(templateId) {
  const res = await fetch(
    `http://localhost:3000/api/templates/${templateId}/deactivate`,
    {
      method: "PATCH",
      credentials: "include",
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const error = new Error(data.message || "Failed to update template status");
    error.status = res.status;
    throw error;
  }

  return res.json();
}

export async function updateTemplate(templateId, formData) {
  const res = await fetch(
    `http://localhost:3000/api/templates/${templateId}`,
    {
      method: "PATCH",
      credentials: "include",
      body: formData, // multipart/form-data
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to update template");
  }

  return res.json();
}

/* ---------------- GET LIST OF ACTIVE TEMPLATES ---------------- */

export async function getActiveTemplates() {
  const res = await fetch(`${API_URL}/active`, {
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch templates");
  }

  return res.json();
}
