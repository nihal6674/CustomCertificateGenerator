import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getCertificates } from "../../../api/certificate";
import CertificateViewModal from "../../../components/CertificateViewModal";
import { Eye } from "lucide-react";


export default function CertificatesTable() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [viewCert, setViewCert] = useState(null);

  /* ---------------- FETCH FROM BACKEND ---------------- */
  useEffect(() => {
    fetchData();
  }, [page, search]);

  async function fetchData() {
    setLoading(true);
    try {
      const data = await getCertificates({
        page,
        limit,
        search,
      });

      setCertificates(data.certificates || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(err.message || "Failed to load certificates");
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  /* ---------------- DATE FORMATTER ---------------- */
  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

  return (
    <div className="space-y-6">
      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search by name, certificate #, class"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="w-full sm:w-96 bg-slate-800 border border-slate-700
          rounded px-3 py-2 text-sm text-white"
      />

      {/* LOADING */}
      {loading && (
        <p className="text-slate-400 text-sm">Loading certificates…</p>
      )}

      {/* EMPTY */}
      {!loading && certificates.length === 0 && (
        <div className="text-slate-400 text-sm bg-slate-800
          border border-slate-700 rounded p-4">
          No certificates found
        </div>
      )}

      {/* TABLE */}
      {!loading && certificates.length > 0 && (
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-slate-300">
              <tr>
                <th className="p-3 text-left">Student</th>
                <th className="p-3 text-left">Certificate #</th>
                <th className="p-3 text-left">Class</th>
                <th className="p-3 text-left">Training Date</th>
                <th className="p-3 text-left">Issued On</th>
                <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th> {/* ✅ ADD */}

              </tr>
            </thead>

            <tbody>
              {certificates.map((c) => (
                <tr
                  key={c._id}
                  className="border-t border-slate-800 hover:bg-slate-800/50"
                >
                  {/* STUDENT NAME */}
                  <td className="p-3">
                    {c.firstName}
                    {c.middleName ? ` ${c.middleName}` : ""} {c.lastName}
                  </td>

                  {/* CERT NUMBER */}
                  <td className="p-3 font-mono">
                    {c.certificateNumber}
                  </td>

                  {/* CLASS */}
                  <td className="p-3">{c.className}</td>

                  {/* TRAINING DATE */}
                  <td className="p-3">
                    {formatDate(c.trainingDate)}
                  </td>

                  {/* ISSUE DATE */}
                  <td className="p-3">
                    {formatDate(c.issueDate)}
                  </td>

                  {/* STATUS */}
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        c.status === "REVOKED"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>

                  <td className="p-3">
  <button
    onClick={() => setViewCert(c)}
    className="
      inline-flex items-center gap-1.5
      px-3 py-1.5
      rounded-lg
      text-xs font-medium
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
</td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 bg-slate-800 border border-slate-700
              rounded disabled:opacity-40"
          >
            Prev
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 bg-slate-800 border border-slate-700
              rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <CertificateViewModal
  open={!!viewCert}
  certificate={viewCert}
  onClose={() => setViewCert(null)}
/>

    </div>
  );
}