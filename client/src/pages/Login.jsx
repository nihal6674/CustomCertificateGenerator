import { useState } from "react";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png"; // adjust path if needed

export default function Login() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errors = {};
    if (!email.trim()) errors.email = "Email is required";
    if (!password.trim()) errors.password = "Password is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await login(email, password);
      setUser(data.user);
      data.user.role === "ADMIN" ? navigate("/admin") : navigate("/staff");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-5xl bg-slate-800 rounded-2xl shadow-2xl overflow-hidden grid md:grid-cols-2">

        {/* LEFT – FULL LOGO */}
        <div className="hidden md:block w-full h-full">
          <img
            src={logo}
            alt="Company Logo"
            className="w-full h-full object-contain bg-slate-900"
          />
        </div>

        {/* RIGHT – LOGIN FORM */}
        <form
          onSubmit={handleSubmit}
          className="p-8 sm:p-10 flex flex-col justify-center"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Sign in</h1>
          <p className="text-slate-400 mb-6">
            Enter your credentials to continue
          </p>

          {error && (
            <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* EMAIL */}
          <div className="mb-4">
            <input
              type="email"
              className={`w-full p-3 rounded-lg bg-slate-700 text-white outline-none border ${
                fieldErrors.email
                  ? "border-red-500"
                  : "border-transparent focus:border-emerald-500"
              }`}
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-400 mt-1">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* PASSWORD */}
          <div className="mb-6">
            <input
              type="password"
              className={`w-full p-3 rounded-lg bg-slate-700 text-white outline-none border ${
                fieldErrors.password
                  ? "border-red-500"
                  : "border-transparent focus:border-emerald-500"
              }`}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {fieldErrors.password && (
              <p className="text-xs text-red-400 mt-1">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 transition p-3 rounded-lg font-semibold text-slate-900"
          >
            {loading ? "Signing in…" : "Login"}
          </button>

          <p className="text-xs text-slate-500 mt-6 text-center">
            © {new Date().getFullYear()} Your Company. All rights reserved.
          </p>
        </form>
      </div>
    </div>
  );
}
