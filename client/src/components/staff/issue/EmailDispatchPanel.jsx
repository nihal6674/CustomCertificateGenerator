import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  dispatchCertificateEmails,
  getCertificateEmailStats,
} from "../../../api/certificate";

export default function EmailDispatchPanel() {
  const [dispatching, setDispatching] = useState(false);
  const [stats, setStats] = useState(null);

  // Load stats from backend
  const loadStats = async () => {
    try {
      const res = await getCertificateEmailStats();
      setStats(res);
      return res;
    } catch {
      return null;
    }
  };

  // Initial load
  useEffect(() => {
    loadStats();
  }, []);

  // 🔁 POLLING WHILE DISPATCHING
  useEffect(() => {
    if (!dispatching) return;

    const interval = setInterval(async () => {
      const res = await loadStats();

      // Stop ONLY when backend has no work left
      if (res && res.pending === 0) {
        clearInterval(interval);
        setDispatching(false);
        toast.success("Email dispatch completed");
      }
    }, 2000); // ⬅️ lively polling (2s)

    return () => clearInterval(interval);
  }, [dispatching]);

  const handleDispatch = async () => {
    setDispatching(true);

    try {
      const res = await dispatchCertificateEmails();
      toast.success(res.message || "Email dispatch started");

      // Immediate refresh
      await loadStats();
    } catch (err) {
      toast.error(err.message || "Failed to start email dispatch");
      setDispatching(false);
    }
  };

  const total =
    stats ? stats.pending + stats.sent + stats.failed : 0;

  const progress =
    total > 0
      ? Math.round(((stats.sent + stats.failed) / total) * 100)
      : 0;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
      {/* HEADER */}
      <h2 className="text-lg font-semibold flex items-center gap-2">
        Email Notifications
        {dispatching && (
          <span className="inline-block w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        )}
      </h2>

      {/* STATUS CARDS */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Stat
            label="Pending"
            value={stats.pending}
            color="text-yellow-400"
            pulse={dispatching && stats.pending > 0}
          />
          <Stat
            label="Sent"
            value={stats.sent}
            color="text-emerald-400"
          />
          <Stat
            label="Failed"
            value={stats.failed}
            color="text-red-400"
          />
        </div>
      )}

      {/* PROGRESS BAR */}
      {dispatching && total > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Sending emails…</span>
            <span>{progress}%</span>
          </div>

          <div className="h-2 bg-slate-700 rounded overflow-hidden">
            <div
              className="h-2 bg-emerald-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* INFO */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 text-sm text-slate-300">
        <ul className="list-disc list-inside space-y-1">
          <li>Emails are sent asynchronously in the background</li>
          <li>Status updates automatically every few seconds</li>
          <li>Already sent certificates are skipped safely</li>
        </ul>
      </div>

      {/* ACTION */}
      <button
        onClick={handleDispatch}
        disabled={dispatching || stats?.pending === 0}
        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60
          px-4 py-2 rounded font-medium transition"
      >
        {dispatching ? "Sending Emails…" : "Send Pending Emails"}
      </button>
    </div>
  );
}

function Stat({ label, value, color, pulse }) {
  return (
    <div
      className={`bg-slate-900 border border-slate-700 rounded-lg p-4 text-center
        ${pulse ? "animate-pulse" : ""}`}
    >
      <div className={`text-2xl font-bold ${color}`}>
        {value ?? "—"}
      </div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
}
