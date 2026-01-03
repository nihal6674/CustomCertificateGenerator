import { useEffect, useState } from "react";
import {
  getUsers,
  toggleUserStatus,
  createUser,
  updateUser,
} from "../api/user";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Lock, Plus } from "lucide-react";

export default function AdminUsers() {
  const { user } = useAuth();
  const isSuperAdmin = user?.isSuperAdmin;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------- ADD USER ---------- */
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF",
  });

  /* ---------- EDIT USER ---------- */
  const [showEdit, setShowEdit] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "STAFF",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- CREATE ---------- */
  const handleCreateUser = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("All fields are required");
      return;
    }

    const t = toast.loading("Creating user...");
    try {
      await createUser(form);
      toast.success("User created successfully", { id: t });
      setShowAdd(false);
      setForm({ name: "", email: "", password: "", role: "STAFF" });
      loadUsers();
    } catch (err) {
      toast.error(err.message || "Failed to create user", { id: t });
    }
  };

  /* ---------- EDIT ---------- */
  const openEdit = (u) => {
    if (u.isSuperAdmin) {
      toast.error("Super Admin cannot be edited");
      return;
    }

    setEditUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
    });
    setShowEdit(true);
  };

  const handleEditUser = async () => {
    if (!editUser) return;

    const payload = {};
    if (editForm.name !== editUser.name) payload.name = editForm.name;
    if (editForm.email !== editUser.email) payload.email = editForm.email;
    if (editForm.role !== editUser.role) payload.role = editForm.role;

    if (Object.keys(payload).length === 0) {
      toast.error("No changes made");
      return;
    }

    const t = toast.loading("Updating user...");
    try {
      await updateUser(editUser._id, payload);
      toast.success("User updated", { id: t });
      setShowEdit(false);
      setEditUser(null);
      loadUsers();
    } catch (err) {
      toast.error(err.message || "Failed to update user", { id: t });
    }
  };

  /* ---------- STATUS ---------- */
  const handleToggleStatus = async (targetUser) => {
    if (!isSuperAdmin) return toast.error("Not authorized");
    if (targetUser.isSuperAdmin)
      return toast.error("Super Admin cannot be revoked");

    const t = toast.loading("Updating status...");
    try {
      await toggleUserStatus(targetUser._id);
      toast.success("User status updated", { id: t });
      loadUsers();
    } catch (err) {
      toast.error(err.message || "Action failed", { id: t });
    }
  };

  /* ---------- ROLE ---------- */
  const handleRoleChange = async (targetUser, newRole) => {
    if (!isSuperAdmin) return toast.error("Only Super Admin can change roles");
    if (targetUser.isSuperAdmin)
      return toast.error("Super Admin role cannot be changed");
    if (targetUser.role === newRole) return;

    const t = toast.loading("Updating role...");
    try {
      await updateUserRole(targetUser._id, newRole);
      toast.success("Role updated", { id: t });
      loadUsers();
    } catch (err) {
      toast.error(err.message || "Failed to update role", { id: t });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="min-w-full bg-slate-800">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-center">Role</th>
              <th className="px-4 py-3 text-center">Super Admin</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-slate-400">
                  Loading users…
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="border-t border-slate-700">
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${
                        u.role === "ADMIN"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    {u.isSuperAdmin ? (
                      <span className="inline-flex items-center gap-1 text-violet-400">
                        <Lock size={14} /> Yes
                      </span>
                    ) : (
                      "No"
                    )}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${
                        u.active
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {u.active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center space-x-2">
                    {isSuperAdmin && !u.isSuperAdmin ? (
                      <>
                        <button
                          onClick={() => openEdit(u)}
                          className="px-3 py-1 rounded bg-slate-600 hover:bg-slate-500 text-sm"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-3 py-1 rounded text-sm ${
                            u.active
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-emerald-500 hover:bg-emerald-600"
                          }`}
                        >
                          {u.active ? "Revoke" : "Activate"}
                        </button>
                      </>
                    ) : (
                      <span className="text-slate-500 text-sm">Protected</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD USER BUTTON */}
      {isSuperAdmin && (
        <div className="mt-6">
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded font-medium"
          >
            <Plus size={16} />
            Add User
          </button>
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New User</h2>

            <input
              className="w-full mb-3 p-2 rounded bg-slate-700"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              className="w-full mb-3 p-2 rounded bg-slate-700"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
              type="password"
              className="w-full mb-3 p-2 rounded bg-slate-700"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <select
              className="w-full mb-4 p-2 rounded bg-slate-700"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="STAFF">STAFF</option>
              <option value="ADMIN">ADMIN</option>
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 bg-slate-600 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-emerald-500 rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-slate-800 p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>

            <input
              className="w-full mb-3 p-2 rounded bg-slate-700"
              placeholder="Name"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
            />

            <input
              className="w-full mb-3 p-2 rounded bg-slate-700"
              placeholder="Email"
              value={editForm.email}
              onChange={(e) =>
                setEditForm({ ...editForm, email: e.target.value })
              }
            />

            <select
              className="w-full mb-4 p-2 rounded bg-slate-700"
              value={editForm.role}
              onChange={(e) =>
                setEditForm({ ...editForm, role: e.target.value })
              }
            >
              <option value="ADMIN">ADMIN</option>
              <option value="STAFF">STAFF</option>
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 bg-slate-600 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleEditUser}
                className="px-4 py-2 bg-emerald-500 rounded"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
