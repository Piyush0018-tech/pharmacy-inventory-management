import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManagePurchases.css";

// Manage Purchases page — MediTrack Pharmacy System
// Currency: Nepali Rupees (Rs.)

// Sample recent purchase orders — amounts in NPR
const initialOrders = [
  { id: "PO-2025-001", supplier: "MedSupply Corp.",   total: 15450.00, date: "01/10/2025", status: "Approved" },
  { id: "PO-2025-002", supplier: "PharmaDirect Ltd.", total: 8200.00,  date: "01/12/2025", status: "Pending"  },
  { id: "PO-2025-003", supplier: "GlobalMed Inc.",    total: 22780.00, date: "01/08/2025", status: "Received" },
  { id: "PO-2025-004", supplier: "MedSupply Corp.",   total: 12350.00, date: "01/13/2025", status: "Pending"  },
];

// Top suppliers — amounts in NPR
const suppliers = [
  { rank: 1, name: "MedSupply Corp.",   orders: 45, amount: 185200, color: "#2563eb" },
  { rank: 2, name: "PharmaDirect Ltd.", orders: 38, amount: 142500, color: "#16a34a" },
  { rank: 3, name: "GlobalMed Inc.",    orders: 32, amount: 128900, color: "#f59e0b" },
];

// Available suppliers for dropdown
const supplierOptions = ["MedSupply Corp.", "PharmaDirect Ltd.", "GlobalMed Inc.", "HealthPlus Ltd.", "MediCare Supplies"];

// Empty medicine item row
const emptyItem = { name: "", quantity: "", unitPrice: "" };

// Sidebar nav
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

