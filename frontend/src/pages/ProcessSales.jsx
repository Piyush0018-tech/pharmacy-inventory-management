import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMedicines, getTodaySales, getSaleById } from "../api";
import "./ProcessSales.css";

const navItems = [
  { label: "Dashboard", icon: "🏠", path: "/dashboard"        },
  { label: "Manage Users", icon: "👥", path: "/manage-users"     },
  { label: "Manage Inventory", icon: "📦", path: "/manage-inventory" },
  { label: "Manage Medicines", icon: "💊", path: "/manage-medicines" },
  { label: "Manage Purchases", icon: "🛒", path: "/manage-purchases" },
  { label: "Process Sales",  icon: "💰", path: "/process-sales"    },
  { label: "Payment",   icon: "💳", path: "/payment"          },
  { label: "View Reports", icon: "📋", path: "/view-reports"     },
];

const TAX_RATE = 0.05;
const CART_KEY = "cartData";

const ProcessSales = () => {
  const navigate = useNavigate();

  // Read logged in user from localStorage to show correct role in header
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole     = loggedInUser.role || "Staff";

  const [medicines, setMedicines]   = useState([]);
  const [sales, setSales]    = useState([]);
  const [searchQuery, setSearchQuery]  = useState("");
  const [cart, setCart]    = useState([]);
  const [customerName, setCustomerName]     = useState("");
  const [customerPhone, setCustomerPhone]   = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [error, setError]  = useState("");
  const [page, setPage]  = useState(1);
  const pageSize = 4;

  // Sale details modal
  const [viewModal, setViewModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchMedicines();
    fetchTodaySales();
  }, []);

  // Restore cart if user came back from Payment using "Back to Cart"
  useEffect(() => {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      if (saved?.cart?.length) {
        setCart(saved.cart);
        setCustomerName(saved.customerName || "");
        setCustomerPhone(saved.customerPhone || "");
        setDiscountPercent(Number(saved.discountPercent || 0));
      }
    } catch {
      localStorage.removeItem(CART_KEY);
    }
  }, []);

  // Keep cartData in localStorage updated while user edits cart
  useEffect(() => {
    const hasData =
      cart.length > 0 ||
      customerName.trim() ||
      customerPhone.trim() ||
      Number(discountPercent) > 0;

    if (!hasData) {
      localStorage.removeItem(CART_KEY);
      return;
    }

    const subtotal       = cart.reduce((sum, c) => sum + Number(c.price) * c.qty, 0);
    const tax            = subtotal * TAX_RATE;
    const discountAmount = subtotal * (Number(discountPercent) / 100);
    const total          = Math.max(0, subtotal + tax - discountAmount);

    localStorage.setItem(CART_KEY, JSON.stringify({
      cart, customerName, customerPhone,
      subtotal, tax, discount: discountAmount, discountPercent, total,
    }));
  }, [cart, customerName, customerPhone, discountPercent]);

  const fetchMedicines = async () => {
    try {
      const res = await getMedicines();
      setMedicines(res.data);
    } catch {
      setError("Failed to load medicines.");
    }
  };

  const fetchTodaySales = async () => {
    try {
      const res = await getTodaySales();
      setSales(res.data);
      setPage(1);
    } catch {
      setError("Failed to load today's sales.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const filteredMedicines = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return medicines.filter(
      (m) => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
    );
  }, [medicines, searchQuery]);

  const addToCart = (medicine) => {
    const exists = cart.find((c) => c.id === medicine.id);
    if (exists) {
      setCart(cart.map((c) => c.id === medicine.id ? { ...c, qty: c.qty + 1 } : c));
      return;
    }
    setCart([...cart, { ...medicine, qty: 1 }]);
  };

  const updateQty = (id, qty) => {
    if (qty < 1) return;
    setCart(cart.map((c) => c.id === id ? { ...c, qty } : c));
  };

  const removeFromCart = (id) => setCart(cart.filter((c) => c.id !== id));

  const clearCart = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setDiscountPercent(0);
    setError("");
    localStorage.removeItem(CART_KEY);
  };

  const subtotal       = cart.reduce((sum, c) => sum + Number(c.price) * c.qty, 0);
  const tax            = subtotal * TAX_RATE;
  const discountAmount = subtotal * (Number(discountPercent) / 100);
  const total          = Math.max(0, subtotal + tax - discountAmount);

  const handleProceedToPayment = () => {
    if (cart.length === 0) {
      setError("Please add at least one medicine to cart.");
      return;
    }
    if (!customerName.trim()) {
      setError("Please enter customer name.");
      return;
    }
    setError("");
    localStorage.setItem(CART_KEY, JSON.stringify({
      cart, customerName, customerPhone,
      subtotal, tax, discount: discountAmount, discountPercent, total,
    }));
    navigate("/payment");
  };

  const handleViewSale = async (sale) => {
    setViewModal(true);
    setModalLoading(true);
    setSelectedSale(null);
    try {
      const res = await getSaleById(sale.id);
      setSelectedSale({ ...res.data.sale, items: res.data.items });
    } catch {
      setSelectedSale(sale);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setViewModal(false);
    setSelectedSale(null);
  };

  const getSaleDiscount = (sale) => {
    if (!sale) return 0;
    const direct = sale.discount ?? sale.discount_amount ?? sale.discountAmount ?? sale.discount_value ?? sale.discountValue;
    const directNum = Number(direct);
    if (!Number.isNaN(directNum) && direct !== undefined && direct !== null) {
      return Math.max(0, directNum);
    }
    const s   = Number(sale.subtotal);
    const t   = Number(sale.tax);
    const tot = Number(sale.total);
    if (!Number.isNaN(s) && !Number.isNaN(t) && !Number.isNaN(tot)) {
      return Math.max(0, s + t - tot);
    }
    return 0;
  };

  const totalPages = Math.max(1, Math.ceil(sales.length / pageSize));

  const paginatedSales = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sales.slice(start, start + pageSize);
  }, [sales, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  return (
    <div className="sales-wrapper">

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
              className={`nav-link ${item.path === "/process-sales" ? "active" : ""}`}
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
            {/* Show actual logged in user role from localStorage */}
            <span className="header-admin-label">{userRole}</span>
            <button className="logout-btn" onClick={handleLogout} type="button">
              Logout
            </button>
          </div>
        </header>

        <div className="sales-body">
          <div className="page-title">
            <h1>Process Sales</h1>
            <p>Search medicines and process customer sales</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="sales-grid">

            {/* Search Medicine */}
            <div className="panel top-card">
              <h2 className="panel-title">🔍 Search Medicine</h2>
              <div className="search-row">
                <div className="search-wrapper">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by medicine name, ID, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button className="search-btn" type="button">Search</button>
              </div>

              <div className="medicines-label">Available Medicines</div>
              <div className="medicines-list">
                {filteredMedicines.length === 0 ? (
                  <p className="empty-text">No medicines found.</p>
                ) : (
                  filteredMedicines.map((med) => (
                    <div key={med.id} className="medicine-row">
                      <div className="medicine-info">
                        <div className="medicine-name">{med.name}</div>
                        <div className="medicine-detail">
                          Category: {med.category} | Stock: {Number(med.quantity).toLocaleString()} units | Price: Rs. {Number(med.price).toLocaleString()}
                        </div>
                      </div>
                      <button
                        className="add-to-cart-btn"
                        onClick={() => addToCart(med)}
                        disabled={med.quantity === 0}
                        type="button"
                      >
                        {med.quantity === 0 ? "Out of Stock" : "+ Add to Cart"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Shopping Cart */}
            <div className="cart-panel top-card">
              <div className="cart-header">
                <h2 className="cart-title">🛒 Shopping Cart</h2>
                {cart.length > 0 && (
                  <span className="cart-badge">{cart.reduce((sum, c) => sum + c.qty, 0)}</span>
                )}
              </div>

              <div className="cart-items">
                {cart.length === 0 ? (
                  <p className="cart-empty">No items in cart. Add medicines to get started.</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-top">
                        <div className="cart-item-name">{item.name}</div>
                        <button className="cart-remove-btn" onClick={() => removeFromCart(item.id)} type="button">✕</button>
                      </div>
                      <div className="cart-item-price">Price: Rs. {Number(item.price).toLocaleString()}</div>
                      <div className="cart-item-bottom">
                        <input
                          className="cart-qty-input"
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateQty(item.id, Number(e.target.value))}
                        />
                        <span className="cart-item-total">Rs. {(Number(item.price) * item.qty).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="cart-totals">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="total-row">
                  <span>Tax (5%):</span>
                  <span>Rs. {tax.toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Discount (%):</span>
                  <div className="discount-wrapper">
                    <input
                      className="discount-input"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                    />
                  </div>
                </div>
                {discountAmount > 0 && (
                  <div className="total-row discount-amount-row">
                    <span>Discount Amount:</span>
                    <span className="discount-amount-val">- Rs. {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="total-row grand">
                  <span>Total:</span>
                  <span className="grand-total-val">Rs. {total.toFixed(2)}</span>
                </div>
              </div>

              <div className="customer-section">
                <div className="customer-label">Customer Name *</div>
                <input
                  className="customer-input"
                  type="text"
                  placeholder="Enter customer name..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <div className="customer-label" style={{ marginTop: "10px" }}>Phone Number (Optional)</div>
                <input
                  className="customer-input"
                  type="text"
                  placeholder="Enter phone number..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              <div className="cart-actions">
                <button className="clear-cart-btn" onClick={clearCart} type="button">Clear Cart</button>
                <button
                  className="proceed-btn"
                  onClick={handleProceedToPayment}
                  disabled={cart.length === 0}
                  type="button"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>

            {/* Recent Sales Today */}
            <div className="panel recent-sales-full">
              <h2 className="panel-title">📊 Recent Sales Today</h2>
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length > 0 ? (
                    paginatedSales.map((sale) => (
                      <tr key={sale.id}>
                        <td className="invoice-link">{sale.invoice_number}</td>
                        <td>{sale.customer_name || "Walk-in"}</td>
                        <td className="amount-cell">Rs. {Number(sale.total).toLocaleString()}</td>
                        <td>{sale.payment_method}</td>
                        <td>
                          <button className="view-btn" onClick={() => handleViewSale(sale)} type="button">View</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="no-results">No sales today yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {sales.length > pageSize && (
                <div className="pagination">
                  <button className="page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} type="button">Prev</button>
                  <span className="page-info">Page {page} of {totalPages}</span>
                  <button className="page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} type="button">Next</button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Sale Details Modal */}
      {viewModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sale Details</h2>
              <button className="modal-close-btn" onClick={closeModal} type="button">✕</button>
            </div>
            {modalLoading ? (
              <p style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>Loading...</p>
            ) : selectedSale ? (
              <div className="modal-content">
                <div className="modal-info-row">
                  <span className="modal-info-label">Invoice #</span>
                  <span className="modal-info-value">{selectedSale.invoice_number}</span>
                </div>
                <div className="modal-info-row">
                  <span className="modal-info-label">Customer</span>
                  <span className="modal-info-value">{selectedSale.customer_name || "Walk-in"}</span>
                </div>
                <div className="modal-info-row">
                  <span className="modal-info-label">Phone</span>
                  <span className="modal-info-value">{selectedSale.customer_phone || "—"}</span>
                </div>
                <div className="modal-info-row">
                  <span className="modal-info-label">Payment Method</span>
                  <span className="modal-info-value">{selectedSale.payment_method}</span>
                </div>
                <div className="modal-info-row">
                  <span className="modal-info-label">Date</span>
                  <span className="modal-info-value">{new Date(selectedSale.created_at).toLocaleString()}</span>
                </div>
                {selectedSale.items?.length > 0 && (
                  <div style={{ marginTop: "16px" }}>
                    <h3 className="modal-items-title">Items Purchased</h3>
                    <table className="modal-items-table">
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSale.items.map((item, i) => (
                          <tr key={i}>
                            <td>{item.medicine_name}</td>
                            <td>{item.quantity}</td>
                            <td>Rs. {Number(item.unit_price).toLocaleString()}</td>
                            <td>Rs. {Number(item.total).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="modal-totals">
                  <div className="modal-info-row">
                    <span className="modal-info-label">Subtotal</span>
                    <span className="modal-info-value">Rs. {Number(selectedSale.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="modal-info-row">
                    <span className="modal-info-label">Tax (5%)</span>
                    <span className="modal-info-value">Rs. {Number(selectedSale.tax).toLocaleString()}</span>
                  </div>
                  <div className="modal-info-row">
                    <span className="modal-info-label">Discount</span>
                    <span className="modal-info-value" style={{ color: "#ef4444" }}>
                      - Rs. {getSaleDiscount(selectedSale).toLocaleString()}
                    </span>
                  </div>
                  <div className="modal-info-row modal-grand-total">
                    <span className="modal-info-label">Total</span>
                    <span className="modal-info-value" style={{ color: "#16a34a", fontWeight: 700 }}>
                      Rs. {Number(selectedSale.total).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ textAlign: "center", padding: "20px", color: "#ef4444" }}>Failed to load sale details.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ProcessSales;