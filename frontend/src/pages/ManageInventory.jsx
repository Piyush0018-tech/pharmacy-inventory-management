import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManageInventory.css";

// Manage Inventory page — MediTrack Pharmacy System
// Features: search, filter by category, add/edit/delete medicines, CSV import, pagination

// Sample inventory data
const initialMedicines = [
  { id: "MED001", name: "Paracetamol 500mg",  category: "Painkiller",      quantity: 1250, price: 2.50, expiry: "12/2026" },
  { id: "MED002", name: "Amoxicillin 250mg",  category: "Antibiotic",      quantity: 15,   price: 5.75, expiry: "08/2025" },
  { id: "MED003", name: "Ibuprofen 400mg",    category: "Painkiller",      quantity: 850,  price: 3.20, expiry: "03/2026" },
  { id: "MED004", name: "Cetirizine 10mg",    category: "Antihistamine",   quantity: 620,  price: 1.80, expiry: "05/2025" },
  { id: "MED005", name: "Omeprazole 20mg",    category: "Antacid",         quantity: 430,  price: 4.50, expiry: "09/2026" },
  { id: "MED006", name: "Metformin 500mg",    category: "Antidiabetic",    quantity: 35,   price: 6.25, expiry: "11/2025" },
  { id: "MED007", name: "Aspirin 75mg",       category: "Blood Thinner",   quantity: 940,  price: 1.50, expiry: "07/2026" },
  { id: "MED008", name: "Losartan 50mg",      category: "Antihypertensive",quantity: 520,  price: 7.80, expiry: "02/2026" },
  { id: "MED009", name: "Atorvastatin 10mg",  category: "Antidiabetic",    quantity: 310,  price: 8.40, expiry: "06/2026" },
  { id: "MED010", name: "Salbutamol 100mcg",  category: "Bronchodilator",  quantity: 22,   price: 9.10, expiry: "04/2025" },
  { id: "MED011", name: "Azithromycin 500mg", category: "Antibiotic",      quantity: 180,  price: 12.00,expiry: "10/2026" },
  { id: "MED012", name: "Diclofenac 50mg",    category: "Painkiller",      quantity: 670,  price: 2.90, expiry: "01/2027" },
];

// All available categories for filter dropdown
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

// Empty form state for Add New Medicine
const emptyForm = { name: "", category: "Painkiller", quantity: "", price: "", expiry: "" };

// Low stock threshold
const LOW_STOCK = 50;

// Helper — check if a medicine is expiring soon (within 3 months from today)
const isExpiringSoon = (expiry) => {
  const [month, year] = expiry.split("/").map(Number);
  const expiryDate = new Date(year, month - 1);
  const soon = new Date();
  soon.setMonth(soon.getMonth() + 3);
  return expiryDate <= soon && expiryDate >= new Date();
};

