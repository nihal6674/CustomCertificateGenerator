import IssueTabs from "../../components/staff/issue/IssueTabs";

export default function StaffIssuePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="px-8 py-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold">Issue Certificate</h1>
        <p className="text-slate-400 text-sm mt-1">
          Single or bulk certificate issuance
        </p>
      </header>

      <div className="p-8 max-w-4xl">
        <IssueTabs />
      </div>
    </div>
  );
}
