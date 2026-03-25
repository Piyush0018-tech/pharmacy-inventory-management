import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManageUsers.css";

// Manage Users page — MediTrack Pharmacy System
// Features: search, add, edit, delete users with modal forms

// Initial sample user data
const initialUsers = [
  { id: "001", fullName: "John Doe",        email: "john.doe@pharmacy.com",       role: "Admin", status: "Active"   },
  { id: "002", fullName: "Sarah Smith",     email: "sarah.smith@pharmacy.com",    role: "Staff", status: "Active"   },
  { id: "003", fullName: "Michael Johnson", email: "michael.j@pharmacy.com",      role: "Staff", status: "Active"   },
  { id: "004", fullName: "Emily Davis",     email: "emily.davis@pharmacy.com",    role: "Admin", status: "Inactive" },
  { id: "005", fullName: "David Wilson",    email: "david.wilson@pharmacy.com",   role: "Staff", status: "Active"   },
  { id: "006", fullName: "Lisa Anderson",   email: "lisa.anderson@pharmacy.com",  role: "Staff", status: "Active"   },
  { id: "007", fullName: "Robert Taylor",   email: "robert.taylor@pharmacy.com",  role: "Staff", status: "Active"   },
  { id: "008", fullName: "Jennifer Martinez", email: "jennifer.m@pharmacy.com",   role: "Admin", status: "Active"   },
];

// Sidebar nav items — same across all pages
const navItems = [
  { label: "Dashboard",        icon: "🏠", path: "/dashboard"        },
  { label: "Manage Users",     icon: "👥", path: "/manage-users"     },
  { label: "Manage Inventory", icon: "📦", path: "/manage-inventory" },
  { label: "Manage Medicines", icon: "💊", path: "/manage-medicines" },
  { label: "Manage Purchases", icon: "🛒", path: "/manage-purchases" },
  { label: "Process Sales",    icon: "💰", path: "/process-sales"    },
  { label: "Payment",          icon: "💳", path: "/payment"          },
  { label: "View Reports",     icon: "📋", path: "/view-reports"     },
];

// Empty form state used for Add New User
const emptyForm = { fullName: "", email: "", role: "Staff", status: "Active", password: "" };

const ManageUsers = () => {
  const navigate = useNavigate();

  // All users list
  const [users, setUsers]               = useState(initialUsers);

  // Search input value
  const [searchQuery, setSearchQuery]   = useState("");

  // Current page for pagination
  const [currentPage, setCurrentPage]   = useState(1);
  const usersPerPage = 8;

  // Modal states
  const [showModal, setShowModal]       = useState(false);   // add/edit modal
  const [showConfirm, setShowConfirm]   = useState(false);   // delete confirm modal
  const [editingUser, setEditingUser]   = useState(null);    // null = adding, object = editing
  const [deleteTarget, setDeleteTarget] = useState(null);    // user to delete
  const [formData, setFormData]         = useState(emptyForm);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // Filter users based on search query (name, email, or role)
  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  // Pagination — slice filtered list for current page
  const totalPages  = Math.ceil(filtered.length / usersPerPage);
  const startIndex  = (currentPage - 1) * usersPerPage;
  const currentRows = filtered.slice(startIndex, startIndex + usersPerPage);

  // Summary counts
  const totalCount    = users.length;
  const activeCount   = users.filter((u) => u.status === "Active").length;
  const inactiveCount = users.filter((u) => u.status === "Inactive").length;

  // Open Add New User modal
  const openAddModal = () => {
    setEditingUser(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  // Open Edit User modal and pre-fill form
  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({ fullName: user.fullName, email: user.email, role: user.role, status: user.status, password: "" });
    setShowModal(true);
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Save user — either update existing or add new
  const handleSave = () => {
    if (!formData.fullName || !formData.email) return;

    if (editingUser) {
      // Update existing user
      setUsers(users.map((u) =>
        u.id === editingUser.id
          ? { ...u, fullName: formData.fullName, email: formData.email, role: formData.role, status: formData.status }
          : u
      ));
    } else {
      // Add new user with auto-incremented ID
      const newId = String(users.length + 1).padStart(3, "0");
      setUsers([...users, { id: newId, ...formData }]);
    }

    setShowModal(false);
    setFormData(emptyForm);
  };

  // Open delete confirmation modal
  const openDeleteConfirm = (user) => {
    setDeleteTarget(user);
    setShowConfirm(true);
  };

  // Confirm and remove user
  const handleDelete = () => {
    setUsers(users.filter((u) => u.id !== deleteTarget.id));
    setShowConfirm(false);
    setDeleteTarget(null);
  };

  return (
    <div className="manage-users-wrapper">

      {/* ════════ SIDEBAR ════════ */}
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

      {/* ════════ MAIN COLUMN ════════ */}
      <div className="main-content">

        {/* Top header with logo + admin/logout */}
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

        {/* ── Scrollable page body ── */}
        <div className="manage-users-body">

          {/* Page title */}
          <div className="page-title">
            <h1>Manage Users</h1>
            <p>Add, edit, or remove user accounts</p>
          </div>

          {/* Search bar + Add New User button */}
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
                  setCurrentPage(1); // reset to page 1 on new search
                }}
              />
            </div>
            <button className="add-user-btn" onClick={openAddModal}>
              + Add New User
            </button>
          </div>

          {/* Users table */}
          <div className="users-table-card">
            <table className="users-table">

              {/* Blue header */}
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

              {/* Table rows */}
              <tbody>
                {currentRows.length > 0 ? (
                  currentRows.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.fullName}</td>
                      <td>{user.email}</td>

                      {/* Role badge — blue for Admin, yellow for Staff */}
                      <td>
                        <span className={`role-badge ${user.role === "Admin" ? "role-admin" : "role-staff"}`}>
                          {user.role}
                        </span>
                      </td>

                      {/* Status badge — green for Active, red for Inactive */}
                      <td>
                        <span className={`status-badge ${user.status === "Active" ? "status-active" : "status-inactive"}`}>
                          {user.status}
                        </span>
                      </td>

                      {/* Edit and Delete action buttons */}
                      <td>
                        <div className="action-buttons">
                          <button className="edit-btn" onClick={() => openEditModal(user)}>Edit</button>
                          <button className="delete-btn" onClick={() => openDeleteConfirm(user)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  // No results found message
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#9ca3af" }}>
                      No users found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination + summary stats */}
            <div className="table-footer">

              {/* Page number buttons */}
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
                {/* Next arrow */}
                {currentPage < totalPages && (
                  <button className="page-arrow" onClick={() => setCurrentPage(currentPage + 1)}>→</button>
                )}
              </div>

              {/* Summary pills */}
              <div className="table-stats">
                <span className="stat-pill stat-pill-blue">Total: {totalCount} users</span>
                <span className="stat-pill stat-pill-green">Active: {activeCount} users</span>
                <span className="stat-pill stat-pill-pink">Inactive: {inactiveCount} users</span>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ════════ ADD / EDIT USER MODAL ════════ */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editingUser ? "Edit User" : "Add New User"}</h2>

            {/* Full Name */}
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

            {/* Email */}
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

            {/* Password — only shown when adding new user */}
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

            {/* Role dropdown */}
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" name="role" value={formData.role} onChange={handleFormChange}>
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
                <option value="Customer">Customer</option>
              </select>
            </div>

            {/* Status dropdown */}
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" name="status" value={formData.status} onChange={handleFormChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Modal action buttons */}
            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="modal-save-btn" onClick={handleSave}>
                {editingUser ? "Save Changes" : "Add User"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ════════ DELETE CONFIRMATION MODAL ════════ */}
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