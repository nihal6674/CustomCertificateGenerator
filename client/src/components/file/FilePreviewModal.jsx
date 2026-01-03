import { useState } from "react";
import { X } from "lucide-react";

export default function FilePreviewModal({ preview, onClose }) {
  const [loaded, setLoaded] = useState(false);

  if (!preview) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="font-semibold text-white">
            {preview.title}
          </h3>
          <button onClick={onClose}>
            <X className="text-slate-400 hover:text-white" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 relative bg-slate-800">
          
          {/* SKIMMER */}
          {!loaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800" />
          )}

          {/* IMAGE */}
          {preview.type === "image" && (
            <img
              src={preview.url}
              alt="Preview"
              onLoad={() => setLoaded(true)}
              className="max-h-full max-w-full mx-auto p-6 relative z-10"
            />
          )}

          {/* PDF */}
          {preview.type === "pdf" && (
            <iframe
              src={preview.url}
              title="PDF Preview"
              onLoad={() => setLoaded(true)}
              className="w-full h-full relative z-10"
            />
          )}
        </div>
      </div>
    </div>
  );
}
