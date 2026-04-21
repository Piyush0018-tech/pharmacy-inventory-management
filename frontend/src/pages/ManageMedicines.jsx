import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMedicines, updateStock } from "../api";
import "./ManageMedicines.css";

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

const LOW_STOCK = 50;
const LOW_STOCK_PREVIEW_COUNT = 3;
const EXPIRING_PREVIEW_COUNT = 4;

const formatExpiry = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${month}/${d.getFullYear()}`;
};

const isExpiringSoon = (dateStr) => {
  if (!dateStr) return false;
  const expiry = new Date(dateStr);
  const today = new Date();
  const sixMonthsLater = new Date();
  sixMonthsLater.setMonth(today.getMonth() + 6);
  return expiry >= today && expiry <= sixMonthsLater;
};

const toNumber = (v) => Number(v ?? 0);

export default function ManageMedicines() {
  const navigate = useNavigate();

  const [medicines, setMedicines] = useState([]);
  const [stockSearch, setStockSearch] = useState("");
  const [selectedMed, setSelectedMed] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [activeTab, setActiveTab] = useState("stock");
  const [showAllExpiring, setShowAllExpiring] = useState(false);
  const [showAllLowStock, setShowAllLowStock] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchMedicines();
    
  }, []);

  const fetchMedicines = async () => {
    try {
      setError("");
      const res = await getMedicines();
      const list = res.data || [];
      setMedicines(list);
      if (selectedMed) {
        const updated = list.find((m) => String(m.id) === String(selectedMed.id));
        setSelectedMed(updated || null);
      }
    } catch {
      setError("Failed to load medicine data.");
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const lowStockMeds = useMemo(() => {
    const list = (medicines || []).filter((m) => toNumber(m.quantity) <= LOW_STOCK);
    list.sort((a, b) => toNumber(a.quantity) - toNumber(b.quantity));
    return list;
  }, [medicines]);

  const expiringMeds = useMemo(() => {
    const list = (medicines || []).filter((m) => isExpiringSoon(m.expiry_date));
    list.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
    return list;
  }, [medicines]);

  const displayedLowStock = showAllLowStock
    ? lowStockMeds
    : lowStockMeds.slice(0, LOW_STOCK_PREVIEW_COUNT);

  const displayedExpiring = showAllExpiring
    ? expiringMeds
    : expiringMeds.slice(0, EXPIRING_PREVIEW_COUNT);

  const handleStockSearch = (e) => {
    const q = e.target.value;
    setStockSearch(q);
    const found = medicines.find(
      (m) =>
        (m.name || "").toLowerCase().includes(q.toLowerCase()) ||
        String(m.id).includes(q)
    );
    setSelectedMed(found || null);
  };

  const handleAdd = async () => {
    if (!selectedMed || !quantity) {
      setError("Please select a medicine and enter quantity.");
      return;
    }
    try {
      setError("");
      await updateStock(selectedMed.id, { quantity: Number(quantity), action: "add" });
      await fetchMedicines();
      setQuantity("");
      showSuccess(`✅ Added ${quantity} units to ${selectedMed.name}`);
    } catch {
      setError("Failed to update stock.");
    }
  };

  const handleRemove = async () => {
    if (!selectedMed || !quantity) {
      setError("Please select a medicine and enter quantity.");
      return;
    }
    try {
      setError("");
      await updateStock(selectedMed.id, { quantity: Number(quantity), action: "remove" });
      await fetchMedicines();
      setQuantity("");
      showSuccess(`✅ Removed ${quantity} units from ${selectedMed.name}`);
    } catch {
      setError("Failed to update stock.");
    }
  };

  const handleClearForm = () => {
    setStockSearch("");
    setSelectedMed(null);
    setQuantity("");
    setError("");
    showSuccess("✅ Form cleared successfully.");
  };

  const handleMarkForReturn = async (med) => {
    const confirmed = window.confirm(
      `Mark "${med.name}" for return to supplier?\n\nQuantity: ${med.quantity} units\nExpiry: ${formatExpiry(
        med.expiry_date
      )}\n\nThis will set stock to 0.`
    );
    if (!confirmed) return;
    try {
      setError("");
      await updateStock(med.id, { quantity: toNumber(med.quantity), action: "remove" });
      await fetchMedicines();
      showSuccess(`✅ ${med.name} marked for return. Stock set to 0.`);
    } catch {
      setError("Failed to mark for return.");
    }
  };

  const handleReorder = (med) => {
    const confirmed = window.confirm(
      `Reorder "${med.name}"?\n\nCurrent Stock : ${med.quantity} units\nLow Stock Rule: <= ${LOW_STOCK} units`
    );
    if (confirmed) navigate("/manage-purchases");
  };

  const totalQty = medicines.reduce((sum, m) => sum + toNumber(m.quantity), 0);
  const categoriesCount = [...new Set(medicines.map((m) => m.category))].length;
  const inStockCount = medicines.filter((m) => toNumber(m.quantity) > 0).length;
  const outOfStockCount = medicines.filter((m) => toNumber(m.quantity) === 0).length;

  return (
    <div className="medicines-wrapper">
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
              className={`nav-link ${item.path === "/manage-medicines" ? "active" : ""}`}
              onClick={() => navigate(item.path)}
              type="button"
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
            <button className="logout-btn" onClick={handleLogout} type="button">
              Logout
            </button>
          </div>
        </header>
        <div className="medicines-body">
          <div className="page-title">
            <h1>Manage Medicines</h1>
            <p>Update stock, monitor alerts and medicine details</p>
          </div>
          {error && <div className="error-message">{error}</div>}
          {successMsg && <div className="success-message">{successMsg}</div>}

          {/* Top action cards */}
          <div className="action-cards">
            <button
              className={`action-card card-blue ${activeTab === "stock" ? "card-active" : ""}`}
              onClick={() => setActiveTab("stock")}
              type="button"
            >
              <div className="card-icon">📦</div>
              <div className="card-title">Update Stock</div>
              <div className="card-desc">Update medicine quantities and track inventory levels</div>
            </button>
            <button
              className={`action-card card-orange ${activeTab === "lowstock" ? "card-active" : ""}`}
              onClick={() => {
                setActiveTab("lowstock");
                setShowAllLowStock(true);
              }}
              type="button"
            >
              <div className="card-icon">⚠️</div>
              <div className="card-title">Low Stock Alerts</div>
              <div className="card-desc">Medicines with quantity ≤ {LOW_STOCK}</div>
            </button>
            <button
              className={`action-card card-red ${activeTab === "expiry" ? "card-active" : ""}`}
              onClick={() => {
                setActiveTab("expiry");
                setShowAllExpiring(true);
              }}
              type="button"
            >
              <div className="card-icon">🕐</div>
              <div className="card-title">Expiry Alerts</div>
              <div className="card-desc">Medicines expiring within 6 months</div>
            </button>
          </div>
          <div className="medicines-grid">
            {/* LEFT COLUMN */}
            <div className="left-col">
              {/* Quick Stock Update */}
              <div className="panel">
                <h2 className="panel-title">📦 Quick Stock Update</h2>
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
                      value={selectedMed ? `${toNumber(selectedMed.quantity)} units` : ""}
                      readOnly
                      placeholder="—"
                    />
                  </div>
                </div>
                <label className="stock-label">Add/Remove Quantity</label>
                <div className="stock-controls">
                  <input
                    className="qty-input"
                    type="number"
                    placeholder="Enter quantity..."
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                  <button className="btn-add" onClick={handleAdd} type="button">
                    + Add
                  </button>
                  <button className="btn-remove" onClick={handleRemove} type="button">
                    - Remove
                  </button>
                  <button className="btn-update" onClick={handleClearForm} type="button">
                    Clear
                  </button>
                </div>
              </div>
              {/* Expiring Soon (shows 4 only, then view more) */}
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
                    {displayedExpiring.map((med) => (
                      <tr key={med.id} className="expiring-row">
                        <td>{med.name}</td>
                        <td>{med.quantity} units</td>
                        <td className="expiry-date-cell">{formatExpiry(med.expiry_date)}</td>
                        <td>
                          <button
                            className="mark-return-btn"
                            onClick={() => handleMarkForReturn(med)}
                            type="button"
                          >
                            Mark for Return
                          </button>
                        </td>
                      </tr>
                    ))}
                    {expiringMeds.length === 0 && (
                      <tr>
                        <td colSpan={4} className="no-results">
                          No medicines expiring within 6 months.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {expiringMeds.length > EXPIRING_PREVIEW_COUNT && (
                  <button
                    className="view-all-link"
                    onClick={() => setShowAllExpiring((v) => !v)}
                    type="button"
                  >
                    {showAllExpiring ? "Show Less ←" : "View More Expiring Medicines →"}
                  </button>
                )}
              </div>
            </div>
            {/* RIGHT COLUMN */}
            <div className="right-col">
              {/* Low Stock Alert */}
              <div className="panel">
                <div className="panel-header-row">
                  <h2 className="panel-title">⚠️ Low Stock Alert</h2>
                  <span className="badge-count badge-red">{lowStockMeds.length}</span>
                </div>
                <div className="low-stock-list">
                  {displayedLowStock.map((med) => (
                    <div key={med.id} className="low-stock-item">
                      <div className="low-stock-info">
                        <div className="low-stock-name">{med.name}</div>
                        <div className="low-stock-detail">
                          Current: {med.quantity} units | Low Stock: ≤ {LOW_STOCK} units
                        </div>
                      </div>
                      <button
                        className="reorder-btn"
                        onClick={() => handleReorder(med)}
                        type="button"
                      >
                        Reorder
                      </button>
                    </div>
                  ))}
                  {lowStockMeds.length === 0 && (
                    <p className="no-results">All medicines are well stocked.</p>
                  )}
                </div>
                {lowStockMeds.length > LOW_STOCK_PREVIEW_COUNT && (
                  <button
                    className="view-all-link"
                    onClick={() => setShowAllLowStock((v) => !v)}
                    type="button"
                  >
                    {showAllLowStock ? "Show Less ←" : "View More Low Stock Items →"}
                  </button>
                )}
              </div>
              {/* Medicine Statistics */}
              <div className="panel panel-fill">
                <h2 className="panel-title">📊 Medicine Statistics</h2>
                <div className="stats-grid">
                  <div className="stat-card stat-blue">
                    <div className="stat-label">Total Medicines</div>
                    <div className="stat-value">{totalQty.toLocaleString()}</div>
                    <div className="stat-sub">All medicines quantity</div>
                  </div>
                  <div className="stat-card stat-orange">
                    <div className="stat-label">Categories</div>
                    <div className="stat-value stat-orange-val">{categoriesCount}</div>
                    <div className="stat-sub">Different types</div>
                  </div>
                  <div className="stat-card stat-green">
                    <div className="stat-label">In Stock</div>
                    <div className="stat-value stat-green-val">{inStockCount}</div>
                    <div className="stat-sub">Available</div>
                  </div>
                  <div className="stat-card stat-red">
                    <div className="stat-label">Out of Stock</div>
                    <div className="stat-value stat-red-val">{outOfStockCount}</div>
                    <div className="stat-sub">Need reorder</div>
                  </div>
                </div>
                <button className="generate-report-btn mt-auto" onClick={() => window.print()} type="button">
                  🖨️ Generate Stock Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* --- SIMPLE PRINTABLE STOCK REPORT, PRINT ONLY --- */}
      <div className="print-stock-report">
        <h2>MediTrack Pharmacy — Stock Report</h2>
        <p>Generated: {new Date().toLocaleString()}</p>
        <table className="print-stock-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Medicine Name</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Expiry</th>
            </tr>
          </thead>
          <tbody>
            {medicines.length === 0 ? (
              <tr>
                <td colSpan={5}>No medicines found.</td>
              </tr>
            ) : (
              medicines.map((med, idx) => (
                <tr key={med.id}>
                  <td>{idx + 1}</td>
                  <td>{med.name}</td>
                  <td>{med.category}</td>
                  <td>{med.quantity}</td>
                  <td>{formatExpiry(med.expiry_date)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}