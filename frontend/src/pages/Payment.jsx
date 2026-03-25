import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Payment.css";

// Payment page — MediTrack Pharmacy System
// Payment methods: Cash, Digital Wallet, Bank Transfer only (no card)
// Currency: Nepali Rupees (Rs.)

// Sample recent payments
const initialPayments = [
  { invoice: "INV-2025-001", customer: "John Doe",         method: "Cash",           amount: 3400,  status: "Paid" },
  { invoice: "INV-2025-002", customer: "Sarah Smith",      method: "Digital Wallet", amount: 2450,  status: "Paid" },
  { invoice: "INV-2025-003", customer: "Walk-in Customer", method: "Bank Transfer",  amount: 1695,  status: "Paid" },
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

const Payment = () => {
  const navigate = useNavigate();

  // Load cart data passed from Process Sales page
  const cartRaw   = localStorage.getItem("cartData");
  const cartData  = cartRaw ? JSON.parse(cartRaw) : null;

  // Use cart data if available, otherwise use sample data
  const cart         = cartData?.cart         || [
    { name: "Paracetamol 500mg", qty: 2, price: 335  },
    { name: "Ibuprofen 400mg",   qty: 1, price: 425  },
    { name: "Cetirizine 10mg",   qty: 3, price: 240  },
  ];
  const customerName  = cartData?.customerName  || "John Doe";
  const customerPhone = cartData?.customerPhone || "+977-9812345678";
  const subtotal      = cartData?.subtotal      || cart.reduce((s, c) => s + c.price * c.qty, 0);
  const tax           = cartData?.tax           || subtotal * 0.05;
  const total         = cartData?.total         || subtotal + tax;

  // Payment method selection — Cash, Digital Wallet, Bank Transfer
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amountReceived, setAmountReceived] = useState("");
  const [payments, setPayments]             = useState(initialPayments);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // Change to return for cash payment
  const changeToReturn = () => {
    const received = parseFloat(amountReceived) || 0;
    return Math.max(0, received - total);
  };

  // Complete payment — add to recent payments and clear cart
  const handleCompletePayment = () => {
    const newInvoice = `INV-2025-00${payments.length + 1}`;
    const newPayment = {
      invoice:  newInvoice,
      customer: customerName || "Walk-in Customer",
      method:   paymentMethod,
      amount:   total,
      status:   "Paid",
    };
    setPayments([newPayment, ...payments]);
    localStorage.removeItem("cartData");
    alert(`Payment completed! Invoice: ${newInvoice}`);
    navigate("/process-sales");
  };

  // Cancel — go back to cart
  const handleCancel = () => navigate("/process-sales");

  // Today's date string
  const today = new Date().toLocaleDateString("en-NP", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="payment-wrapper">

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
              className={`nav-link ${item.path === "/payment" ? "active" : ""}`}
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
            <span className="header-admin-label">Staff</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        {/* ── Scrollable body ── */}
        <div className="payment-body">

          <div className="page-title">
            <h1>Payment</h1>
            <p>Process customer payment and generate invoice</p>
          </div>

          {/* ── Two column layout ── */}
          <div className="payment-grid">

            {/* LEFT — Order Summary */}
            <div className="left-col">
              <div className="panel">
                <h2 className="panel-title">🧾 Order Summary</h2>
                <p className="invoice-number">Invoice #: INV-2025-004</p>

                {/* Cart items list */}
                <div className="order-items">
                  {cart.map((item, i) => (
                    <div key={i} className="order-item-row">
                      <div className="order-item-info">
                        <div className="order-item-name">{item.name}</div>
                        <div className="order-item-detail">
                          Qty: {item.qty} × Rs. {item.price.toLocaleString()}
                        </div>
                      </div>
                      <div className="order-item-total">
                        Rs. {(item.qty * item.price).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="order-totals">
                  <div className="order-total-row">
                    <span>Subtotal:</span>
                    <span>Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="order-total-row">
                    <span>Tax (5%):</span>
                    <span>Rs. {tax.toFixed(2)}</span>
                  </div>
                  <div className="order-total-row">
                    <span>Discount:</span>
                    <span className="discount-text">-Rs. 0.00</span>
                  </div>
                  <div className="order-total-row grand-row">
                    <span>Total Amount:</span>
                    <span className="grand-amount">Rs. {total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Customer details */}
                <div className="customer-details">
                  <div className="customer-details-title">Customer Details</div>
                  <div className="customer-detail-row">Name: {customerName || "Walk-in Customer"}</div>
                  <div className="customer-detail-row">Phone: {customerPhone || "—"}</div>
                  <div className="customer-detail-row">Date: {today} | 2:30 PM</div>
                </div>

                {/* Back to Cart button */}
                <button className="back-btn" onClick={handleCancel}>← Back to Cart</button>
              </div>
            </div>

            {/* RIGHT — Payment Method */}
            <div className="right-col">
              <div className="panel">
                <h2 className="panel-title">💳 Select Payment Method</h2>

                {/* Payment method cards — Cash, Digital Wallet, Bank Transfer */}
                <div className="payment-methods">

                  {/* Cash */}
                  <div
                    className={`method-card ${paymentMethod === "Cash" ? "method-active" : ""}`}
                    onClick={() => setPaymentMethod("Cash")}
                  >
                    <div className="method-radio">
                      <div className={`radio-dot ${paymentMethod === "Cash" ? "radio-on" : ""}`}></div>
                    </div>
                    <div>
                      <div className="method-name">💵 Cash</div>
                      <div className="method-desc">Pay with cash</div>
                    </div>
                  </div>

                  {/* Digital Wallet */}
                  <div
                    className={`method-card ${paymentMethod === "Digital Wallet" ? "method-active" : ""}`}
                    onClick={() => setPaymentMethod("Digital Wallet")}
                  >
                    <div className="method-radio">
                      <div className={`radio-dot ${paymentMethod === "Digital Wallet" ? "radio-on" : ""}`}></div>
                    </div>
                    <div>
                      <div className="method-name">📱 Digital Wallet</div>
                      <div className="method-desc">Pay via eSewa, Khalti, IME Pay</div>
                    </div>
                  </div>

                  {/* Bank Transfer */}
                  <div
                    className={`method-card ${paymentMethod === "Bank Transfer" ? "method-active" : ""}`}
                    onClick={() => setPaymentMethod("Bank Transfer")}
                  >
                    <div className="method-radio">
                      <div className={`radio-dot ${paymentMethod === "Bank Transfer" ? "radio-on" : ""}`}></div>
                    </div>
                    <div>
                      <div className="method-name">🏦 Bank Transfer</div>
                      <div className="method-desc">Pay via bank transfer</div>
                    </div>
                  </div>

                </div>

                {/* Cash payment details — only shown when Cash is selected */}
                {paymentMethod === "Cash" && (
                  <div className="cash-details">
                    <div className="cash-details-title">Cash Payment Details</div>
                    <div className="cash-fields">
                      <div className="cash-field-group">
                        <label className="cash-label">Amount Received</label>
                        <input
                          className="cash-input"
                          type="number"
                          placeholder="Rs. 0.00"
                          value={amountReceived}
                          onChange={(e) => setAmountReceived(e.target.value)}
                        />
                      </div>
                      <div className="cash-field-group">
                        <label className="cash-label">Change to Return</label>
                        <input
                          className="cash-input cash-change"
                          type="text"
                          readOnly
                          value={`Rs. ${changeToReturn().toFixed(2)}`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Digital Wallet details */}
                {paymentMethod === "Digital Wallet" && (
                  <div className="cash-details">
                    <div className="cash-details-title">Digital Wallet Details</div>
                    <div className="cash-field-group">
                      <label className="cash-label">Wallet / Transaction ID</label>
                      <input className="cash-input" type="text" placeholder="Enter transaction ID..." />
                    </div>
                  </div>
                )}

                {/* Bank Transfer details */}
                {paymentMethod === "Bank Transfer" && (
                  <div className="cash-details">
                    <div className="cash-details-title">Bank Transfer Details</div>
                    <div className="cash-field-group">
                      <label className="cash-label">Bank Reference Number</label>
                      <input className="cash-input" type="text" placeholder="Enter bank reference number..." />
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="payment-actions">
                  <button className="cancel-payment-btn" onClick={handleCancel}>Cancel Payment</button>
                  <button className="complete-payment-btn" onClick={handleCompletePayment}>
                    ✓ Complete Payment
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* Recent Payments table */}
          <div className="panel">
            <h2 className="panel-title">📊 Recent Payments</h2>
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Payment Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 5).map((p) => (
                  <tr key={p.invoice}>
                    <td className="invoice-link">{p.invoice}</td>
                    <td>{p.customer}</td>
                    <td>{p.method}</td>
                    <td className="amount-cell">Rs. {p.amount.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${p.status === "Paid" ? "status-paid" : "status-pending"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <button className="view-invoice-btn">View Invoice</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Payment;