const ManageInventory = () => {
  const navigate = useNavigate();

  const [medicines, setMedicines]       = useState(initialMedicines);
  const [searchQuery, setSearchQuery]   = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showFilter, setShowFilter]     = useState(false);   // category dropdown toggle
  const [currentPage, setCurrentPage]   = useState(1);
  const itemsPerPage = 8;

  // Modal states
  const [showModal, setShowModal]       = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [editingItem, setEditingItem]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData]         = useState(emptyForm);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // Filter list by search query and category
  const filtered = medicines.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      m.name.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q);
    const matchCategory = filterCategory === "All" || m.category === filterCategory;
    return matchSearch && matchCategory;
  });

  // Pagination
  const totalPages  = Math.ceil(filtered.length / itemsPerPage);
  const startIndex  = (currentPage - 1) * itemsPerPage;
  const currentRows = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Summary counts
  const totalQty      = medicines.reduce((sum, m) => sum + m.quantity, 0).toLocaleString();
  const lowStockCount = medicines.filter((m) => m.quantity <= LOW_STOCK).length;
  const expiringSoonCount = medicines.filter((m) => isExpiringSoon(m.expiry)).length;

  // Open Add modal
  const openAddModal = () => {
    setEditingItem(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  // Open Edit modal with pre-filled data
  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({ name: item.name, category: item.category, quantity: item.quantity, price: item.price, expiry: item.expiry });
    setShowModal(true);
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Save — add new or update existing
  const handleSave = () => {
    if (!formData.name || !formData.quantity || !formData.price || !formData.expiry) return;

    if (editingItem) {
      // Update existing medicine
      setMedicines(medicines.map((m) =>
        m.id === editingItem.id
          ? { ...m, name: formData.name, category: formData.category, quantity: Number(formData.quantity), price: Number(formData.price), expiry: formData.expiry }
          : m
      ));
    } else {
      // Add new medicine with auto ID
      const newId = `MED${String(medicines.length + 1).padStart(3, "0")}`;
      setMedicines([...medicines, { id: newId, ...formData, quantity: Number(formData.quantity), price: Number(formData.price) }]);
    }

    setShowModal(false);
    setFormData(emptyForm);
  };

  // Open delete confirm modal
  const openDeleteConfirm = (item) => {
    setDeleteTarget(item);
    setShowConfirm(true);
  };

  // Confirm delete
  const handleDelete = () => {
    setMedicines(medicines.filter((m) => m.id !== deleteTarget.id));
    setShowConfirm(false);
    setDeleteTarget(null);
  };

  // Fake CSV import — just shows an alert for now
  const handleImportCSV = () => {
    alert("CSV import feature coming soon!");
  };

  return (
    <div className="inventory-wrapper">

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
              className={`nav-link ${item.path === "/manage-inventory" ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ════════ MAIN CONTENT ════════ */}
      <div className="main-content">

        {/* Top header */}
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
        <div className="inventory-body">

          {/* Page title */}
          <div className="page-title">
            <h1>Manage Inventory</h1>
            <p>Add, edit, or delete medicines from inventory</p>
          </div>

          {/* Toolbar — search, filter, add, import */}
          <div className="inventory-toolbar">

            {/* Search input */}
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search by medicine name, category, or manufacturer..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>

            {/* Filter by Category dropdown */}
            <div className="filter-wrapper">
              <button className="filter-btn" onClick={() => setShowFilter(!showFilter)}>
                🔽 Filter by Category
              </button>
              {showFilter && (
                <div className="filter-dropdown">
                  {ALL_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      className={`filter-option ${filterCategory === cat ? "filter-active" : ""}`}
                      onClick={() => { setFilterCategory(cat); setShowFilter(false); setCurrentPage(1); }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add Medicine button */}
            <button className="add-btn" onClick={openAddModal}>
              + Add Medicine
            </button>

            {/* Import CSV button */}
            <button className="import-btn" onClick={handleImportCSV}>
              📥 Import CSV
            </button>

          </div>

          {/* Inventory table */}
          <div className="inventory-table-card">
            <table className="inventory-table">

              {/* Blue header */}
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Medicine Name</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Expiry Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {currentRows.length > 0 ? (
                  currentRows.map((item) => {
                    const isLow     = item.quantity <= LOW_STOCK;
                    const isExpiring = isExpiringSoon(item.expiry);

                    return (
                      <tr key={item.id}>
                        <td className="id-cell">{item.id}</td>
                        <td>{item.name}</td>

                        {/* Category badge with color by type */}
                        <td>
                          <span className={`category-badge cat-${item.category.toLowerCase().replace(/\s/g, "-")}`}>
                            {item.category}
                          </span>
                        </td>

                        {/* Quantity — green normally, red + dot if low stock */}
                        <td>
                          <span className={isLow ? "qty-low" : "qty-normal"}>
                            {item.quantity.toLocaleString()}
                            {isLow && <span className="low-dot"> ●</span>}
                          </span>
                        </td>

                        <td>${item.price.toFixed(2)}</td>

                        {/* Expiry date — orange + dot if expiring soon */}
                        <td className={isExpiring ? "expiry-soon" : ""}>
                          {item.expiry}
                          {isExpiring && <span className="expiry-dot"> ●</span>}
                        </td>

                        {/* Edit (pencil) and Delete (trash) icon buttons */}
                        <td>
                          <div className="action-buttons">
                            <button className="edit-icon-btn" onClick={() => openEditModal(item)} title="Edit">✏️</button>
                            <button className="delete-icon-btn" onClick={() => openDeleteConfirm(item)} title="Delete">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="no-results">No medicines found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination + summary stats */}
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

              {/* Summary pills */}
              <div className="table-stats">
                <span className="stat-pill stat-pill-blue">Total Medicines: {totalQty}</span>
                <span className="stat-pill stat-pill-pink">Low Stock: {lowStockCount} items</span>
                <span className="stat-pill stat-pill-yellow">Expiring Soon: {expiringSoonCount} items</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ════════ ADD / EDIT MEDICINE MODAL ════════ */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editingItem ? "Edit Medicine" : "Add New Medicine"}</h2>

            {/* Medicine Name */}
            <div className="form-group">
              <label className="form-label">Medicine Name</label>
              <input className="form-input" type="text" name="name" placeholder="Enter medicine name" value={formData.name} onChange={handleFormChange} />
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" name="category" value={formData.category} onChange={handleFormChange}>
                {ALL_CATEGORIES.filter((c) => c !== "All").map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Quantity and Price side by side */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input className="form-input" type="number" name="quantity" placeholder="e.g. 500" value={formData.quantity} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Price ($)</label>
                <input className="form-input" type="number" step="0.01" name="price" placeholder="e.g. 3.50" value={formData.price} onChange={handleFormChange} />
              </div>
            </div>

            {/* Expiry Date */}
            <div className="form-group">
              <label className="form-label">Expiry Date (MM/YYYY)</label>
              <input className="form-input" type="text" name="expiry" placeholder="e.g. 06/2026" value={formData.expiry} onChange={handleFormChange} />
            </div>

            {/* Modal buttons */}
            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="modal-save-btn" onClick={handleSave}>
                {editingItem ? "Save Changes" : "Add Medicine"}
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
            <h3 className="confirm-title">Delete Medicine</h3>
            <p className="confirm-text">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?<br />
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

export default ManageInventory;