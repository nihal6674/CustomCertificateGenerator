import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/Staff/StaffDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminTemplates from "./pages/AdminTemplates";
import AdminIssuedCertificates from "./pages/AdminIssuedCertificates";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import { Toaster } from "react-hot-toast";
 
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
          <Route path="/login" element={<Login />} />

          {/* ADMIN */}
          <Route
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
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
              <ProtectedRoute roles={["STAFF"]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/staff" element={<StaffDashboard />} />
            <Route
              path="/staff/certificates"
              element={<StaffCertificatesPage />}
            />
            <Route path="/staff/issue" element={<StaffIssuePage />} />
          </Route>

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
