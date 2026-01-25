import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Login from "./pages/Login";
import VerifyCertificate from "./pages/public/VerifyCertificate";
// import AdminDashboard from "./pages/AdminDashboard";
// import StaffDashboard from "./pages/Staff/StaffDashboard";

import Dashboard from "./pages/Dashboard";

import AdminUsers from "./pages/AdminUsers";
import AdminTemplates from "./pages/AdminTemplates";
import AdminIssuedCertificates from "./pages/AdminIssuedCertificates";

import PublicRoute from "./components/PublicRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import { Toaster } from "react-hot-toast";
import CertificateDownloadPage from "./pages/public/CertificateDownloadPage";
import StaffCertificatesPage from "./pages/Staff/StaffCertificatesPage";
import StaffIssuePage from "./pages/Staff/StaffIssuePage";

/* ---------- Layout with Navbar ---------- */
function AppLayout() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#0f172a", // slate-900
            color: "#fff",
            border: "1px solid #334155", // slate-700
          },
        }}
      />
      <Navbar />
      <div className="pt-[72px]">
        <Outlet />
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* PUBLIC */}
<Route
  path="/login"
  element={
    <PublicRoute>
      <Login />
    </PublicRoute>
  }
/>
          {/* ✅ PUBLIC CERTIFICATE VERIFICATION */}
          <Route
            path="/verify/:certificateNumber"
            element={<VerifyCertificate />}
          />
          <Route
            path="/certificate/download"
            element={<CertificateDownloadPage />}
          />
          {/* SHARED DASHBOARD (ADMIN + STAFF) */}
          <Route
            element={
              <ProtectedRoute roles={["ADMIN", "STAFF"]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* ADMIN */}
          <Route
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/templates" element={<AdminTemplates />} />
            <Route
              path="/admin/certificates"
              element={<AdminIssuedCertificates />}
            />
          </Route>

          {/* STAFF */}
          <Route
            element={
              <ProtectedRoute roles={["STAFF","ADMIN"]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/staff/certificates"
              element={<StaffCertificatesPage />}
            />
<Route path="/certificates/issue" element={<StaffIssuePage />} />
          </Route>
            {/* ROOT REDIRECT */}
<Route path="/" element={<Navigate to="/dashboard" replace />} />
          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
