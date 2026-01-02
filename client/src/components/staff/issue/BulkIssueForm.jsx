import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  issueBulkCertificates,
  getBulkJobStatus,
} from "../../../api/certificate";

const API_BASE = "http://localhost:3000/api/certificates";

export default function BulkIssueForm() {
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [jobRunning, setJobRunning] = useState(false);

  const [errors, setErrors] = useState([]);

  const pollRef = useRef(null);

  /* ---------------- START BULK ISSUE ---------------- */
  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select an Excel file");
      return;
    }

    setUploading(true);
    setErrors([]);
    setStatus(null);

    try {
      const res = await issueBulkCertificates(file);

      setJobId(res.jobId);
      setJobRunning(true); // 🔥 job lifecycle starts
      toast.success("Bulk job started");

      startPolling(res.jobId);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false); // upload done, job still running
    }
  };

  /* ---------------- POLLING ---------------- */
  const startPolling = (id) => {
    if (pollRef.current) return;

    setPolling(true);
    pollRef.current = setInterval(async () => {
      try {
        const res = await getBulkJobStatus(id);

        setStatus(res);
        setErrors(res.errors || []);

        if (
          res.status === "COMPLETED" ||
          res.status === "COMPLETED_WITH_ERRORS" ||
          res.status === "FAILED"
        ) {
          stopPolling();
          setJobRunning(false); // 🔥 job finished

          if ((res.errors || []).length > 0) {
            toast.error(
              `Completed with ${(res.errors || []).length} failed records`
            );
          } else {
            toast.success("Bulk issuance completed successfully");
          }
        }
      } catch (err) {
        stopPolling();
        setJobRunning(false);
        toast.error(err.message);
      }
    }, 2000);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setPolling(false);
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  /* ---------------- DERIVED STATS ---------------- */
  const total = status?.total || 0;
  const processed = status?.processed || 0;
  const success = status?.success || 0;
  const failed = errors.length;

  const progressPercent =
    total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">

      {/* EXCEL FORMAT INSTRUCTIONS */}
<div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-200">
  <p className="font-medium mb-2">
    ⚠️ Please ensure your Excel file follows this format:
  </p>

  <ul className="list-disc list-inside space-y-1">
    <li>
      Excel must contain the following columns
      <span className="font-semibold"> (case-sensitive)</span>:
    </li>
    <li className="ml-4 font-mono text-blue-300">
      firstName, lastName, className, trainingDate
    </li>
    <li>
      Column order does <span className="font-semibold">not</span> matter
    </li>
    <li>
      <span className="font-semibold">className</span> must match an
      <span className="font-semibold"> active certificate template</span>
    </li>
    <li>
      <span className="font-semibold">trainingDate</span> must be a valid
      Excel date or date string
    </li>
    <li>
      Extra columns are allowed and will be ignored
    </li>
  </ul>
</div>

      {/* FILE INPUT */}
      <div>
        <label className="block text-sm text-slate-400 mb-1">
          Upload Excel File
        </label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full text-sm text-slate-300
            file:bg-slate-700 file:border-none file:px-4 file:py-2
            file:rounded file:text-white file:cursor-pointer"
        />
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-3 items-center">
        <button
          onClick={handleUpload}
          disabled={uploading || jobRunning}
          className={`px-4 py-2 rounded font-medium transition
            ${
              uploading || jobRunning
                ? "bg-slate-600 cursor-not-allowed"
                : "bg-violet-600 hover:bg-violet-700"
            }`}
        >
          {uploading
            ? "Uploading…"
            : jobRunning
            ? "Processing…"
            : "Start Bulk Issue"}
        </button>

        {polling && (
          <button
            onClick={stopPolling}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-sm"
          >
            Stop Polling
          </button>
        )}

        {!polling && jobId && jobRunning && (
          <button
            onClick={() => startPolling(jobId)}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-sm"
          >
            Resume Polling
          </button>
        )}
      </div>

      {/* LOADER */}
      {jobRunning && (
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <svg
            className="animate-spin h-5 w-5 text-violet-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span>Bulk certificate processing in progress…</span>
        </div>
      )}

      {/* JOB STATUS */}
      {jobId && status && (
        <div className="bg-slate-900 border border-slate-700 rounded p-4 space-y-3">
          <p className="text-sm">
            <span className="text-slate-400">Job ID:</span>{" "}
            <span className="font-mono">{jobId}</span>
          </p>

          <p className="text-sm">
            <span className="text-slate-400">Status:</span>{" "}
            <StatusBadge status={status.status} />
          </p>

          {/* PROGRESS BAR */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded h-2">
              <div
                className="bg-emerald-500 h-2 rounded transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* COUNTS */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Processed:</span>{" "}
              {processed}/{total}
            </div>
            <div>
              <span className="text-slate-400">Success:</span>{" "}
              {success}
            </div>
            <div>
              <span className="text-slate-400">Failed:</span>{" "}
              {failed}
            </div>
          </div>

          {/* DOWNLOAD FAILED ROWS */}
          {failed > 0 &&
            (status.status === "COMPLETED" ||
              status.status === "COMPLETED_WITH_ERRORS") && (
              <a
                href={`${API_BASE}/bulk-failed/${jobId}/export`}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-2 text-sm text-red-400 underline"
              >
                Download failed rows (Excel)
              </a>
            )}
        </div>
      )}

      {/* INLINE ERRORS */}
      {errors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded p-4">
          <p className="text-sm text-red-400 font-medium mb-2">
            {errors.length} row(s) failed validation:
          </p>

          <div className="max-h-64 overflow-y-auto pr-2">
            <ul className="list-disc list-inside text-sm text-red-300 space-y-1">
              {errors.map((e) => (
                <li key={e._id}>
                  <span className="font-medium">
                    Row {e.rowNumber}:
                  </span>{" "}
                  {e.error}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- STATUS BADGE ---------------- */

function StatusBadge({ status }) {
  const styles = {
    PENDING: "bg-yellow-500/20 text-yellow-400",
    PROCESSING: "bg-blue-500/20 text-blue-400",
    COMPLETED: "bg-emerald-500/20 text-emerald-400",
    COMPLETED_WITH_ERRORS: "bg-orange-500/20 text-orange-400",
    FAILED: "bg-red-500/20 text-red-400",
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${
        styles[status] || "bg-slate-500/20 text-slate-300"
      }`}
    >
      {status}
    </span>
  );
}
