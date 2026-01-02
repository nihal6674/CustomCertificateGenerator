import { logout } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();          // clear cookie on backend
    } finally {
      setUser(null);           // clear frontend state
      navigate("/login");      // redirect
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition text-white font-medium"
    >
      Logout
    </button>
  );
}
