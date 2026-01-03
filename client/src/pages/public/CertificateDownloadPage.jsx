import { useState } from "react";
import toast from "react-hot-toast";
import { Download, CheckCircle, XCircle } from "lucide-react";

import { API_BASE_URL } from "./config";

const API_BASE = `${API_BASE_URL}/api/certificates`;

export default function CertificateDownloadPage() {
  const [certificateNumber, setCertificateNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  /* ---------------- VERIFY ---------------- */
  const handleVerify = async () => {
    if (!certificateNumber.trim()) {
      toast.error("Enter certificate number");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(
        `${API_BASE}/verify/${certificateNumber.trim()}`
      );

      const data = await res.json();

      if (!res.ok || !data.valid) {
        setResult(data);
        toast.error(data.message || "Invalid certificate");
        return;
      }

      setResult(data);
      toast.success("Certificate verified");
    } catch {
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- DOWNLOAD ---------------- */
  const handleDownload = () => {
    window.location.href = `${API_BASE}/download/${certificateNumber.trim()}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">

        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold">Verify & Download Certificate</h1>
          <p className="text-slate-400 text-sm mt-1">
            Enter your certificate number to verify and download
          </p>
        </div>

        {/* INPUT */}
        <input
          value={certificateNumber}
          onChange={(e) => setCertificateNumber(e.target.value)}
          placeholder="Certificate Number"
          className="w-full px-4 py-2 rounded bg-slate-900 border border-slate-700
            focus:ring-2 focus:ring-emerald-500 outline-none"
        />

        {/* VERIFY BUTTON */}
        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600
            disabled:opacity-50 py-2 rounded font-medium"
        >
          {loading ? "Verifying…" : "Verify Certificate"}
        </button>

        {/* RESULT */}
        {result && (
          <div
            className={`border rounded-lg p-4 space-y-3 ${
              result.valid
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-red-500/40 bg-red-500/10"
            }`}
          >
            <div className="flex items-center gap-2">
              {result.valid ? (
                <CheckCircle className="text-emerald-400" />
              ) : (
                <XCircle className="text-red-400" />
              )}
              <h3 className="font-semibold">
                {result.valid
                  ? "Certificate Valid"
                  : "Certificate Invalid"}
              </h3>
            </div>

            {/* DETAILS */}
            {result.studentName && (
              <p><strong>Student:</strong> {result.studentName}</p>
            )}
            {result.className && (
              <p><strong>Class:</strong> {result.className}</p>
            )}
            {result.instructorName && (
              <p><strong>Instructor:</strong> {result.instructorName}</p>
            )}
            {result.issueDate && (
              <p>
                <strong>Issued On:</strong>{" "}
                {new Date(result.issueDate).toLocaleDateString()}
              </p>
            )}
            {result.message && !result.valid && (
              <p className="text-red-300">{result.message}</p>
            )}

            {/* DOWNLOAD */}
            {result.valid && !result.revoked && (
              <button
                onClick={handleDownload}
                className="w-full mt-3 inline-flex items-center justify-center gap-2
                  bg-sky-500 hover:bg-sky-600 py-2 rounded font-medium"
              >
                <Download size={18} />
                Download Certificate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
