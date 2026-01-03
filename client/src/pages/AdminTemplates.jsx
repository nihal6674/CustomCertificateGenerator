import { useEffect, useState, memo } from "react";
import {
  getTemplates,
  createTemplate,
  toggleTemplateStatus,
  updateTemplate,
} from "../api/templates";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Plus, Pencil, Power } from "lucide-react";
import { viewFile } from "../api/file"; // ✅ REQUIRED

/* ================= MEMOIZED ROW ================= */
const TemplateRow = memo(function TemplateRow({
  t,
  isAdmin,
  onEdit,
  onToggle,
  onView, // ✅ REQUIRED
}) {
  return (
    <tr className="border-t border-slate-700 hover:bg-slate-700/40">
      <td
  className="px-4 py-3 font-medium max-w-[220px] truncate"
  title={t.templateName}
>
  {t.templateName}
</td>

      <td className="px-4 py-3">{t.className}</td>
      <td className="px-4 py-3">{t.instructorName}</td>

      <td className="px-4 py-3 text-center">
        <span className="px-2 py-1 rounded text-sm bg-blue-500/20 text-blue-400">
          DOCX
        </span>
      </td>

      <td className="px-4 py-3 text-center">
        <span className="px-2 py-1 rounded text-sm bg-violet-500/20 text-violet-400">
          Image
        </span>
      </td>

      <td className="px-4 py-3 text-center">
        <span
          className={`px-2 py-1 rounded text-sm ${
            t.active
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {t.active ? "Active" : "Inactive"}
        </span>
      </td>

<td className="px-4 py-3 text-center space-x-2 whitespace-nowrap">
        {isAdmin ? (
          <>
            <button
              onClick={() => onEdit(t)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded text-sm bg-slate-600 hover:bg-slate-500"
            >
              <Pencil size={14} /> Edit
            </button>

            <button
              onClick={() => onToggle(t)}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded text-sm ${
                t.active
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-emerald-500 hover:bg-emerald-600"
              }`}
            >
              <Power size={14} />
              {t.active ? "Disable" : "Enable"}
            </button>

            <button
              onClick={() => onView(t.templateFilePath, "docx", "Template")}
              className="px-3 py-1 rounded text-sm bg-blue-600 hover:bg-blue-700"
            >
              View Template
            </button>

            <button
              onClick={() =>
                onView(t.instructorSignaturePath, "image", "Signature")
              }
              className="px-3 py-1 rounded text-sm bg-violet-600 hover:bg-violet-700"
            >
              View Signature
            </button>
          </>
        ) : (
          <span className="text-slate-500 text-sm">Not allowed</span>
        )}
      </td>

      <td className="px-4 py-3 text-sm text-slate-400">
        {new Date(t.createdAt).toLocaleDateString()}
      </td>
    </tr>
  );
});

/* ================= MAIN COMPONENT ================= */
export default function AdminTemplates() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔹 PREVIEW STATE
  const [preview, setPreview] = useState(null);
  // { title, type, url }

  /* ---------- CREATE ---------- */
  const [showAdd, setShowAdd] = useState(false);
  const [createForm, setCreateForm] = useState({
    templateName: "",
    className: "",
    instructorName: "",
    templateFile: null,
    signatureFile: null,
  });

  /* ---------- EDIT ---------- */
  const [showEdit, setShowEdit] = useState(false);
  const [editTemplateObj, setEditTemplateObj] = useState(null);
  const [editForm, setEditForm] = useState({
    templateName: "",
    className: "",
    instructorName: "",
    templateFile: null,
    signatureFile: null,
  });

  /* ---------- LOAD ---------- */
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- VIEW FILE (CENTRAL) ---------- */
  const handleView = async (key, type, title) => {
    try {
      const url = await viewFile(key);
      setPreview({ url, type, title });
    } catch {
      toast.error("Failed to load file");
    }
  };

  /* ---------- CREATE ---------- */
  const handleCreateTemplate = async () => {
  const fd = new FormData();
  Object.entries(createForm).forEach(([k, v]) =>
    v &&
    fd.append(
      k === "templateFile"
        ? "template"
        : k === "signatureFile"
        ? "signature"
        : k,
      v
    )
  );

  const t = toast.loading("Creating template...");
  try {
    await createTemplate(fd);
    toast.success("Template created", { id: t });
    setShowAdd(false);
    setCreateForm({
      templateName: "",
      className: "",
      instructorName: "",
      templateFile: null,
      signatureFile: null,
    });

    await loadTemplates(); // ✅ THIS FIXES EVERYTHING
  } catch {
    toast.error("Failed", { id: t });
  }
};


  /* ---------- TOGGLE ---------- */
