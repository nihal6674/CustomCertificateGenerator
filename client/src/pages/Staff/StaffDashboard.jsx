import DashboardCard from "../../components/staff/DashboardCard";
import { useAuth } from "../../context/AuthContext";

export default function StaffDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="px-8 py-6 border-b border-slate-700">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <span className="text-slate-300">{user?.name}</span>
        <p className="text-slate-400 text-sm mt-1">
          Certificate operations
        </p>
      </header>

      {/* Main */}
      <main className="p-8">
        <h2 className="text-xl font-semibold mb-6 text-slate-200">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCard
            title="Issued Certificates"
            description="View certificates issued by you"
            link="/staff/certificates"
            accent="violet"
          />

          <DashboardCard
            title="Allot / Generate Certificate"
            description="Generate certificates for students"
            link="/staff/issue"
            accent="emerald"
          />
        </div>
      </main>
    </div>
  );
}
