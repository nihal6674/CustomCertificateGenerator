import { useEffect, useState } from "react";
import { getCertificates } from "../api/certificate";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import CertificateViewModal from "../components/CertificateViewModal";
import { Eye } from "lucide-react";

import { API_BASE_URL } from "../api/config";

const API_URL = `${API_BASE_URL}/api/certificates`;

export default function AdminIssuedCertificates() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewCert, setViewCert] = useState(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);

const [actionCert, setActionCert] = useState(null);
const [notifyStudent, setNotifyStudent] = useState(true);
const [adminMessage, setAdminMessage] = useState("");

  /* ---------------- LOAD DATA ---------------- */
  const loadCertificates = async () => {
    setLoading(true);
    try {
      const data = await getCertificates({ page, limit, search });
      setCertificates(data.certificates);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- DEBOUNCED SEARCH ---------------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCertificates();
    }, 300); // debounce delay

    return () => clearTimeout(timer);
  }, [page, search]);

  /* ---------------- TOGGLE STATUS ---------------- */
  const toggleStatus = async () => {
  if (!isAdmin || !actionCert) return;

  const t = toast.loading("Updating certificate status...");

  try {
    const res = await fetch(
      `${API_URL}/status/${actionCert.certificateNumber}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          notifyStudent,
          adminMessage: adminMessage.trim(),
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }

    toast.success("Certificate status updated", { id: t });
    setActionCert(null);
    setAdminMessage("");
    setNotifyStudent(true);
    loadCertificates();
  } catch (err) {
    toast.error(err.message || "Action failed", { id: t });
  }
};


  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-2">Issued Certificates</h1>
      <p className="text-slate-400 mb-6">
        View, search, and manage issued certificates
      </p>

      {/* SEARCH */}
      <input
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
        placeholder="Search name, class, certificate #, instructor"
        className="w-full md:w-96 mb-2 px-4 py-2 rounded bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
      />

      {loading && (
        <p className="text-sm text-slate-400 mb-4">
          Searching…
        </p>
      )}

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="min-w-full bg-slate-800">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-4 py-3 text-left">Cert #</th>
              <th className="px-4 py-3 text-left">Student</th>
              <th className="px-4 py-3 text-left">Class</th>
              <th className="px-4 py-3 text-left">Instructor</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {certificates.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-6 text-center text-slate-500">
                  No certificates found
                </td>
              </tr>
            ) : (
              certificates.map((c) => (
                <tr key={c._id} className="border-t border-slate-700">
                  <td className="px-4 py-3">
                    {c.certificateNumber}
                  </td>

                  <td className="px-4 py-3">
                    {c.firstName} {c.middleName} {c.lastName}
                  </td>

                  <td className="px-4 py-3">{c.className}</td>

                  <td className="px-4 py-3">
                    {c.instructorName}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        c.status === "ISSUED"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center space-x-2">
                   <button
  onClick={() => setViewCert(c)}
  className="
    inline-flex items-center gap-1.5
    px-3 py-1.5
    rounded-lg
    text-sm font-medium
    text-sky-400
    bg-sky-500/10
    hover:bg-sky-500/20
    hover:text-sky-300
    transition
  "
>
  <Eye size={14} />
  View
</button>



                    {isAdmin && (
                      <button
  onClick={() => setActionCert(c)}
  className={`px-3 py-1 rounded text-sm ${
    c.status === "ISSUED"
      ? "bg-red-500 hover:bg-red-600"
      : "bg-emerald-500 hover:bg-emerald-600"
  }`}
>
  {c.status === "ISSUED" ? "Revoke" : "Reinstate"}
</button>

                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center mt-6 text-sm">
        <span className="text-slate-400">
          Page {page} of {totalPages || 1}
        </span>

        <div className="space-x-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 bg-slate-800 rounded disabled:opacity-40"
          >
            Prev
          </button>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 bg-slate-800 rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
      <CertificateViewModal
  open={!!viewCert}
  certificate={viewCert}
  onClose={() => setViewCert(null)}
/>
{actionCert && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
    <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md p-6 space-y-4">
      <h3 className="text-lg font-semibold">
        {actionCert.status === "ISSUED"
          ? "Revoke Certificate"
          : "Reinstate Certificate"}
      </h3>

      <p className="text-sm text-slate-400">
        Certificate:{" "}
        <span className="font-mono text-slate-200">
          {actionCert.certificateNumber}
        </span>
      </p>

      {/* Notify checkbox */}
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={notifyStudent}
          onChange={(e) => setNotifyStudent(e.target.checked)}
          className="mt-1"
        />
        <span>
          Notify student by email
        </span>
      </label>

      {/* Admin message */}
      {notifyStudent && (
        <textarea
          rows={3}
          value={adminMessage}
          onChange={(e) => setAdminMessage(e.target.value)}
          placeholder="Optional message to include in the email"
          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm resize-none"
        />
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={() => setActionCert(null)}
          className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600"
        >
          Cancel
        </button>

        <button
          onClick={toggleStatus}
          className={`px-4 py-2 rounded font-medium ${
            actionCert.status === "ISSUED"
              ? "bg-red-500 hover:bg-red-600"
              : "bg-emerald-500 hover:bg-emerald-600"
          }`}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
