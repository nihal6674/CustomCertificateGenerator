import { API_BASE_URL } from "./config";

const API_URL = `${API_BASE_URL}/api/certificates`;

// /* ---------------- LIST / SEARCH CERTIFICATES ---------------- */
// export async function getCertificatesByAdvancedSearch(params = {}) {
//   const query = new URLSearchParams(params).toString();

//   const res = await fetch(`${API_URL}?${query}`, {
//     credentials: "include",
//   });

//   if (!res.ok) {
//     const err = await res.json();
//     throw new Error(err.message || "Failed to fetch certificates");
//   }

//   return res.json();
// }



// DONE
/* ---------------- ISSUE SINGLE CERTIFICATE ---------------- */
export async function issueSingleCertificate(payload) {
  const res = await fetch(`${API_URL}/issue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Certificate issue failed");
  }

  return res.json();
}

/* ---------------- BULK ISSUE (EXCEL UPLOAD) ---------------- */
export async function issueBulkCertificates(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/issue-bulk`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Bulk upload failed");
  }

  return res.json();
}

/* ---------------- BULK JOB STATUS ---------------- */
export async function getBulkJobStatus(jobId) {
  const res = await fetch(`${API_URL}/bulk-status/${jobId}`, {
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch bulk status");
  }

  return res.json();
}

/* ---------------- REISSUE FAILED ---------------- */
export async function reissueFailedCertificates(jobId) {
  const res = await fetch(`${API_URL}/reissue-failed/${jobId}`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Reissue failed");
  }

  return res.json();
}

/* ---------------- EXPORT FAILED ROWS ---------------- */
export function exportFailedRows(jobId) {
  window.open(
    `${API_URL}/bulk-failed/${jobId}/export`,
    "_blank"
  );
}



// DONE
/* ---------------- GET ALL CERTIFICATES + search functionality---------------- */
export async function getCertificates({ page = 1, limit = 10, search = "" }) {
  const params = new URLSearchParams({
    page,
    limit,
    ...(search && { search }),
  });

  const res = await fetch(
    `${API_URL}?${params}`,
    { credentials: "include" }
  );

  if (!res.ok) throw new Error("Failed to fetch certificates");
  return res.json();
}

/* ---------------- DISPATCH CERTIFICATE EMAILS ---------------- */
export async function dispatchCertificateEmails() {
  const res = await fetch(`${API_URL}/dispatch-emails`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Email dispatch failed");
  }

  return res.json();
}

/* ---------------- EMAIL STATS ---------------- */
export async function getCertificateEmailStats() {
  const res = await fetch(`${API_URL}/email-stats`, {
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch email stats");
  }

  return res.json();
}