const handleToggleStatus = async (template) => {
  const toastId = toast.loading("Updating status...");

  // optimistic UI update
  setTemplates((prev) =>
    prev.map((t) =>
      t._id === template._id
        ? { ...t, active: !t.active }
        : t
    )
  );

  try {
    await toggleTemplateStatus(template._id); // backend call
    toast.success("Status updated", { id: toastId });
  } catch {
    // rollback UI
    setTemplates((prev) =>
      prev.map((t) =>
        t._id === template._id ? template : t
      )
    );
    toast.error("Failed to update status", { id: toastId });
  }
};


  /* ---------- EDIT ---------- */
  const openEdit = (t) => {
    setEditTemplateObj(t);
    setEditForm({
      templateName: t.templateName,
      className: t.className,
      instructorName: t.instructorName,
      templateFile: null,
      signatureFile: null,
    });
    setShowEdit(true);
  };

  const handleEditTemplate = async () => {
    const fd = new FormData();
    Object.entries(editForm).forEach(
      ([k, v]) =>
        v &&
        fd.append(
          k === "templateFile"
            ? "template"
            : k === "signatureFile"
            ? "signature"
            : k,
          v
        )
    );

    const t = toast.loading("Updating template...");
    try {
      const updated = await updateTemplate(editTemplateObj._id, fd);
      setTemplates((prev) =>
        prev.map((x) =>
          x._id === editTemplateObj._id ? { ...x, ...updated } : x
        )
      );
      toast.success("Template updated", { id: t });
      setShowEdit(false);
    } catch {
      toast.error("Update failed", { id: t });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Certificate Templates</h1>
        {isAdmin && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-emerald-500 px-4 py-2 rounded"
          >
            <Plus size={16} /> Create Template
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="min-w-full bg-slate-800">
          <thead className="bg-slate-700 text-sm">
            <tr>
              <th className="px-4 py-3 text-left">Template</th>
              <th className="px-4 py-3 text-left">Class</th>
              <th className="px-4 py-3 text-left">Instructor</th>
              <th className="px-4 py-3 text-center">File</th>
              <th className="px-4 py-3 text-center">Signature</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
              <th className="px-4 py-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <TemplateRow
                key={t._id}
                t={t}
                isAdmin={isAdmin}
                onEdit={openEdit}
                onToggle={handleToggleStatus}
                onView={handleView} // ✅ PASSED
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* PREVIEW MODAL */}
      {preview && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl w-[90vw] h-[85vh] p-4">
            <div className="flex justify-between mb-3">
              <h2 className="font-bold">{preview.title}</h2>
              <button onClick={() => setPreview(null)}>✕</button>
            </div>

            {preview.type === "image" && (
              <img src={preview.url} className="max-h-full mx-auto" alt="" />
            )}

            {preview.type !== "image" && (
              <iframe
                src={preview.url}
                className="w-full h-full rounded"
                title="viewer"
              />
            )}
          </div>
        </div>
      )}

      {/* CREATE + EDIT MODALS (UNCHANGED) */}
      {showAdd && (
        <Modal
          title="Create Template"
          onClose={() => setShowAdd(false)}
          onSubmit={handleCreateTemplate}
          form={createForm}
          setForm={setCreateForm}
        />
      )}

      {showEdit && (
        <Modal
          title="Edit Template"
          onClose={() => setShowEdit(false)}
          onSubmit={handleEditTemplate}
          form={editForm}
          setForm={setEditForm}
        />
      )}
    </div>
  );
}

/* ================= SHARED MODAL ================= */
function Modal({ title, onClose, onSubmit, form, setForm }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-6 rounded-xl w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">{title}</h2>

        {["templateName", "className", "instructorName"].map((f) => (
          <input
            key={f}
            className="w-full mb-3 p-2 rounded bg-slate-700"
            value={form[f]}
            onChange={(e) => setForm({ ...form, [f]: e.target.value })}
          />
        ))}

        <input
          type="file"
          className="w-full mb-3"
          onChange={(e) =>
            setForm({ ...form, templateFile: e.target.files[0] })
          }
        />
        <input
          type="file"
          className="w-full mb-4"
          onChange={(e) =>
            setForm({ ...form, signatureFile: e.target.files[0] })
          }
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-slate-600 rounded">
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-emerald-500 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
