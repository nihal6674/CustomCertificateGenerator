import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  dispatchCertificateEmails,
  getCertificateEmailStats,
} from "../../../api/certificate";

export default function EmailDispatchPanel() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // Load stats once on mount
  const loadStats = async () => {
    try {
      const res = await getCertificateEmailStats();
      setStats(res);
      return res;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // 🔁 POLLING LOGIC
  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(async () => {
      const res = await loadStats();

      // Stop polling when all pending emails are done
      if (res && res.pending === 0) {
        clearInterval(interval);
        setLoading(false);
      }
    }, 5000); // every 5 seconds

    return () => clearInterval(interval);
  }, [loading]);

  const handleDispatch = async () => {
    setLoading(true);

    try {
      const res = await dispatchCertificateEmails();
      toast.success(res.message || "Email dispatch started");

      // immediate refresh
      await loadStats();
    } catch (err) {
      toast.error(err.message || "Failed to dispatch emails");
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
      <h2 className="text-lg font-semibold">Email Notifications</h2>

      {/* STATUS */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Pending" value={stats.pending} color="text-yellow-400" />
          <Stat label="Sent" value={stats.sent} color="text-emerald-400" />
          <Stat label="Failed" value={stats.failed} color="text-red-400" />
        </div>
      )}

      {/* INFO */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 text-sm text-slate-300">
        <ul className="list-disc list-inside space-y-1">
          <li>Emails are sent asynchronously</li>
          <li>Status updates automatically every few seconds</li>
          <li>Already sent certificates are skipped</li>
        </ul>
      </div>

      {/* ACTION */}
      <button
        onClick={handleDispatch}
        disabled={loading || stats?.pending === 0}
        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60
          px-4 py-2 rounded font-medium transition"
      >
        {loading ? "Sending Emails…" : "Send Pending Emails"}
      </button>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>
        {value ?? "—"}
      </div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
}
