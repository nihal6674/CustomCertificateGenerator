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
  email: "",
  className: "",
  trainingDate: "",
});


  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTemplates, setFetchingTemplates] = useState(true);
  const steps = [
  "Validating details",
  "Generating certificate",
  "Uploading document",
  "Finalizing",
];

const [activeStep, setActiveStep] = useState(0);

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
  setActiveStep(0); // Step 1: Validating

  try {
    // STEP 1 → STEP 2 (quick)
    await new Promise((r) => setTimeout(r, 400));
    setActiveStep(1); // Generating certificate

    // STEP 2 → STEP 3 (slow)
    await new Promise((r) => setTimeout(r, 900));
    setActiveStep(2); // Uploading document

    // STEP 3 → STEP 4 (medium)
    await new Promise((r) => setTimeout(r, 1800));
    setActiveStep(3); // Finalizing

    // 🔥 REAL BACKEND CALL (no fake delay here)
    await issueSingleCertificate(form);

    // ✅ Success — stay on final step
    toast.success("Certificate issued successfully");

    setForm({
      firstName: "",
      middleName: "",
      lastName: "",
      className: "",
      trainingDate: "",
        email: "",

    });
  } catch (err) {
    toast.error(err.message || "Failed to issue certificate");
    setActiveStep(0); // reset
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
      {/* Email */}
<Input
  label="Email Address"
  type="email"
  value={form.email}
  onChange={(v) => handleChange("email", v)}
  required
/>
<p className="text-xs text-slate-500 mt-1">
  Certificate download link will be sent to this email.
</p>



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

      {loading && (
  <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
    {/* CIRCLES + LINES */}
    <div className="flex items-center">
      {steps.map((step, index) => {
        const isDone = index < activeStep;
        const isActive = index === activeStep;

        const colors = [
          "bg-blue-500",
          "bg-yellow-500",
          "bg-orange-500",
          "bg-emerald-500",
        ];

        return (
          <div key={step} className="flex items-center flex-1">
            {/* CIRCLE */}
            <div
              className={`w-4 h-4 rounded-full z-10 transition-all
                ${
                  isDone || isActive
                    ? colors[index]
                    : "bg-slate-600"
                }
                ${isActive ? "animate-pulse scale-110" : ""}
              `}
            />

            {/* LINE (except after last circle) */}
            {index !== steps.length - 1 && (
              <div className="flex-1 mx-2">
                <div className="h-0.5 bg-slate-700 relative overflow-hidden">
                  <div
                    className="h-0.5 bg-emerald-500 transition-all duration-700"
                    style={{
                      width:
                        index < activeStep
                          ? "100%"
                          : "0%",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>

    {/* LABELS */}
    <div className="flex justify-between mt-3 text-xs">
      {steps.map((step, index) => (
        <div
          key={step}
          className={`flex-1 text-center transition ${
            index < activeStep
              ? "text-emerald-400"
              : index === activeStep
              ? "text-white font-medium"
              : "text-slate-500"
          }`}
        >
          {step}
        </div>
      ))}
    </div>
  </div>
)}




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