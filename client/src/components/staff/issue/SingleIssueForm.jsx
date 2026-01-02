import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { issueSingleCertificate } from "../../../api/certificate";
import { getActiveTemplates } from "../../../api/templates";
import toast from "react-hot-toast";

export default function SingleIssueForm() {
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    className: "",
    trainingDate: "",
  });

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTemplates, setFetchingTemplates] = useState(true);

  /* ---------- FETCH ACTIVE TEMPLATES ---------- */
  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await getActiveTemplates();
        setTemplates(res.templates || []);
      } catch (err) {
        toast.error(err.message || "Unable to load templates");
      } finally {
        setFetchingTemplates(false);
      }
    }

    loadTemplates();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await issueSingleCertificate(form);
      toast.success("Certificate issued successfully");

      setForm({
        firstName: "",
        middleName: "",
        lastName: "",
        className: "",
        trainingDate: "",
      });
    } catch (err) {
      toast.error(err.message || "Failed to issue certificate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-5"
    >
      {/* First Name */}
      <Input
        label="First Name"
        value={form.firstName}
        onChange={(v) => handleChange("firstName", v)}
        required
      />

      {/* Middle Name (Optional) */}
      <Input
        label="Middle Name (Optional)"
        value={form.middleName}
        onChange={(v) => handleChange("middleName", v)}
        required={false}
      />

      {/* Last Name */}
      <Input
        label="Last Name"
        value={form.lastName}
        onChange={(v) => handleChange("lastName", v)}
        required
      />

      {/* Class Name */}
      <div>
        <label className="block text-sm text-slate-400 mb-1">
          Class Name
        </label>
        <select
          value={form.className}
          onChange={(e) => handleChange("className", e.target.value)}
          required
          disabled={fetchingTemplates}
          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
        >
          <option value="">
            {fetchingTemplates ? "Loading classes..." : "Select class"}
          </option>

          {templates.map((t) => (
            <option key={t._id} value={t.className}>
              {t.className}
            </option>
          ))}
        </select>
      </div>

      {/* Training Date */}
      <Input
        label="Training Date"
        type="date"
        value={form.trainingDate}
        onChange={(v) => handleChange("trainingDate", v)}
        required
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || fetchingTemplates}
        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60
          px-4 py-2 rounded font-medium transition"
      >
        {loading ? "Issuing…" : "Issue Certificate"}
      </button>
    </form>
  );
}

/* ---------- INPUT COMPONENT ---------- */
function Input({
  label,
  value,
  onChange,
  type = "text",
  required = true,
}) {
  const isDate = type === "date";

  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1">
        {label}
      </label>

      <div className="relative">
        <input
          type={type}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => {
            if (isDate && e.target.showPicker) {
              e.target.showPicker();
            }
          }}
          className={`w-full bg-slate-900 border border-slate-700 rounded
            px-3 py-2 pr-10 text-white focus:outline-none
            focus:ring-2 focus:ring-emerald-500/40
            ${
              isDate
                ? "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0"
                : ""
            }`}
        />

        {isDate && (
          <Calendar
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2
              text-slate-400 pointer-events-none"
          />
        )}
      </div>
    </div>
  );
}