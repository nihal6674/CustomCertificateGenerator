import { useEffect, useState } from "react";
import { getCertificates } from "../api/certificate";

export default function StaffCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCertificates();
  }, []);

  async function fetchCertificates() {
    setLoading(true);
    try {
      const res = await getCertificates();
      setCertificates(res.certificates || res);
    } catch {}
    setLoading(false);
  }

  const filtered = certificates.filter((c) =>
    c.studentName?.toLowerCase().includes(search.toLowerCase()) ||
    c.certificateNumber?.includes(search)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Issued Certificates</h1>
        <input
          placeholder="Search name or certificate #"
          className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-slate-800 rounded">
            <thead className="bg-slate-800">
              <tr className="text-left text-sm text-slate-300">
                <th className="p-3">Student</th>
                <th className="p-3">Certificate #</th>
                <th className="p-3">Template</th>
                <th className="p-3">Issued On</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c._id}
                  className="border-t border-slate-800 text-sm"
                >
                  <td className="p-3">{c.studentName}</td>
                  <td className="p-3 font-mono">{c.certificateNumber}</td>
                  <td className="p-3">{c.templateName}</td>
                  <td className="p-3">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        c.active
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {c.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <p className="text-slate-400 text-sm mt-4">
              No certificates found
            </p>
          )}
        </div>
      )}
    </div>
  );
}