const ManagePurchases = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState(initialOrders);

  // Purchase order form state
  const [selectedSupplier, setSelectedSupplier] = useState("MedSupply Corp.");
  const [orderDate, setOrderDate]               = useState("2025-01-15");
  const [items, setItems]                       = useState([
    { name: "Paracetamol 500mg", quantity: "500", unitPrice: "335" },
    { name: "Amoxicillin 250mg", quantity: "300", unitPrice: "765" },
  ]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // Update a medicine item field
  const handleItemChange = (index, field, value) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setItems(updated);
  };

  // Remove a medicine item row
  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Add a new empty medicine item row
  const addItem = () => {
    setItems([...items, { ...emptyItem }]);
  };

  // Calculate total for one row
  const itemTotal = (item) => {
    const qty   = parseFloat(item.quantity)  || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return qty * price;
  };

  // Grand total of all items
  const grandTotal = items.reduce((sum, item) => sum + itemTotal(item), 0);

  // Format amount as Nepali Rupees
  const formatNPR = (amount) => {
    return "Rs. " + amount.toLocaleString("en-NP", { minimumFractionDigits: 2 });
  };

  // Create purchase order
  const handleCreateOrder = () => {
    if (!selectedSupplier || items.length === 0) return;
    const newOrder = {
      id: `PO-2025-00${orders.length + 1}`,
      supplier: selectedSupplier,
      total: grandTotal,
      date: orderDate.split("-").reverse().join("/").slice(3) + "/" + orderDate.split("-")[0],
      status: "Pending",
    };
    setOrders([newOrder, ...orders]);
    setItems([{ ...emptyItem }]);
    alert("Purchase order created successfully!");
  };

  const handleSaveDraft = () => alert("Purchase order saved as draft.");

  // Cancel — reset form
  const handleCancel = () => {
    setItems([{ ...emptyItem }]);
    setSelectedSupplier("MedSupply Corp.");
    setOrderDate("2025-01-15");
  };

  // Status badge class
  const statusClass = (status) => {
    if (status === "Approved") return "status-approved";
    if (status === "Received") return "status-received";
    return "status-pending";
  };

  return (
    <div className="purchases-wrapper">

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
              className={`nav-link ${item.path === "/manage-purchases" ? "active" : ""}`}
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

        <div className="purchases-body">

          {/* Page title + top buttons */}
          <div className="purchases-top-row">
            <div className="page-title">
              <h1>Manage Purchases</h1>
              <p>Create purchase orders and manage suppliers</p>
            </div>
            <div className="top-action-btns">
              <button className="new-order-btn">+ New Purchase Order</button>
              <button className="manage-suppliers-btn">🏭 Manage Suppliers</button>
            </div>
          </div>

          <div className="purchases-grid">

            {/* LEFT — form */}
            <div className="left-col">

              <div className="panel">
                <h2 className="panel-title">🛒 Create Purchase Order</h2>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Select Supplier *</label>
                    <select className="form-select" value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}>
                      {supplierOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Order Date *</label>
                    <input className="form-input" type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
                  </div>
                </div>

                {/* Medicine items table */}
                <div className="items-section">
                  <h3 className="items-title">Medicine Items</h3>
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Medicine Name</th>
                        <th>Quantity</th>
                        <th>Unit Price (Rs.)</th>
                        <th>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <input className="item-input" type="text" placeholder="Medicine name"
                              value={item.name} onChange={(e) => handleItemChange(index, "name", e.target.value)} />
                          </td>
                          <td>
                            <input className="item-input item-input-sm" type="number" placeholder="Qty"
                              value={item.quantity} onChange={(e) => handleItemChange(index, "quantity", e.target.value)} />
                          </td>
                          <td>
                            <input className="item-input item-input-sm" type="number" step="0.01" placeholder="Rs. 0.00"
                              value={item.unitPrice} onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)} />
                          </td>
                          {/* Row total shown in NPR */}
                          <td className="item-total">Rs. {itemTotal(item).toFixed(2)}</td>
                          <td>
                            <button className="remove-item-btn" onClick={() => removeItem(index)}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button className="add-item-btn" onClick={addItem}>+ Add Medicine Item</button>
                </div>

                {/* Grand total in NPR */}
                <div className="grand-total-row">
                  <span className="grand-total-label">Grand Total:</span>
                  <span className="grand-total-value">{formatNPR(grandTotal)}</span>
                </div>

                <div className="form-actions">
                  <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
                  <button className="draft-btn" onClick={handleSaveDraft}>Save as Draft</button>
                  <button className="create-btn" onClick={handleCreateOrder}>Create Purchase Order</button>
                </div>
              </div>

              {/* Top Suppliers — amounts in NPR */}
              <div className="panel">
                <h2 className="panel-title">🏭 Top Suppliers</h2>
                <div className="suppliers-list">
                  {suppliers.map((s) => (
                    <div key={s.rank} className="supplier-item">
                      <div className="supplier-rank" style={{ background: s.color }}>{s.rank}</div>
                      <div className="supplier-info">
                        <div className="supplier-name">{s.name}</div>
                        <div className="supplier-detail">
                          Total Orders: {s.orders} | Amount: Rs. {s.amount.toLocaleString()}
                        </div>
                      </div>
                      <button className="view-supplier-btn" style={{ background: s.color }}>View</button>
                    </div>
                  ))}
                </div>
                <button className="view-all-link">View All Suppliers →</button>
              </div>

            </div>

            {/* RIGHT COLUMN */}
            <div className="right-col">

              {/* Recent Purchase Orders — totals in NPR */}
              <div className="panel">
                <h2 className="panel-title">🧾 Recent Purchase Orders</h2>
                <div className="orders-list">
                  {orders.slice(0, 4).map((order) => (
                    <div key={order.id} className="order-item">
                      <div className="order-info">
                        <div className="order-id">{order.id}</div>
                        <div className="order-detail">Supplier: {order.supplier}</div>
                        <div className="order-detail">
                          Total: Rs. {order.total.toLocaleString("en-NP", { minimumFractionDigits: 2 })} | Date: {order.date}
                        </div>
                      </div>
                      <span className={`order-status ${statusClass(order.status)}`}>{order.status}</span>
                    </div>
                  ))}
                </div>
                <button className="view-all-link">View All Purchase Orders →</button>
              </div>

              {/* Purchase Statistics — NPR */}
              <div className="panel">
                <h2 className="panel-title">📊 Purchase Statistics</h2>
                <div className="purchase-stats-grid">
                  <div className="purchase-stat-card stat-blue">
                    <div className="pstat-label">Total Purchase Orders</div>
                    <div className="pstat-value">156</div>
                    <div className="pstat-sub">This Month</div>
                  </div>
                  <div className="purchase-stat-card stat-green">
                    <div className="pstat-label">Total Amount Spent</div>
                    <div className="pstat-value pstat-green">Rs. 456.8K</div>
                    <div className="pstat-sub">This Month</div>
                  </div>
                  <div className="purchase-stat-card stat-orange">
                    <div className="pstat-label">Pending Orders</div>
                    <div className="pstat-value pstat-orange">12</div>
                    <div className="pstat-sub">Awaiting Approval</div>
                  </div>
                  <div className="purchase-stat-card stat-pink">
                    <div className="pstat-label">Active Suppliers</div>
                    <div className="pstat-value pstat-pink">28</div>
                    <div className="pstat-sub">Registered</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagePurchases;