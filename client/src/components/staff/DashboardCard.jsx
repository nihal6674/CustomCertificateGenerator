import { Link } from "react-router-dom";

export default function DashboardCard({ title, description, link, accent }) {
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
