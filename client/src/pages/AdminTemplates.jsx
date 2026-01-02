import { useEffect, useState } from "react";
import {
  getTemplates,
  createTemplate,
  toggleTemplateStatus,
  updateTemplate,
} from "../api/templates";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Plus, Pencil ,Power } from "lucide-react";

export default function AdminTemplates() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- CREATE TEMPLATE ---------- */
  const handleCreateTemplate = async () => {
    const {
      templateName,
      className,
      instructorName,
      templateFile,
      signatureFile,
    } = createForm;

    if (
      !templateName ||
      !className ||
      !instructorName ||
      !templateFile ||
      !signatureFile
    ) {
      toast.error("All fields are required");
      return;
    }

    const fd = new FormData();
    fd.append("templateName", templateName);
    fd.append("className", className);
    fd.append("instructorName", instructorName);
    fd.append("template", templateFile);
    fd.append("signature", signatureFile);

    const t = toast.loading("Creating template...");
    try {
      await createTemplate(fd);
      toast.success("Template created successfully", { id: t });
      setShowAdd(false);
      setCreateForm({
        templateName: "",
        className: "",
        instructorName: "",
        templateFile: null,
        signatureFile: null,
      });
      loadTemplates();
    } catch (err) {
      toast.error(err.message || "Failed to create template", { id: t });
    }
  };

  /* ---------- TOGGLE STATUS ---------- */
  const handleToggleStatus = async (template) => {
    if (!isAdmin) {
      toast.error("Not authorized");
      return;
    }

    const t = toast.loading("Updating template status...");
    try {
      await toggleTemplateStatus(template._id);
      toast.success("Template status updated", { id: t });
      loadTemplates();
    } catch (err) {
      toast.error(err.message || "Failed to update status", { id: t });
    }
  };

  /* ---------- EDIT TEMPLATE ---------- */
  const openEdit = (t) => {
    setEditTemplateObj(t);
    setEditForm({
      templateName: t.templateName || "",
      className: t.className || "",
      instructorName: t.instructorName || "",
      templateFile: null,
      signatureFile: null,
    });
    setShowEdit(true);
  };

  const handleEditTemplate = async () => {
    if (!editTemplateObj) return;

    const fd = new FormData();

    if (editForm.templateName)
      fd.append("templateName", editForm.templateName);
    if (editForm.className) fd.append("className", editForm.className);
    if (editForm.instructorName)
      fd.append("instructorName", editForm.instructorName);
    if (editForm.templateFile)
      fd.append("template", editForm.templateFile);
    if (editForm.signatureFile)
      fd.append("signature", editForm.signatureFile);

    if ([...fd.keys()].length === 0) {
      toast.error("No changes made");
      return;
    }

    const t = toast.loading("Updating template...");
    try {
      await updateTemplate(editTemplateObj._id, fd);
      toast.success("Template updated", { id: t });
      setShowEdit(false);
      setEditTemplateObj(null);
      loadTemplates();
    } catch (err) {
      toast.error(err.message || "Update failed", { id: t });
    }
  };

  if (loading) {
    return <div className="p-8 text-white">Loading templates…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Certificate Templates</h1>

        {isAdmin && (
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded font-medium"
          >
            <Plus size={16} />
            Create Template
          </button>
        )}
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="min-w-full bg-slate-800">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-4 py-3 text-left">Template Name</th>
              <th className="px-4 py-3 text-left">Class</th>
              <th className="px-4 py-3 text-left">Instructor</th>
              <th className="px-4 py-3 text-center">Template</th>
              <th className="px-4 py-3 text-center">Signature</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
              <th className="px-4 py-3 text-left">Created</th>
            </tr>
          </thead>

          <tbody>
            {templates.map((t) => (
              <tr
                key={t._id}
                className="border-t border-slate-700 hover:bg-slate-700/40"
              >
                <td className="px-4 py-3 font-medium">{t.templateName}</td>
                <td className="px-4 py-3">{t.className}</td>
                <td className="px-4 py-3">{t.instructorName}</td>

                {/* TEMPLATE FILE */}
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-1 rounded text-sm bg-blue-500/20 text-blue-400">
                    DOCX
                  </span>
                </td>

                {/* SIGNATURE */}
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-1 rounded text-sm bg-violet-500/20 text-violet-400">
                    Image
                  </span>
                </td>

                {/* STATUS */}
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

                {/* ACTIONS */}
                <td className="px-4 py-3 text-center space-x-2">
                  {isAdmin ? (
                    <>
                      <button
  onClick={() => openEdit(t)}
  className="inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium bg-slate-600 hover:bg-slate-500"
>
  <Pencil size={14} />
  Edit
</button>



<button
  onClick={() => handleToggleStatus(t)}
  className={`inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium ${
    t.active
      ? "bg-red-500 hover:bg-red-600"
      : "bg-emerald-500 hover:bg-emerald-600"
  }`}
>
  <Power size={14} />
  {t.active ? "Disable" : "Enable"}
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
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-xl w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Create Template</h2>

            <input
              className="w-full mb-3 p-2 rounded bg-slate-700"
              placeholder="Template Name"
              value={createForm.templateName}
              onChange={(e) =>
                setCreateForm({ ...createForm, templateName: e.target.value })
              }
            />

            <input
              className="w-full mb-3 p-2 rounded bg-slate-700"
              placeholder="Class Name"
              value={createForm.className}
              onChange={(e) =>
                setCreateForm({ ...createForm, className: e.target.value })
              }
            />

            <input
              className="w-full mb-3 p-2 rounded bg-slate-700"
              placeholder="Instructor Name"
              value={createForm.instructorName}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  instructorName: e.target.value,
                })
              }
            />

            <input
              type="file"
              className="w-full mb-3"
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  templateFile: e.target.files[0],
                })
              }
            />

            <input
              type="file"
              className="w-full mb-4"
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  signatureFile: e.target.files[0],
                })
              }
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 bg-slate-600 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                className="px-4 py-2 bg-emerald-500 rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-xl w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Edit Template</h2>

            <input
              className="w-full mb-3 p-2 rounded bg-slate-700"
              placeholder="Template Name"
              value={editForm.templateName}
              onChange={(e) =>
                setEditForm({ ...editForm, templateName: e.target.value })
              }
            />

            <input
              className="w-full mb-3 p-2 rounded bg-slate-700"
              placeholder="Class Name"
              value={editForm.className}
              onChange={(e) =>
                setEditForm({ ...editForm, className: e.target.value })
              }
            />

            <input
              className="w-full mb-3 p-2 rounded bg-slate-700"
              placeholder="Instructor Name"
              value={editForm.instructorName}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  instructorName: e.target.value,
                })
              }
            />

            <input
              type="file"
              className="w-full mb-3"
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  templateFile: e.target.files[0],
                })
              }
            />

            <input
              type="file"
              className="w-full mb-4"
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  signatureFile: e.target.files[0],
                })
              }
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 bg-slate-600 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleEditTemplate}
                className="px-4 py-2 bg-emerald-500 rounded"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
