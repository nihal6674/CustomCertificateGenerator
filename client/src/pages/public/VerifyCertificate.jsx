import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

import { API_BASE_URL } from "./config";

const API_URL = `${API_BASE_URL}/api/certificates`;

export default function VerifyCertificate() {
  const { certificateNumber } = useParams();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    verify();
  }, [certificateNumber]);

  async function verify() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_URL}/verify/${certificateNumber}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Verification failed");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">

        {/* HEADER */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            Certificate Verification
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Certificate #{certificateNumber}
          </p>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="text-center text-slate-400">
            Verifying certificate…
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <StatusBox
            icon={<XCircle className="text-red-400" size={36} />}
            title="Verification Failed"
            message={error}
          />
        )}

        {/* RESULT */}
        {!loading && result && (
          <>
            {result.valid ? (
              <StatusBox
                icon={
                  <CheckCircle
                    className="text-emerald-400"
                    size={36}
                  />
                }
                title="Certificate is Valid"
                message="This certificate is authentic and issued by the organization."
              />
            ) : result.revoked ? (
              <StatusBox
                icon={
                  <AlertTriangle
                    className="text-red-400"
                    size={36}
                  />
                }
                title="Certificate Revoked"
                message="This certificate has been revoked and is no longer valid."
              />
            ) : (
              <StatusBox
                icon={
                  <XCircle
                    className="text-red-400"
                    size={36}
                  />
                }
                title="Invalid Certificate"
                message="No valid certificate was found."
              />
            )}

            {/* DETAILS */}
            <div className="bg-slate-900 rounded-lg p-4 space-y-2 text-sm">
              <Detail label="Student Name" value={result.studentName} />
              <Detail label="Class" value={result.className} />
              <Detail label="Instructor" value={result.instructorName} />
              {result.trainingDate && (
                <Detail
                  label="Training Date"
                  value={formatDate(result.trainingDate)}
                />
              )}
              {result.issueDate && (
                <Detail
                  label="Issued On"
                  value={formatDate(result.issueDate)}
                />
              )}
              <Detail
                label="Status"
                value={result.status}
                highlight
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- COMPONENTS ---------- */

function StatusBox({ icon, title, message }) {
  return (
    <div className="flex flex-col items-center text-center gap-2">
      {icon}
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  );
}

function Detail({ label, value, highlight }) {
  if (!value) return null;

  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-400">{label}</span>
      <span
        className={
          highlight
            ? "font-semibold text-white"
            : "text-slate-200"
        }
      >
        {value}
      </span>
    </div>
  );
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}
