import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { viewFile } from "../api/file";

export default function CertificateViewModal({
  open,
  onClose,
  certificate,
}) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !certificate) return;

    setLoading(true);
    setUrl(null);

    viewFile(certificate.pdfFilePath)
      .then((signedUrl) => {
        setUrl(signedUrl);
      })
      .catch(() => {
        toast.error("Failed to load certificate");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, certificate]);

  if (!open || !certificate) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-slate-900 rounded-xl w-[90vw] max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <div>
            <h2 className="font-semibold text-white">
              Certificate Preview
            </h2>
            <p className="text-sm text-slate-400">
              {certificate.firstName} {certificate.middleName}{" "}
              {certificate.lastName} · {certificate.className}
            </p>
          </div>

          <button onClick={onClose}>
            <X className="text-slate-400 hover:text-white" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 relative bg-slate-800">
          {/* Skimmer */}
          {loading && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800" />
          )}

          {!loading && url && (
            <iframe
              src={url}
              title="Certificate PDF"
              className="w-full h-full"
            />
          )}
        </div>
      </div>
    </div>
  );
}
