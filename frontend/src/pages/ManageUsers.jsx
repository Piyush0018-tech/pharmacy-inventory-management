import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, createUser, updateUser, deleteUser } from "../api";
import "./ManageUsers.css";

const navItems = [
  { label: "Dashboard", icon: "🏠", path: "/dashboard"        },
  { label: "Manage Users",icon: "👥", path: "/manage-users"     },
  { label: "Manage Inventory", icon: "📦", path: "/manage-inventory" },
  { label: "Manage Medicines", icon: "💊", path: "/manage-medicines" },
  { label: "Manage Purchases", icon: "🛒", path: "/manage-purchases" },
  { label: "Process Sales", icon: "💰", path: "/process-sales"    },
  { label: "Payment", icon: "💳", path: "/payment"          },
  { label: "View Reports", icon: "📋", path: "/view-reports"     },
];

const emptyForm = { fullName: "", email: "", role: "Staff", status: "Active", password: "" };

const ManageUsers = () => {
  const navigate = useNavigate();

  const [users, setUsers]  = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal]  = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [editingUser, setEditingUser]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError]  = useState("");
  // Supports modal input validation only:
  const [modalError, setModalError]  = useState(""); 
  const usersPerPage = 8;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      const mapped = res.data.map((u) => ({
        id: u.id,
        fullName: u.full_name,
        email: u.email,
        role: u.role,
        status: u.status,
      }));
      setUsers(mapped);
    } catch (err) {
      setError("Failed to load users.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / usersPerPage);
  const startIndex  = (currentPage - 1) * usersPerPage;
  const currentRows = filtered.slice(startIndex, startIndex + usersPerPage);

  const totalCount = users.length;
  const activeCount = users.filter((u) => u.status === "Active").length;
  const inactiveCount = users.filter((u) => u.status === "Inactive").length;

  const openAddModal = () => {
    setEditingUser(null);
    setFormData(emptyForm);
    setModalError("");
    setError("");
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({ fullName: user.fullName, email: user.email, role: user.role, status: user.status, password: "" });
    setModalError("");
    setError("");
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (modalError) setModalError(""); // clear as user types
  };

  // Validation: Require all fields for add, password only for add, not edit.
  const handleSave = async () => {
    // If adding: require all; if editing: require name/email only
    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      (!editingUser && !formData.password.trim())
    ) {
      setModalError("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      setModalError("");

      if (editingUser) {
        await updateUser(editingUser.id, {
          full_name: formData.fullName,
          email: formData.email,
          role: formData.role,
          status:    formData.status,
        });
      } else {
        await createUser({
          full_name: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          status: formData.status,
        });
      }

      await fetchUsers();
      setShowModal(false);
      setFormData(emptyForm);
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to save user.");
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirm = (user) => {
    setDeleteTarget(user);
    setShowConfirm(true);
  };

  const handleDelete = async () => {
    try {
      await deleteUser(deleteTarget.id);
      await fetchUsers();
      setShowConfirm(false);
      setDeleteTarget(null);
    } catch (err) {
      setError("Failed to delete user.");
      setShowConfirm(false);
    }
  };

  return (
    <div className="manage-users-wrapper">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">💊</div>
          <div>
            <div className="sidebar-logo-name">MediTrack</div>
            <div className="sidebar-logo-sub">Pharmacy Inventory</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`nav-link ${item.path === "/manage-users" ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div className="main-content">
        <header className="top-header">
          <div className="header-left">
            <div className="header-logo-icon">💊</div>
            <div className="header-logo-text">
              <span className="header-logo-title">MediTrack</span>
              <span className="header-logo-sub">Pharmacy Inventory Management</span>
            </div>
          </div>
          <div className="header-right">
            <span className="header-admin-label">Admin</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <div className="manage-users-body">
          <div className="page-title">
            <h1>Manage Users</h1>
            <p>Add, edit, or remove user accounts</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="users-toolbar">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search users by name, email, or role..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <button className="add-user-btn" onClick={openAddModal}>
              + Add New User
            </button>
          </div>

          <div className="users-table-card">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.length > 0 ? (
                  currentRows.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.fullName}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role === "Admin" ? "role-admin" : "role-staff"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.status === "Active" ? "status-active" : "status-inactive"}`}>
                          {user.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="edit-btn" onClick={() => openEditModal(user)}>Edit</button>
                          <button className="delete-btn" onClick={() => openDeleteConfirm(user)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#9ca3af" }}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="table-footer">
              <div className="pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`page-btn ${page === currentPage ? "page-active" : ""}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                {currentPage < totalPages && (
                  <button className="page-arrow" onClick={() => setCurrentPage(currentPage + 1)}>→</button>
                )}
              </div>

              <div className="table-stats">
                <span className="stat-pill stat-pill-blue">Total: {totalCount} users</span>
                <span className="stat-pill stat-pill-green">Active: {activeCount} users</span>
                <span className="stat-pill stat-pill-pink">Inactive: {inactiveCount} users</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editingUser ? "Edit User" : "Add New User"}</h2>

            {/* Modal validation error (required fields) - Always on top of form */}
            {modalError && (
              <div
                style={{
                  background: "#fee2e2",
                  color: "#dc2626",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "13.5px",
                  marginBottom: "14px",
                  textAlign: "center",
                  fontWeight: 500,
                }}
              >
                {modalError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                name="fullName"
                placeholder="Enter full name"
                value={formData.fullName}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                name="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleFormChange}
              />
            </div>

            {/* Password only shown when adding new user */}
            {!editingUser && (
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleFormChange}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" name="role" value={formData.role} onChange={handleFormChange}>
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
                <option value="Customer">Customer</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" name="status" value={formData.status} onChange={handleFormChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="modal-save-btn" onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : editingUser ? "Save Changes" : "Add User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {showConfirm && deleteTarget && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">🗑️</div>
            <h3 className="confirm-title">Delete User</h3>
            <p className="confirm-text">
              Are you sure you want to delete <strong>{deleteTarget.fullName}</strong>?<br />
              This action cannot be undone.
            </p>
            <div className="confirm-actions">
              <button className="confirm-cancel-btn" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="confirm-delete-btn" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;