import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  createPurchase,
  createSupplier,
  getMedicines,
  getPurchases,
  getSuppliers,
  updatePurchaseStatus,
} from "../api";
import "./ManagePurchases.css";

const navItems = [
  { label: "Dashboard", icon: "🏠", path: "/dashboard" },
  { label: "Manage Users", icon: "👥", path: "/manage-users" },
  { label: "Manage Inventory",  icon: "📦", path: "/manage-inventory" },
  { label: "Manage Medicines",  icon: "💊", path: "/manage-medicines" },
  { label: "Manage Purchases",  icon: "🛒", path: "/manage-purchases" },
  { label: "Process Sales",  icon: "💰", path: "/process-sales" },
  { label: "Payment", icon: "💳", path: "/payment" },
  { label: "View Reports", icon: "📋", path: "/view-reports" },
];

const emptyItem = { medicine_id: "", quantity: "", unit_price: "" };
const SUPPLIERS_PREVIEW_COUNT = 3;

const nextStatus = (current) => {
  if (current === "Pending")  return "Approved";
  if (current === "Approved") return "Received";
  return null;
};

const ManagePurchases = () => {
  const navigate = useNavigate();

  const formRef = useRef(null);
  const itemsWrapRef  = useRef(null);
  const ordersListRef = useRef(null);

  const [orders,    setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);

  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState([{ ...emptyItem }]);

  const [loading,    setLoading] = useState(false);
  const [error,      setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [hiddenOrders, setHiddenOrders] = useState([]);

  const [showAllSuppliersModal, setShowAllSuppliersModal] = useState(false);
  const [showSupplierModal,  setShowSupplierModal] = useState(false);
  const [supplierDetail,  setSupplierDetail]  = useState(null);

  const [supplierForm, setSupplierForm] = useState({ name: "", contact: "", address: "" });

  useEffect(() => { fetchAll(); }, []); 
  const fetchAll = async () => {
    try {
      const [ordersRes, suppliersRes, medsRes] = await Promise.all([
        getPurchases(), getSuppliers(), getMedicines(),
      ]);
      const ordersData= ordersRes.data   || [];
      const suppliersData = suppliersRes.data || [];
      const medsData  = medsRes.data  || [];

      setOrders(ordersData);
      setSuppliers(suppliersData);
      setMedicines(medsData);

      if (suppliersData.length > 0 && !selectedSupplier) {
        setSelectedSupplier(suppliersData[0].id);
      }
    } catch {
      setError("Failed to load data.");
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

  const handleNewOrder = () => {
    setItems([{ ...emptyItem }]);
    setOrderDate(new Date().toISOString().split("T")[0]);
    if (suppliers.length > 0) setSelectedSupplier(suppliers[0].id);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, { ...emptyItem }]);
    requestAnimationFrame(() => {
      if (!itemsWrapRef.current) return;
      itemsWrapRef.current.scrollTo({
        top: itemsWrapRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  };

  const removeItem = (index) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const itemTotal = (item) =>
    (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);

  const grandTotal = items.reduce((sum, item) => sum + itemTotal(item), 0);

  const formatNPR = (amount) =>
    "Rs. " + Number(amount).toLocaleString("en-NP", { minimumFractionDigits: 2 });

  const getMedicineName = (id) => {
    const med = medicines.find((m) => String(m.id) === String(id));
    return med ? med.name : "Unknown";
  };

  const getSupplierOrders = (supplierName) =>
    orders.filter((o) => o.supplier_name === supplierName);

  const handleCreateOrder = async () => {
    if (!selectedSupplier) { setError("Please select a supplier."); return; }

    const validItems = items.filter((i) => i.medicine_id && i.quantity && i.unit_price);
    if (validItems.length === 0) {
      setError("Please fill in at least one medicine item.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await createPurchase({
        supplier_id: selectedSupplier,
        order_date:  orderDate,
        items: validItems.map((i) => ({
          medicine_id: i.medicine_id,
          quantity:    Number(i.quantity),
          unit_price:  Number(i.unit_price),
        })),
      });
      await fetchAll();
      setItems([{ ...emptyItem }]);
      showSuccess("✅ Purchase order created successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create purchase order.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setItems([{ ...emptyItem }]);
    setOrderDate(new Date().toISOString().split("T")[0]);
    if (suppliers.length > 0) setSelectedSupplier(suppliers[0].id);
    setError("");
  };

  const handleStatusChange = async (orderId, currentStatus) => {
    const next = nextStatus(currentStatus);
    if (!next) return;

    const confirmed = window.confirm(
      `Change order status from "${currentStatus}" to "${next}"?${
        next === "Received"
          ? "\n\nMedicine stock will be added to inventory automatically."
          : ""
      }`
    );
    if (!confirmed) return;

    try {
      await updatePurchaseStatus(orderId, { status: next });
      if (next === "Received") {
        showSuccess("✅ Order marked as Received. Inventory updated!");
        setTimeout(() => setHiddenOrders((prev) => [...prev, orderId]), 3000);
      } else {
        showSuccess(`✅ Order status updated to ${next}`);
      }
      await fetchAll();
    } catch {
      setError("Failed to update status.");
    }
  };

  const handleAddSupplier = async () => {
    if (!supplierForm.name.trim()) { setError("Supplier name is required."); return; }
    try {
      setError("");
      await createSupplier(supplierForm);
      await fetchAll();
      setSupplierForm({ name: "", contact: "", address: "" });
      showSuccess("✅ Supplier added successfully!");
    } catch {
      setError("Failed to add supplier.");
    }
  };

  const handleDeleteSupplier = async (supplier) => {
    const confirmed = window.confirm(
      `Delete supplier "${supplier.name}"?\n\nThis cannot be undone.`
    );
    if (!confirmed) return;
    try {
      setError("");
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/purchases/suppliers/${supplier.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchAll();
      showSuccess("✅ Supplier deleted successfully!");
    } catch {
      setError("Cannot delete supplier with existing orders.");
    }
  };

  const statusClass = (status) => {
    if (status === "Approved") return "status-approved";
    if (status === "Received") return "status-received";
    return "status-pending";
  };

  const visibleOrders = orders.filter((o) => !hiddenOrders.includes(o.id));
  const topSuppliers  = suppliers.slice(0, SUPPLIERS_PREVIEW_COUNT);

  const totalOrders   = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "Pending").length;
  const totalSpent    = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  return (
    <div className="purchases-wrapper">
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
              type="button"
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

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
            <button className="logout-btn" onClick={handleLogout} type="button">Logout</button>
          </div>
        </header>

        <div className="purchases-body">
          <div className="purchases-top-row">
            <div className="page-title">
              <h1>Manage Purchases</h1>
              <p>Create purchase orders and manage suppliers</p>
            </div>
            <div className="top-action-btns">
              <button className="new-order-btn" onClick={handleNewOrder} type="button">
                + New Purchase Order
              </button>
              <button className="manage-suppliers-btn" onClick={() => setShowSupplierModal(true)} type="button">
                🏭 Manage Suppliers
              </button>
            </div>
          </div>

          {error      && <div className="error-message">{error}</div>}
          {successMsg && <div className="success-message">{successMsg}</div>}

          <div className="purchases-grid">
            <div className="left-col">
              <div className="panel panel-create-order" ref={formRef}>
                <h2 className="panel-title">🛒 Create Purchase Order</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Select Supplier *</label>
                    <select className="form-select" value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}>
                      {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Order Date *</label>
                    <input className="form-input" type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
                  </div>
                </div>
                <div className="items-section">
                  <h3 className="items-title">Medicine Items</h3>
                  <div className="items-table-wrap" ref={itemsWrapRef}>
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th>Medicine Name</th>
                          <th>Quantity</th>
                          <th>Unit Price (Rs.)</th>
                          <th>Total</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <select className="item-input" value={item.medicine_id} onChange={(e) => handleItemChange(index, "medicine_id", e.target.value)}>
                                <option value="">Select medicine</option>
                                {medicines.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
                              </select>
                            </td>
                            <td><input className="item-input item-input-sm" type="number" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(index, "quantity", e.target.value)} /></td>
                            <td><input className="item-input item-input-sm" type="number" step="0.01" placeholder="Rs. 0.00" value={item.unit_price} onChange={(e) => handleItemChange(index, "unit_price", e.target.value)} /></td>
                            <td className="item-total">Rs. {itemTotal(item).toFixed(2)}</td>
                            <td><button className="remove-item-btn" onClick={() => removeItem(index)} type="button" title="Remove row">✕</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button className="add-item-btn" onClick={addItem} type="button">+ Add Medicine Item</button>
                </div>
                <div className="grand-total-row">
                  <span className="grand-total-label">Grand Total:</span>
                  <span className="grand-total-value">{formatNPR(grandTotal)}</span>
                </div>
                <div className="form-actions">
                  <button className="cancel-btn" onClick={handleCancel} type="button">Cancel</button>
                  <button className="create-btn" onClick={handleCreateOrder} disabled={loading} type="button">
                    {loading ? "Creating..." : "Create Purchase Order"}
                  </button>
                </div>
              </div>

              <div className="panel panel-suppliers">
                <h2 className="panel-title">🏭 Top Suppliers</h2>
                <div className="suppliers-list">
                  {topSuppliers.map((s, i) => {
                    const colors = ["#2563eb", "#16a34a", "#f59e0b"];
                    return (
                      <div key={s.id} className="supplier-item">
                        <div className="supplier-rank" style={{ background: colors[i] || "#888" }}>{i + 1}</div>
                        <div className="supplier-info">
                          <div className="supplier-name">{s.name}</div>
                          <div className="supplier-detail">{s.contact || "No contact"} | Orders: {getSupplierOrders(s.name).length}</div>
                        </div>
                        <button className="view-supplier-btn" style={{ background: colors[i] || "#888" }} onClick={() => setSupplierDetail(s)} type="button">View</button>
                      </div>
                    );
                  })}
                  {suppliers.length === 0 && <p className="no-results">No suppliers added yet.</p>}
                </div>
                {suppliers.length > SUPPLIERS_PREVIEW_COUNT && (
                  <button className="view-all-link" onClick={() => setShowAllSuppliersModal(true)} type="button">View All Suppliers →</button>
                )}
              </div>
            </div>

            <div className="right-col">
              <div className="panel panel-orders">
                <h2 className="panel-title">🧾 Recent Purchase Orders</h2>
                <div className="orders-area">
                  <div className="orders-list" ref={ordersListRef}>
                    {visibleOrders.map((order) => (
                      <div key={order.id} className="order-item">
                        <div className="order-info">
                          <div className="order-id">PO-{String(order.id).padStart(3, "0")}</div>
                          <div className="order-detail">Supplier: {order.supplier_name}</div>
                          <div className="order-detail">Total: {formatNPR(order.total_amount)} | Date: {new Date(order.order_date).toLocaleDateString()}</div>
                          {nextStatus(order.status) && (
                            <button className="status-update-btn" onClick={() => handleStatusChange(order.id, order.status)} type="button">
                              Mark as {nextStatus(order.status)}
                            </button>
                          )}
                        </div>
                        <span className={`order-status ${statusClass(order.status)}`}>{order.status}</span>
                      </div>
                    ))}
                    {visibleOrders.length === 0 && <p className="no-results">No purchase orders yet.</p>}
                  </div>
                </div>
              </div>

              <div className="panel panel-stats">
                <h2 className="panel-title">📊 Purchase Statistics</h2>
                <div className="purchase-stats-grid">
                  <div className="purchase-stat-card stat-blue">
                    <div className="pstat-label">Total Purchase Orders</div>
                    <div className="pstat-value">{totalOrders}</div>
                    <div className="pstat-sub">All Time</div>
                  </div>
                  <div className="purchase-stat-card stat-green">
                    <div className="pstat-label">Total Amount Spent</div>
                    <div className="pstat-value pstat-green">{formatNPR(totalSpent)}</div>
                    <div className="pstat-sub">All Time</div>
                  </div>
                  <div className="purchase-stat-card stat-orange">
                    <div className="pstat-label">Pending Orders</div>
                    <div className="pstat-value pstat-orange">{pendingOrders}</div>
                    <div className="pstat-sub">Awaiting Approval</div>
                  </div>
                  <div className="purchase-stat-card stat-pink">
                    <div className="pstat-label">Active Suppliers</div>
                    <div className="pstat-value pstat-pink">{suppliers.length}</div>
                    <div className="pstat-sub">Registered</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSupplierModal && (
        <div className="modal-overlay" onClick={() => setShowSupplierModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">🏭 Manage Suppliers</h2>
            <h3 className="supplier-section-title">Add New Supplier</h3>
            <div className="form-group">
              <label className="form-label">Supplier Name *</label>
              <input className="form-input" type="text" placeholder="Enter supplier name" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Contact</label>
              <input className="form-input" type="text" placeholder="Phone or email" value={supplierForm.contact} onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Address</label>
              <input className="form-input" type="text" placeholder="Supplier address" value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} />
            </div>
            <button className="modal-save-btn" onClick={handleAddSupplier} type="button">Add Supplier</button>
            <h3 className="supplier-section-title" style={{ marginTop: 22 }}>Delete Supplier</h3>
            <div className="delete-suppliers-list">
              {suppliers.map((s) => (
                <div key={s.id} className="delete-supplier-row">
                  <div>
                    <div className="supplier-name">{s.name}</div>
                    <div className="supplier-detail">{s.contact || "No contact"}</div>
                  </div>
                  <button className="delete-supplier-btn" onClick={() => handleDeleteSupplier(s)} type="button">Delete</button>
                </div>
              ))}
              {suppliers.length === 0 && <p className="no-results">No suppliers to delete.</p>}
            </div>
            <button className="modal-cancel-btn" onClick={() => setShowSupplierModal(false)} type="button">Close</button>
          </div>
        </div>
      )}

      {showAllSuppliersModal && (
        <div className="modal-overlay" onClick={() => setShowAllSuppliersModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">🏭 All Suppliers ({suppliers.length})</h2>
            <div className="delete-suppliers-list">
              {suppliers.map((s) => (
                <div key={s.id} className="supplier-expanded-item">
                  <div className="supplier-expanded-info">
                    <div className="supplier-name">{s.name}</div>
                    <div className="supplier-detail">📞 {s.contact || "No contact"}</div>
                    <div className="supplier-detail">📍 {s.address || "No address"}</div>
                    <div className="supplier-detail">
                      Orders: {getSupplierOrders(s.name).length} &nbsp;|&nbsp; Total:{" "}
                      {"Rs. " + getSupplierOrders(s.name).reduce((sum, o) => sum + Number(o.total_amount), 0).toLocaleString("en-NP", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <button className="view-supplier-btn" style={{ background: "#2563eb" }} onClick={() => { setSupplierDetail(s); setShowAllSuppliersModal(false); }} type="button">View</button>
                </div>
              ))}
              {suppliers.length === 0 && <p className="no-results">No suppliers added yet.</p>}
            </div>
            <button className="modal-cancel-btn" onClick={() => setShowAllSuppliersModal(false)} type="button">Close</button>
          </div>
        </div>
      )}

      {supplierDetail && (
        <div className="modal-overlay" onClick={() => setSupplierDetail(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">🏭 {supplierDetail.name}</h2>
            <div className="supplier-detail-card">
              <div className="detail-row"><span className="detail-label">Contact</span><span>{supplierDetail.contact || "Not provided"}</span></div>
              <div className="detail-row"><span className="detail-label">Address</span><span>{supplierDetail.address || "Not provided"}</span></div>
              <div className="detail-row"><span className="detail-label">Total Orders</span><span>{getSupplierOrders(supplierDetail.name).length}</span></div>
              <div className="detail-row">
                <span className="detail-label">Total Spent</span>
                <span className="detail-amount">{formatNPR(getSupplierOrders(supplierDetail.name).reduce((sum, o) => sum + Number(o.total_amount), 0))}</span>
              </div>
            </div>
            <h3 className="supplier-section-title" style={{ marginTop: 16 }}>Order History</h3>
            <div className="delete-suppliers-list">
              {getSupplierOrders(supplierDetail.name).map((o) => (
                <div key={o.id} className="order-history-item">
                  <div className="order-history-header">
                    <span className="supplier-name">PO-{String(o.id).padStart(3, "0")} — {formatNPR(o.total_amount)}</span>
                    <span className={`order-status ${statusClass(o.status)}`}>{o.status}</span>
                  </div>
                  <div className="supplier-detail">Date: {new Date(o.order_date).toLocaleDateString()}</div>
                  {o.items && o.items.length > 0 && (
                    <div className="order-medicines-list">
                      {o.items.map((item, idx) => (
                        <div key={idx} className="order-medicine-row">
                          <span>💊 {getMedicineName(item.medicine_id)}</span>
                          <span>Qty: {item.quantity} | {formatNPR(item.unit_price)} each</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {getSupplierOrders(supplierDetail.name).length === 0 && <p className="no-results">No orders from this supplier yet.</p>}
            </div>
            <button className="modal-cancel-btn" onClick={() => setSupplierDetail(null)} type="button">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePurchases;