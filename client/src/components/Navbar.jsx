import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LogoutButton from "./LogoutButton";
import { ShieldCheck } from "lucide-react";
import logo from "../assets/logo.png";

export default function Navbar() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <nav className="fixed top-0 left-0 w-full z-20 bg-slate-800 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        
        {/* LEFT — Logo */}
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="Logo"
            className="h-11 w-11 rounded bg-slate-900 p-1 object-contain"
          />
          <span className="text-lg font-semibold text-white">
            The Loss Prevention Group Inc.
          </span>
        </div>

        {/* CENTER — Navigation */}
        <div className="flex items-center gap-6">

  {/* DASHBOARD (ADMIN + STAFF) */}
  <NavLink to="/dashboard" end className={navClass}>
    Dashboard
  </NavLink>

  {/* ISSUE CERTIFICATES (ADMIN + STAFF) */}
  <NavLink to="/certificates/issue" className={navClass}>
    Issue / Bulk Issue
  </NavLink>

  {/* ADMIN NAV */}
  {user.role === "ADMIN" && (
    <>
      {user.isSuperAdmin && (
        <NavLink to="/admin/users" className={navClass}>
          Users
        </NavLink>
      )}

      <NavLink to="/admin/templates" className={navClass}>
        Templates
      </NavLink>

      <NavLink to="/admin/certificates" className={navClass}>
        Issued Certificates
      </NavLink>
    </>
  )}

  {/* STAFF NAV */}
  {user.role === "STAFF" && (
    <>
      <NavLink to="/staff/certificates" className={navClass}>
        Issued Certificates
      </NavLink>
    </>
  )}

</div>


        {/* RIGHT — User + Logout */}
        <div className="flex items-center gap-4">
          {user.isSuperAdmin && (
            <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded bg-violet-500/20 text-violet-400">
              <ShieldCheck size={14} />
              Super Admin
            </span>
          )}

          <span className="text-slate-300 text-sm">
            {user?.name}
          </span>

          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}

/* ---------------- NAV LINK STYLE ---------------- */

function navClass({ isActive }) {
  return `text-sm font-medium transition ${
    isActive
      ? "text-emerald-400"
      : "text-slate-300 hover:text-white"
  }`;
}
