import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManageMedicines.css";

// Manage Medicines page — MediTrack Pharmacy System
// Features: Quick stock update, low stock alerts, expiring soon list, medicine statistics

// Sample medicine data
const initialMedicines = [
  { id: "MED001", name: "Paracetamol 500mg",  category: "Painkiller",      quantity: 1250, minStock: 100, expiry: "12/2026" },
  { id: "MED002", name: "Amoxicillin 250mg",  category: "Antibiotic",      quantity: 15,   minStock: 50,  expiry: "08/2025" },
  { id: "MED003", name: "Ibuprofen 400mg",    category: "Painkiller",      quantity: 850,  minStock: 100, expiry: "03/2026" },
  { id: "MED004", name: "Cetirizine 10mg",    category: "Antihistamine",   quantity: 620,  minStock: 80,  expiry: "05/15/2025" },
  { id: "MED005", name: "Omeprazole 20mg",    category: "Antacid",         quantity: 430,  minStock: 60,  expiry: "09/2026" },
  { id: "MED006", name: "Metformin 500mg",    category: "Antidiabetic",    quantity: 35,   minStock: 100, expiry: "11/2025" },
  { id: "MED007", name: "Aspirin 75mg",       category: "Blood Thinner",   quantity: 940,  minStock: 120, expiry: "07/2026" },
  { id: "MED008", name: "Losartan 50mg",      category: "Antihypertensive",quantity: 520,  minStock: 80,  expiry: "02/2026" },
  { id: "MED009", name: "Insulin Glargine 100IU", category: "Antidiabetic", quantity: 8,  minStock: 25,  expiry: "04/2026" },
  { id: "MED010", name: "Cough Syrup 100ml",  category: "Bronchodilator",  quantity: 45,   minStock: 60,  expiry: "06/20/2025" },
  { id: "MED011", name: "Vitamin D3 Capsules",category: "Supplement",      quantity: 180,  minStock: 50,  expiry: "07/10/2025" },
  { id: "MED012", name: "Salbutamol 100mcg",  category: "Bronchodilator",  quantity: 22,   minStock: 40,  expiry: "04/2025" },
];

// Sidebar nav items
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

// Check if expiry is within 30 days (for expiry alerts)
const isExpiringSoon = (expiry) => {
  const parts = expiry.split("/");
  let expiryDate;
  if (parts.length === 3) {
    // MM/DD/YYYY format
    expiryDate = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
  } else {
    // MM/YYYY format
    expiryDate = new Date(Number(parts[1]), Number(parts[0]) - 1);
  }
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  return expiryDate <= thirtyDaysLater && expiryDate >= new Date();
};

