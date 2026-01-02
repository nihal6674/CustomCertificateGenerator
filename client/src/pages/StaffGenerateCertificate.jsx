import { useState } from "react";
import {
  issueSingleCertificate,
  issueBulkCertificates,
  getBulkJobStatus,
} from "../api/certificate";

export default function StaffGenerateCertificate() {
  const [tab, setTab] = useState("single");

  return (
    <div className="p-8 max-w-4xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-6">Generate Certificate</h1>

      <div className="flex gap-4 mb-6">
        <TabButton active={tab === "single"} onClick={() => setTab("single")}>
          Single Issue
        </TabButton>
        <TabButton active={tab === "bulk"} onClick={() => setTab("bulk")}>
          Bulk Upload
        </TabButton>
      </div>

      {tab === "single" ? <SingleIssue /> : <BulkIssue />}
    </div>
  );
}

/* ---------- SINGLE ISSUE ---------- */

function SingleIssue() {
  const [form, setForm] = useState({
    studentName: "",
    email: "",
    templateId: "",
  });
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await issueSingleCertificate(form);
      alert("Certificate issued");
      setForm({ studentName: "", email: "", templateId: "" });
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 bg-slate-800 p-6 rounded-xl"
    >
      <Input
        label="Student Name"
        value={form.studentName}
        onChange={(v) => setForm({ ...form, studentName: v })}
      />
      <Input
        label="Email"
        value={form.email}
        onChange={(v) => setForm({ ...form, email: v })}
      />
      <Input
        label="Template ID"
        value={form.templateId}
        onChange={(v) => setForm({ ...form, templateId: v })}
      />

      <button
        disabled={loading}
        className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded"
      >
        {loading ? "Issuing..." : "Issue Certificate"}
      </button>
    </form>
  );
}

/* ---------- BULK ISSUE ---------- */

function BulkIssue() {
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);

  async function upload() {
    if (!file) return;
    const res = await issueBulkCertificates(file);
    setJobId(res.jobId);
    poll(res.jobId);
  }

  async function poll(id) {
    const interval = setInterval(async () => {
      const res = await getBulkJobStatus(id);
      setStatus(res);

      if (res.status === "COMPLETED" || res.status === "FAILED") {
        clearInterval(interval);
      }
    }, 2000);
  }

  return (
    <div className="bg-slate-800 p-6 rounded-xl space-y-4">
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button
        onClick={upload}
        className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded"
      >
        Upload Excel
      </button>

      {jobId && (
        <div className="text-sm text-slate-300">
          Job ID: <span className="font-mono">{jobId}</span>
        </div>
      )}

      {status && (
        <div className="text-sm text-slate-300 space-y-1">
          <p>Status: {status.status}</p>
          <p>Success: {status.successCount}</p>
          <p>Failed: {status.failedCount}</p>
        </div>
      )}
    </div>
  );
}

/* ---------- UI HELPERS ---------- */

function Input({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
        required
      />
    </div>
  );
}

function TabButton({ active, children, ...props }) {
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded ${
        active
          ? "bg-slate-700 text-white"
          : "bg-slate-900 text-slate-400"
      }`}
    >
      {children}
    </button>
  );
}
