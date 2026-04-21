import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import { createSale, getTodaySales, getSaleById } from "../api";
import "./Payment.css";

const navItems = [
  { label: "Dashboard",  icon: "🏠", path: "/dashboard"        },
  { label: "Manage Users", icon: "👥", path: "/manage-users"     },
  { label: "Manage Inventory", icon: "📦", path: "/manage-inventory" },
  { label: "Manage Medicines", icon: "💊", path: "/manage-medicines" },
  { label: "Manage Purchases", icon: "🛒", path: "/manage-purchases" },
  { label: "Process Sales", icon: "💰", path: "/process-sales"    },
  { label: "Payment", icon: "💳", path: "/payment"          },
  { label: "View Reports", icon: "📋", path: "/view-reports"     },
];

const CART_KEY = "cartData";

// Safe number helper — prevents NaN in UI/PDF
const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Date time format helper
const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const Payment = () => {
  const navigate = useNavigate();

  // Read logged in user from localStorage to show correct role in header
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = loggedInUser.role || "Staff";

  // cartData is only for "current payment being processed"
  const [cartData, setCartData]   = useState(null);
  const [cartReady, setCartReady] = useState(false);

  const cart  = cartData?.cart || [];
  const customerName  = cartData?.customerName  || "";
  const customerPhone = cartData?.customerPhone || "";
  const subtotal = safeNum(cartData?.subtotal      || 0);
  const tax  = safeNum(cartData?.tax   || 0);
  const total  = safeNum(cartData?.total  || 0);
  const discount = safeNum(cartData?.discount  || 0);
  const discountPercent = safeNum(cartData?.discountPercent || 0);

  const [paymentMethod, setPaymentMethod]   = useState("Cash");
  const [amountReceived, setAmountReceived]   = useState("");
  const [walletTransactionId, setWalletTransactionId] = useState("");
  const [recentPayments, setRecentPayments]   = useState([]);
  const [page, setPage]  = useState(1);
  const pageSize = 5;
  const [loading, setLoading] = useState(false);
  const [error, setError]  = useState("");

  // Invoice modal
  const [invoiceModal, setInvoiceModal]   = useState(false);
  const [selectedSale, setSelectedSale]   = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // Load cartData once on mount
  useEffect(() => {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) {
      setCartData(null);
      setCartReady(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed?.cart || parsed.cart.length === 0) {
        localStorage.removeItem(CART_KEY);
        setCartData(null);
        setCartReady(true);
        return;
      }
      setCartData(parsed);
      setCartReady(true);
    } catch {
      localStorage.removeItem(CART_KEY);
      setCartData(null);
      setCartReady(true);
    }
  }, []);

  useEffect(() => {
    fetchRecentPayments();
  }, []);

  const fetchRecentPayments = async () => {
    try {
      const res = await getTodaySales();
      setRecentPayments(res.data || []);
    } catch {
      setError("Failed to load recent payments.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Back to cart — go back to Process Sales (cartData stays in localStorage)
  const handleBackToCart = () => navigate("/process-sales");

  // Cancel payment — clear cartData and go back
  const handleCancelPayment = () => {
    localStorage.removeItem(CART_KEY);
    setCartData(null);
    setPaymentMethod("Cash");
    setAmountReceived("");
    setWalletTransactionId("");
    setError("");
    navigate("/process-sales");
  };

  // Cash change to return
  const changeToReturn = () => {
    const received = parseFloat(amountReceived) || 0;
    return Math.max(0, received - total);
  };

  // Get discount from sale object — handles multiple possible field names
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

  // Customer name is required when cart exists
  const isNameMissing = Boolean(cartData) && !customerName.trim();

  const handleCompletePayment = async () => {
    if (!cartData || cart.length === 0) {
      setError("No active cart. Please add medicines in Process Sales first.");
      return;
    }
    if (!customerName.trim()) {
      setError("Customer name is required. Please go back to Process Sales.");
      return;
    }
    if (paymentMethod === "Cash") {
      const received = parseFloat(amountReceived) || 0;
      if (received < total) {
        setError("Amount received must be greater than or equal to total.");
        return;
      }
    }
    if (paymentMethod === "Digital Wallet" && !walletTransactionId.trim()) {
      setError("Please enter Wallet / Transaction ID.");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await createSale({
        customer_name:  customerName.trim(),
        customer_phone: customerPhone?.trim() || null,
        payment_method: paymentMethod,
        subtotal, tax, discount, total,
        wallet_transaction_id: paymentMethod === "Digital Wallet" ? walletTransactionId.trim() : null,
        items: cart.map((item) => ({
          medicine_id: item.id,
          quantity:    item.qty,
          unit_price:  Number(item.price),
        })),
      });
      localStorage.removeItem(CART_KEY);
      setCartData(null);
      fetchRecentPayments();
      alert("Payment completed successfully!");
      navigate("/process-sales");
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString("en-NP", {
    year: "numeric", month: "long", day: "numeric",
  });

  // View invoice — load full details from backend
  const handleViewInvoice = async (sale) => {
    setInvoiceModal(true);
    setInvoiceLoading(true);
    setSelectedSale(null);
    try {
      const res  = await getSaleById(sale.id);
      const data = res?.data || {};
      const saleObj = data.sale || data;
      const items   = data.items || saleObj.items || saleObj.sale_items || [];
      setSelectedSale({ ...saleObj, items });
    } catch {
      setSelectedSale(sale);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const closeInvoiceModal = () => {
    setInvoiceModal(false);
    setSelectedSale(null);
  };

  const discountLabel = useMemo(() => {
    if (discountPercent > 0) return `${discountPercent}%`;
    return "—";
  }, [discountPercent]);

  const totalPages = Math.max(1, Math.ceil(recentPayments.length / pageSize));

  const paginatedPayments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return recentPayments.slice(start, start + pageSize);
  }, [recentPayments, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  // Normalize invoice items for table display
  const invoiceItems = useMemo(() => {
    const items = selectedSale?.items || selectedSale?.sale_items || [];
    if (!Array.isArray(items)) return [];
    return items.map((it) => ({
      name:      it.medicine_name || it.name || it.medicine?.name || "—",
      qty:       safeNum(it.quantity ?? it.qty ?? 0),
      price:     safeNum(it.unit_price ?? it.price ?? 0),
      lineTotal: safeNum(it.total ?? (safeNum(it.quantity ?? it.qty ?? 0) * safeNum(it.unit_price ?? it.price ?? 0))),
    }));
  }, [selectedSale]);

  // Download invoice as PDF
  const downloadInvoicePdf = () => {
    if (!selectedSale) return;
    const doc  = new jsPDF({ unit: "pt", format: "a4" });
    const left = 50;
    let y      = 60;
    const gap  = 18;

    const line = (txt = "", bold = false) => {
      doc.setFont("courier", bold ? "bold" : "normal");
      doc.setFontSize(11);
      if (y > 780) { doc.addPage(); y = 60; }
      doc.text(String(txt), left, y);
      y += gap;
    };

    const divider = () => line("====================================================");

    line("MEDITRACK PHARMACY - INVOICE", true);
    line(`Invoice #: ${selectedSale.invoice_number || "—"}`);
    line(`Date: ${formatDateTime(selectedSale.created_at)}`);
    divider();
    line("PAYMENT DETAILS", true);
    line("----------------------------------------------");
    line(`Status         : ${selectedSale.status || "Paid"}`);
    line(`Payment Method : ${selectedSale.payment_method || "—"}`);
    line(`Wallet Txn ID  : ${selectedSale.wallet_transaction_id || selectedSale.walletTransactionId || "—"}`);
    line("");
    divider();
    line("CUSTOMER DETAILS", true);
    line("----------------------------------------------");
    line(`Customer: ${selectedSale.customer_name || "—"}`);
    line(`Phone   : ${selectedSale.customer_phone || "—"}`);
    line("");
    divider();
    line("ITEMS", true);
    line("----------------------------------------------");
    if (invoiceItems.length === 0) {
      line("No items found.");
    } else {
      invoiceItems.forEach((it, idx) => {
        line(`${idx + 1}. ${it.name} | Qty: ${it.qty} | Price: Rs. ${it.price} | Total: Rs. ${it.lineTotal}`);
      });
    }
    line("");
    divider();
    line("TOTALS", true);
    line("----------------------------------------------");
    line(`Subtotal : Rs. ${safeNum(selectedSale.subtotal).toLocaleString()}`);
    line(`Tax (5%) : Rs. ${safeNum(selectedSale.tax).toLocaleString()}`);
    line(`Discount : -Rs. ${safeNum(getSaleDiscount(selectedSale)).toLocaleString()}`);
    line(`Total    : Rs. ${safeNum(selectedSale.total).toLocaleString()}`);

    doc.save(`invoice-${selectedSale.invoice_number || "sale"}.pdf`);
  };

  if (!cartReady) {
    return <div style={{ padding: 20, fontFamily: "Segoe UI" }}>Loading Payment...</div>;
  }

  return (
    <div className="payment-wrapper">

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
              className={`nav-link ${item.path === "/payment" ? "active" : ""}`}
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
            <button className="logout-btn" onClick={handleLogout} type="button">Logout</button>
          </div>
        </header>

        <div className="payment-body">
          <div className="page-title">
            <h1>Payment</h1>
            <p>Process customer payment and generate invoice</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* No cart — allow invoice view/download only */}
          {!cartData && (
            <div className="panel">
              <h2 className="panel-title">ℹ️ No Active Cart</h2>
              <p style={{ margin: 0, color: "#6b7280" }}>
                You can still view and download previous invoices below.
                To create a new sale, go to Process Sales and add items to cart.
              </p>
              <button className="view-invoice-btn" style={{ marginTop: 12 }} onClick={() => navigate("/process-sales")} type="button">
                Go to Process Sales
              </button>
            </div>
          )}

          {/* Customer name missing */}
          {cartData && isNameMissing && (
            <div className="panel">
              <h2 className="panel-title">⚠️ Customer Name Required</h2>
              <p style={{ margin: 0, color: "#6b7280" }}>
                Customer name is mandatory. Please go back and enter customer name in <b>Process Sales</b>.
              </p>
              <button className="view-invoice-btn" style={{ marginTop: 12 }} onClick={() => navigate("/process-sales")} type="button">
                Go Back to Process Sales
              </button>
            </div>
          )}

          {/* Payment UI — only when cart exists and name is present */}
          {cartData && !isNameMissing && (
            <div className="payment-grid">

              {/* Order Summary */}
              <div className="left-col">
                <div className="panel panel-equal-height">
                  <h2 className="panel-title">🧾 Order Summary</h2>
                  <div className="order-items">
                    {cart.map((item, i) => (
                      <div key={i} className="order-item-row">
                        <div className="order-item-info">
                          <div className="order-item-name">{item.name}</div>
                          <div className="order-item-detail">
                            Qty: {item.qty} × Rs. {Number(item.price).toLocaleString()}
                          </div>
                        </div>
                        <div className="order-item-total">
                          Rs. {(item.qty * Number(item.price)).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
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
                      <span>Discount ({discountLabel}):</span>
                      <span className="discount-text">-Rs. {discount.toFixed(2)}</span>
                    </div>
                    <div className="order-total-row grand-row">
                      <span>Total Amount:</span>
                      <span className="grand-amount">Rs. {total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="customer-details">
                    <div className="customer-details-title">Customer Details</div>
                    <div className="customer-detail-row">Name: {customerName}</div>
                    <div className="customer-detail-row">Phone: {customerPhone || "—"}</div>
                    <div className="customer-detail-row">Date: {today}</div>
                  </div>
                  <button className="back-btn" onClick={handleBackToCart} type="button">← Back to Cart</button>
                </div>
              </div>

              {/* Payment Method */}
              <div className="right-col">
                <div className="panel panel-equal-height">
                  <h2 className="panel-title">💳 Select Payment Method</h2>

                  <div className="payment-methods">
                    {/* Cash */}
                    <div
                      className={`method-card ${paymentMethod === "Cash" ? "method-active" : ""}`}
                      onClick={() => { setPaymentMethod("Cash"); setError(""); setWalletTransactionId(""); setAmountReceived(""); }}
                    >
                      <div className="method-radio">
                        <div className={`radio-dot ${paymentMethod === "Cash" ? "radio-on" : ""}`} />
                      </div>
                      <div>
                        <div className="method-name">💵 Cash</div>
                        <div className="method-desc">Pay with cash</div>
                      </div>
                    </div>

                    {/* Digital Wallet */}
                    <div
                      className={`method-card ${paymentMethod === "Digital Wallet" ? "method-active" : ""}`}
                      onClick={() => { setPaymentMethod("Digital Wallet"); setError(""); setAmountReceived(""); }}
                    >
                      <div className="method-radio">
                        <div className={`radio-dot ${paymentMethod === "Digital Wallet" ? "radio-on" : ""}`} />
                      </div>
                      <div>
                        <div className="method-name">📱 Digital Wallet</div>
                        <div className="method-desc">Pay via eSewa, Khalti, IME Pay</div>
                      </div>
                    </div>
                  </div>

                  {/* Cash details */}
                  {paymentMethod === "Cash" && (
                    <div className="cash-details">
                      <div className="cash-details-title">Cash Payment Details</div>
                      <div className="cash-fields">
                        <div className="cash-field-group">
                          <label className="cash-label">Amount Received</label>
                          <input className="cash-input" type="number" placeholder="Rs. 0.00" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} />
                        </div>
                        <div className="cash-field-group">
                          <label className="cash-label">Change to Return</label>
                          <input className="cash-input cash-change" type="text" readOnly value={`Rs. ${changeToReturn().toFixed(2)}`} />
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
                        <input className="cash-input" type="text" placeholder="Enter transaction ID..." value={walletTransactionId} onChange={(e) => { setWalletTransactionId(e.target.value); if (error) setError(""); }} />
                      </div>
                    </div>
                  )}

                  <div className="payment-actions">
                    <button className="cancel-payment-btn" onClick={handleCancelPayment} type="button">Cancel Payment</button>
                    <button className="complete-payment-btn" onClick={handleCompletePayment} disabled={loading} type="button">
                      {loading ? "Processing..." : "Complete Payment"}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Recent Payments table — always visible */}
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
                {recentPayments.length > 0 ? (
                  paginatedPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="invoice-link">{p.invoice_number}</td>
                      <td>{p.customer_name || "—"}</td>
                      <td>{p.payment_method}</td>
                      <td className="amount-cell">Rs. {safeNum(p.total).toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${p.status === "Paid" ? "status-paid" : "status-pending"}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <button className="view-invoice-btn" onClick={() => handleViewInvoice(p)} type="button">View Invoice</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="no-results">No payments today yet.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {recentPayments.length > pageSize && (
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} type="button">Prev</button>
                <span className="page-info">Page {page} of {totalPages}</span>
                <button className="page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} type="button">Next</button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Invoice Modal */}
      {invoiceModal && (
        <div className="modal-overlay" onClick={closeInvoiceModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Payment Invoice</h2>
              <div className="modal-actions">
                <button className="modal-download-btn" onClick={downloadInvoicePdf} type="button">⬇ Download PDF</button>
                <button className="modal-close-btn" onClick={closeInvoiceModal} type="button">✕</button>
              </div>
            </div>

            {invoiceLoading ? (
              <p style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>Loading...</p>
            ) : selectedSale ? (
              <div className="modal-content">
                <div className="modal-section-title">Payment Details</div>
                <div className="modal-info-row">
                  <span className="modal-info-label">Status</span>
                  <span className="modal-info-value">{selectedSale.status || "Paid"}</span>
                </div>
                <div className="modal-info-row">
                  <span className="modal-info-label">Payment Method</span>
                  <span className="modal-info-value">{selectedSale.payment_method || "—"}</span>
                </div>
                <div className="modal-info-row">
                  <span className="modal-info-label">Wallet / Txn ID</span>
                  <span className="modal-info-value">{selectedSale.wallet_transaction_id || selectedSale.walletTransactionId || "—"}</span>
                </div>
                <div className="modal-section-title" style={{ marginTop: 14 }}>Sale Details</div>
                <div className="modal-info-row">
                  <span className="modal-info-label">Invoice #</span>
                  <span className="modal-info-value">{selectedSale.invoice_number || "—"}</span>
                </div>
                <div className="modal-info-row">
                  <span className="modal-info-label">Customer</span>
                  <span className="modal-info-value">{selectedSale.customer_name || "—"}</span>
                </div>
                <div className="modal-info-row">
                  <span className="modal-info-label">Phone</span>
                  <span className="modal-info-value">{selectedSale.customer_phone || "—"}</span>
                </div>
                <div className="modal-info-row">
                  <span className="modal-info-label">Date</span>
                  <span className="modal-info-value">{formatDateTime(selectedSale.created_at)}</span>
                </div>
                <div style={{ marginTop: 16 }} className="modal-items-title">Items Purchased</div>
                <table className="modal-items-table">
                  <thead>
                    <tr>
                      <th>MEDICINE</th>
                      <th>QTY</th>
                      <th>PRICE</th>
                      <th>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.length > 0 ? (
                      invoiceItems.map((it, idx) => (
                        <tr key={idx}>
                          <td>{it.name}</td>
                          <td>{it.qty}</td>
                          <td>Rs. {it.price.toLocaleString()}</td>
                          <td>Rs. {it.lineTotal.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className="no-results">No items found.</td></tr>
                    )}
                  </tbody>
                </table>
                <div className="modal-totals">
                  <div className="modal-info-row">
                    <span className="modal-info-label">Subtotal</span>
                    <span className="modal-info-value">Rs. {safeNum(selectedSale.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="modal-info-row">
                    <span className="modal-info-label">Tax (5%)</span>
                    <span className="modal-info-value">Rs. {safeNum(selectedSale.tax).toLocaleString()}</span>
                  </div>
                  <div className="modal-info-row">
                    <span className="modal-info-label">Discount</span>
                    <span className="modal-info-value" style={{ color: "#ef4444" }}>
                      - Rs. {safeNum(getSaleDiscount(selectedSale)).toLocaleString()}
                    </span>
                  </div>
                  <div className="modal-info-row modal-grand-total">
                    <span className="modal-info-label">Total</span>
                    <span className="modal-info-value" style={{ color: "#16a34a" }}>
                      Rs. {safeNum(selectedSale.total).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ textAlign: "center", padding: "20px", color: "#ef4444" }}>Failed to load invoice.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Payment;