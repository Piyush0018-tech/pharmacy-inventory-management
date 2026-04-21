import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMedicines, createMedicine, updateMedicine, deleteMedicine } from "../api";
import "./ManageInventory.css";

const ALL_CATEGORIES = [
  "All",
  "Painkiller",
  "Antibiotic",
  "Antihistamine",
  "Antacid",
  "Antidiabetic",
  "Blood Thinner",
  "Antihypertensive",
  "Bronchodilator",
];

const navItems = [
  { label: "Dashboard", icon: "🏠", path: "/dashboard" },
  { label: "Manage Users", icon: "👥", path: "/manage-users" },
  { label: "Manage Inventory", icon: "📦", path: "/manage-inventory" },
  { label: "Manage Medicines", icon: "💊", path: "/manage-medicines" },
  { label: "Manage Purchases", icon: "🛒", path: "/manage-purchases" },
  { label: "Process Sales", icon: "💰", path: "/process-sales" },
  { label: "Payment", icon: "💳", path: "/payment" },
  { label: "View Reports", icon: "📋", path: "/view-reports" },
];

const emptyForm = {
  name: "",
  category: "Painkiller",
  quantity: "",
  price: "",
  expiry_date: "",
};

const LOW_STOCK = 50;

// Format date from DB (2026-12-01) to display (12/2026)
const formatExpiry = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${year}`;
};

// Check if expiry date is within 3 months from today
const isExpiringSoon = (dateStr) => {
  if (!dateStr) return false;
  const expiry = new Date(dateStr);
  const soon = new Date();
  soon.setMonth(soon.getMonth() + 3);
  return expiry <= soon && expiry >= new Date();
};

const ManageInventory = () => {
  const navigate = useNavigate();

  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const itemsPerPage = 8;

  // Load medicines from backend on mount
  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const res = await getMedicines();
      setMedicines(res.data);
    } catch (err) {
      setError("Failed to load medicines.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const filtered = medicines.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
    const matchCategory = filterCategory === "All" || m.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRows = filtered.slice(startIndex, startIndex + itemsPerPage);

  const totalQty = medicines
    .reduce((sum, m) => sum + Number(m.quantity), 0)
    .toLocaleString();

  const lowStockCount = medicines.filter((m) => m.quantity <= LOW_STOCK).length;
  const expiringSoonCount = medicines.filter((m) => isExpiringSoon(m.expiry_date)).length;

  const openAddModal = () => {
    setEditingItem(null);
    setFormData(emptyForm);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      price: item.price,
      // Convert DB date back to input format (YYYY-MM-DD for date input)
      expiry_date: item.expiry_date ? item.expiry_date.split("T")[0] : "",
    });
    setError("");
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.quantity || !formData.price || !formData.expiry_date) return;

    try {
      setLoading(true);

      const payload = {
        name: formData.name,
        category: formData.category,
        quantity: Number(formData.quantity),
        price: Number(formData.price),
        expiry_date: formData.expiry_date,
      };

      if (editingItem) {
        await updateMedicine(editingItem.id, payload);
      } else {
        await createMedicine(payload);
      }

      await fetchMedicines();
      setShowModal(false);
      setFormData(emptyForm);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save medicine.");
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirm = (item) => {
    setDeleteTarget(item);
    setShowConfirm(true);
  };

  const handleDelete = async () => {
    try {
      await deleteMedicine(deleteTarget.id);
      await fetchMedicines();
      setShowConfirm(false);
      setDeleteTarget(null);
    } catch (err) {
      setError("Failed to delete medicine.");
      setShowConfirm(false);
    }
  };

  return (
    <div className="inventory-wrapper">
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
              className={`nav-link ${item.path === "/manage-inventory" ? "active" : ""}`}
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
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <div className="inventory-body">
          <div className="page-title">
            <h1>Manage Inventory</h1>
            <p>Add, edit, or delete medicines from inventory</p>
          </div>

          {/* Show error if any API call fails */}
          {error && <div className="error-message">{error}</div>}

          <div className="inventory-toolbar">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search by medicine name, category, or manufacturer..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="filter-wrapper">
              <button className="filter-btn" onClick={() => setShowFilter(!showFilter)}>
                🔽 Filter by Category
              </button>
              {showFilter && (
                <div className="filter-dropdown">
                  {ALL_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      className={`filter-option ${
                        filterCategory === cat ? "filter-active" : ""
                      }`}
                      onClick={() => {
                        setFilterCategory(cat);
                        setShowFilter(false);
                        setCurrentPage(1);
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="add-btn" onClick={openAddModal}>
              + Add Medicine
            </button>

            {/* Import CSV removed (button + handler) */}
          </div>

          <div className="inventory-table-card">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Medicine Name</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Price (Rs.)</th>
                  <th>Expiry Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.length > 0 ? (
                  currentRows.map((item) => {
                    const isLow = item.quantity <= LOW_STOCK;
                    const isExpiring = isExpiringSoon(item.expiry_date);

                    return (
                      <tr key={item.id}>
                        <td className="id-cell">{item.id}</td>
                        <td>{item.name}</td>
                        <td>
                          <span
                            className={`category-badge cat-${item.category
                              .toLowerCase()
                              .replace(/\s/g, "-")}`}
                          >
                            {item.category}
                          </span>
                        </td>
                        <td>
                          <span className={isLow ? "qty-low" : "qty-normal"}>
                            {Number(item.quantity).toLocaleString()}
                            {isLow && <span className="low-dot"> ●</span>}
                          </span>
                        </td>
                        <td>Rs. {Number(item.price).toFixed(2)}</td>
                        <td className={isExpiring ? "expiry-soon" : ""}>
                          {formatExpiry(item.expiry_date)}
                          {isExpiring && <span className="expiry-dot"> ●</span>}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="edit-icon-btn"
                              onClick={() => openEditModal(item)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              className="delete-icon-btn"
                              onClick={() => openDeleteConfirm(item)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="no-results">
                      No medicines found matching your search.
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
                  <button
                    className="page-arrow"
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    →
                  </button>
                )}
              </div>

              <div className="table-stats">
                <span className="stat-pill stat-pill-blue">Total Medicines: {totalQty}</span>
                <span className="stat-pill stat-pill-pink">
                  Low Stock: {lowStockCount} items
                </span>
                <span className="stat-pill stat-pill-yellow">
                  Expiring Soon: {expiringSoonCount} items
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editingItem ? "Edit Medicine" : "Add New Medicine"}</h2>

            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label className="form-label">Medicine Name</label>
              <input
                className="form-input"
                type="text"
                name="name"
                placeholder="Enter medicine name"
                value={formData.name}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                name="category"
                value={formData.category}
                onChange={handleFormChange}
              >
                {ALL_CATEGORIES.filter((c) => c !== "All").map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input
                  className="form-input"
                  type="number"
                  name="quantity"
                  placeholder="e.g. 500"
                  value={formData.quantity}
                  onChange={handleFormChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Price (Rs.)</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  name="price"
                  placeholder="e.g. 350"
                  value={formData.price}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Expiry Date</label>
              <input
                className="form-input"
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleFormChange}
              />
            </div>

            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="modal-save-btn" onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : editingItem ? "Save Changes" : "Add Medicine"}
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
            <h3 className="confirm-title">Delete Medicine</h3>
            <p className="confirm-text">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
              <br />
              This action cannot be undone.
            </p>
            <div className="confirm-actions">
              <button className="confirm-cancel-btn" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button className="confirm-delete-btn" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageInventory;