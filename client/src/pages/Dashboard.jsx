import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  const isAdmin = user?.role === "ADMIN";
  const isSuperAdmin = user?.isSuperAdmin;
  const isStaff = user?.role === "STAFF";

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="px-8 py-6 border-b border-slate-700">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
          <span>{user?.name}</span>

        <p className="text-slate-400 text-sm mt-1">
          Institute administration & controls
        </p>
      </header>

      {/* Main Content */}
      <main className="p-8">
        <h2 className="text-xl font-semibold mb-6 text-slate-200">
          Quick Actions
        </h2>

       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

  {/* SUPER ADMIN */}
  {isSuperAdmin && (
    <DashboardCard
      title="Manage Users"
      description="Add, edit, activate or deactivate users"
      link="/admin/users"
      accent="emerald"
    />
  )}

  {/* ADMIN */}
  {isAdmin && (
    <>
      <DashboardCard
        title="Certificate Templates"
        description="Upload and manage certificate templates"
        link="/admin/templates"
        accent="blue"
      />

      <DashboardCard
        title="Issued Certificates"
        description="View and manage all issued certificates"
        link="/admin/certificates"
        accent="violet"
      />
    </>
  )}

  {/* STAFF */}
  {isStaff && (
    <DashboardCard
      title="Issued Certificates"
      description="View certificates issued by you"
      link="/staff/certificates"
      accent="violet"
    />
  )}

  {/* COMMON (ADMIN + STAFF) */}
  {(isAdmin || isStaff) && (
    <DashboardCard
      title="Generate Certificates & Notifications"
      description="Issue certificates for students and manage delivery"
      link="/certificates/issue"
      accent="emerald"
    />
  )}

</div>

      </main>
    </div>
  );
}

function DashboardCard({ title, description, link, accent }) {
  const colors = {
    emerald: "border-emerald-500/40 hover:bg-emerald-500/10",
    blue: "border-blue-500/40 hover:bg-blue-500/10",
    violet: "border-violet-500/40 hover:bg-violet-500/10",
  };

  return (
    <Link
      to={link}
      className={`block rounded-xl border p-6 bg-slate-800 transition ${colors[accent]}`}
    >
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </Link>
  );
}