const ManageMedicines = () => {
  const navigate = useNavigate();

  const [medicines, setMedicines] = useState(initialMedicines);

  // Quick stock update states
  const [stockSearch, setStockSearch]   = useState("");
  const [selectedMed, setSelectedMed]  = useState(null);
  const [quantity, setQuantity]         = useState("");
  const [activeTab, setActiveTab]       = useState("stock"); // stock | lowstock | expiry

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // Search medicine for quick stock update
  const handleStockSearch = (e) => {
    const q = e.target.value;
    setStockSearch(q);
    const found = medicines.find(
      (m) => m.name.toLowerCase().includes(q.toLowerCase()) || m.id.toLowerCase().includes(q.toLowerCase())
    );
    setSelectedMed(found || null);
  };

  // Add quantity to selected medicine
  const handleAdd = () => {
    if (!selectedMed || !quantity) return;
    setMedicines(medicines.map((m) =>
      m.id === selectedMed.id ? { ...m, quantity: m.quantity + Number(quantity) } : m
    ));
    setSelectedMed({ ...selectedMed, quantity: selectedMed.quantity + Number(quantity) });
    setQuantity("");
  };

  // Remove quantity from selected medicine
  const handleRemove = () => {
    if (!selectedMed || !quantity) return;
    const newQty = Math.max(0, selectedMed.quantity - Number(quantity));
    setMedicines(medicines.map((m) =>
      m.id === selectedMed.id ? { ...m, quantity: newQty } : m
    ));
    setSelectedMed({ ...selectedMed, quantity: newQty });
    setQuantity("");
  };

  // Update — just clears the form (in real app would call API)
  const handleUpdate = () => {
    alert(`Stock updated for ${selectedMed?.name}`);
    setStockSearch("");
    setSelectedMed(null);
    setQuantity("");
  };

  // Low stock medicines (below min stock)
  const lowStockMeds = medicines.filter((m) => m.quantity < m.minStock);

  // Expiring soon medicines
  const expiringMeds = medicines.filter((m) => isExpiringSoon(m.expiry));

  // Stats
  const totalMedicines = medicines.reduce((sum, m) => sum + m.quantity, 0);
  const categories     = [...new Set(medicines.map((m) => m.category))].length;
  const inStock        = medicines.filter((m) => m.quantity > 0).length;
  const outOfStock     = medicines.filter((m) => m.quantity === 0).length;

  return (
    <div className="medicines-wrapper">

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
              className={`nav-link ${item.path === "/manage-medicines" ? "active" : ""}`}
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

        {/* ── Scrollable body ── */}
        <div className="medicines-body">

          {/* Page title */}
          <div className="page-title">
            <h1>Manage Medicines</h1>
            <p>Update stock, monitor alerts and medicine details</p>
          </div>

          {/* ── Top 3 action cards ── */}
          <div className="action-cards">
            <button className={`action-card card-blue ${activeTab === "stock" ? "card-active" : ""}`} onClick={() => setActiveTab("stock")}>
              <div className="card-icon">📦</div>
              <div className="card-title">Update Stock</div>
              <div className="card-desc">Update medicine quantities and track inventory levels</div>
            </button>
            <button className={`action-card card-orange ${activeTab === "lowstock" ? "card-active" : ""}`} onClick={() => setActiveTab("lowstock")}>
              <div className="card-icon">⚠️</div>
              <div className="card-title">Low Stock Alerts</div>
              <div className="card-desc">View medicines running low on stock</div>
            </button>
            <button className={`action-card card-red ${activeTab === "expiry" ? "card-active" : ""}`} onClick={() => setActiveTab("expiry")}>
              <div className="card-icon">🕐</div>
              <div className="card-title">Expiry Alerts</div>
              <div className="card-desc">Check medicines expiring within 30 days</div>
            </button>
          </div>

          {/* ── Two column layout ── */}
          <div className="medicines-grid">

            {/* LEFT COLUMN */}
            <div className="left-col">

              {/* Quick Stock Update card */}
              <div className="panel">
                <h2 className="panel-title">📦 Quick Stock Update</h2>

                {/* Search medicine */}
                <div className="stock-search-wrapper">
                  <span className="stock-search-icon">🔍</span>
                  <input
                    type="text"
                    className="stock-search-input"
                    placeholder="Search medicine by name or ID..."
                    value={stockSearch}
                    onChange={handleStockSearch}
                  />
                </div>

                {/* Selected medicine info */}
                <div className="stock-fields">
                  <div className="stock-field-group">
                    <label className="stock-label">Medicine Name</label>
                    <input
                      className="stock-input"
                      type="text"
                      value={selectedMed ? selectedMed.name : ""}
                      readOnly
                      placeholder="Select a medicine above"
                    />
                  </div>
                  <div className="stock-field-group">
                    <label className="stock-label">Current Stock</label>
                    <input
                      className="stock-input stock-qty"
                      type="text"
                      value={selectedMed ? `${selectedMed.quantity.toLocaleString()} units` : ""}
                      readOnly
                      placeholder="—"
                    />
                  </div>
                </div>

                {/* Add/Remove/Update controls */}
                <label className="stock-label">Add/Remove Quantity</label>
                <div className="stock-controls">
                  <input
                    className="qty-input"
                    type="number"
                    placeholder="Enter quantity..."
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                  <button className="btn-add" onClick={handleAdd}>+ Add</button>
                  <button className="btn-remove" onClick={handleRemove}>- Remove</button>
                  <button className="btn-update" onClick={handleUpdate}>Update</button>
                </div>
              </div>

              {/* Expiring Soon table */}
              <div className="panel">
                <div className="panel-header-row">
                  <h2 className="panel-title">🕐 Expiring Soon</h2>
                  <span className="badge-count badge-orange">{expiringMeds.length}</span>
                </div>

                <table className="mini-table">
                  <thead>
                    <tr>
                      <th>Medicine Name</th>
                      <th>Quantity</th>
                      <th>Expiry Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringMeds.slice(0, 4).map((med) => (
                      <tr key={med.id} className="expiring-row">
                        <td>{med.name}</td>
                        <td>{med.quantity} units</td>
                        <td className="expiry-date-cell">{med.expiry}</td>
                        <td>
                          <button className="mark-return-btn">Mark for Return</button>
                        </td>
                      </tr>
                    ))}
                    {expiringMeds.length === 0 && (
                      <tr><td colSpan={4} className="no-results">No medicines expiring soon.</td></tr>
                    )}
                  </tbody>
                </table>

                <button className="view-all-link">View All Expiring Medicines →</button>
              </div>

            </div>

            {/* RIGHT COLUMN */}
            <div className="right-col">

              {/* Low Stock Alert panel */}
              <div className="panel">
                <div className="panel-header-row">
                  <h2 className="panel-title">⚠️ Low Stock Alert</h2>
                  <span className="badge-count badge-red">{lowStockMeds.length}</span>
                </div>

                <div className="low-stock-list">
                  {lowStockMeds.slice(0, 4).map((med) => (
                    <div key={med.id} className="low-stock-item">
                      <div className="low-stock-info">
                        <div className="low-stock-name">{med.name}</div>
                        <div className="low-stock-detail">Current: {med.quantity} units | Min: {med.minStock} units</div>
                      </div>
                      <button className="reorder-btn">Reorder</button>
                    </div>
                  ))}
                  {lowStockMeds.length === 0 && (
                    <p className="no-results">All medicines are well stocked.</p>
                  )}
                </div>

                <button className="view-all-link">View All Low Stock Items →</button>
              </div>

              {/* Medicine Statistics panel */}
              <div className="panel">
                <h2 className="panel-title">📊 Medicine Statistics</h2>

                <div className="stats-grid">
                  <div className="stat-card stat-blue">
                    <div className="stat-label">Total Medicines</div>
                    <div className="stat-value">{totalMedicines.toLocaleString()}</div>
                    <div className="stat-sub">↑ 5.2% this month</div>
                  </div>
                  <div className="stat-card stat-orange">
                    <div className="stat-label">Categories</div>
                    <div className="stat-value stat-orange-val">{categories}</div>
                    <div className="stat-sub">Different types</div>
                  </div>
                  <div className="stat-card stat-green">
                    <div className="stat-label">In Stock</div>
                    <div className="stat-value stat-green-val">{inStock.toLocaleString()}</div>
                    <div className="stat-sub">Available</div>
                  </div>
                  <div className="stat-card stat-red">
                    <div className="stat-label">Out of Stock</div>
                    <div className="stat-value stat-red-val">{outOfStock}</div>
                    <div className="stat-sub">Need reorder</div>
                  </div>
                </div>

                {/* Generate report button */}
                <button className="generate-report-btn">🖨️ Generate Stock Report</button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageMedicines;