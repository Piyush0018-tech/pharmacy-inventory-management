import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProcessSales.css";

// Process Sales page — MediTrack Pharmacy System
// Features: Search medicines, add to cart, recent sales table

// Available medicines inventory
const allMedicines = [
  { id: "MED001", name: "Paracetamol 500mg",  category: "Painkiller",      stock: 1250, price: 335  },
  { id: "MED002", name: "Amoxicillin 250mg",  category: "Antibiotic",      stock: 15,   price: 765  },
  { id: "MED003", name: "Ibuprofen 400mg",    category: "Painkiller",      stock: 850,  price: 425  },
  { id: "MED004", name: "Cetirizine 10mg",    category: "Antihistamine",   stock: 620,  price: 240  },
  { id: "MED005", name: "Omeprazole 20mg",    category: "Antacid",         stock: 430,  price: 598  },
  { id: "MED006", name: "Metformin 500mg",    category: "Antidiabetic",    stock: 35,   price: 830  },
  { id: "MED007", name: "Aspirin 75mg",       category: "Blood Thinner",   stock: 940,  price: 199  },
  { id: "MED008", name: "Losartan 50mg",      category: "Antihypertensive",stock: 520,  price: 1040 },
];

// Sample recent sales for today
const initialSales = [
  { invoice: "INV-2025-001", customer: "John Doe",         items: 5, amount: 3400, time: "10:30 AM" },
  { invoice: "INV-2025-002", customer: "Sarah Smith",      items: 3, amount: 2450, time: "11:15 AM" },
  { invoice: "INV-2025-003", customer: "Walk-in Customer", items: 2, amount: 1695, time: "12:45 PM" },
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

const TAX_RATE = 0.05; // 5% VAT

const ProcessSales = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery]   = useState("");
  const [cart, setCart]                 = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [sales, setSales]               = useState(initialSales);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // Filter medicines by search query
  const filteredMedicines = allMedicines.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    );
  });

  // Add medicine to cart (or increase qty if already in cart)
  const addToCart = (medicine) => {
    const exists = cart.find((c) => c.id === medicine.id);
    if (exists) {
      setCart(cart.map((c) =>
        c.id === medicine.id ? { ...c, qty: c.qty + 1 } : c
      ));
    } else {
      setCart([...cart, { ...medicine, qty: 1 }]);
    }
  };

  // Update quantity of a cart item
  const updateQty = (id, qty) => {
    if (qty < 1) return;
    setCart(cart.map((c) => c.id === id ? { ...c, qty } : c));
  };

  // Remove item from cart
  const removeFromCart = (id) => {
    setCart(cart.filter((c) => c.id !== id));
  };

  // Clear entire cart
  const clearCart = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
  };

  // Cart totals
  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const tax      = subtotal * TAX_RATE;
  const total    = subtotal + tax;

  // Proceed to payment — pass cart data via localStorage then navigate
  const handleProceedToPayment = () => {
    if (cart.length === 0) return;
    localStorage.setItem("cartData", JSON.stringify({ cart, customerName, customerPhone, subtotal, tax, total }));
    navigate("/payment");
  };

  return (
    <div className="sales-wrapper">

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
              className={`nav-link ${item.path === "/process-sales" ? "active" : ""}`}
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
        <div className="sales-body">

          <div className="page-title">
            <h1>Process Sales</h1>
            <p>Search medicines and process customer sales</p>
          </div>

          {/* ── Two column layout: left = search+sales, right = cart ── */}
          <div className="sales-grid">

            {/* LEFT COLUMN */}
            <div className="left-col">

              {/* Search Medicine panel */}
              <div className="panel">
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
                  <button className="search-btn">Search</button>
                </div>

                {/* Available Medicines list */}
                <div className="medicines-label">Available Medicines</div>
                <div className="medicines-list">
                  {filteredMedicines.map((med) => (
                    <div key={med.id} className="medicine-row">
                      <div className="medicine-info">
                        <div className="medicine-name">{med.name}</div>
                        <div className="medicine-detail">
                          Category: {med.category} | Stock: {med.stock.toLocaleString()} units | Price: Rs. {med.price.toLocaleString()}
                        </div>
                      </div>
                      <button className="add-to-cart-btn" onClick={() => addToCart(med)}>
                        + Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Sales Today table */}
              <div className="panel">
                <h2 className="panel-title">📊 Recent Sales Today</h2>
                <table className="sales-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Time</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => (
                      <tr key={sale.invoice}>
                        <td className="invoice-link">{sale.invoice}</td>
                        <td>{sale.customer}</td>
                        <td>{sale.items} items</td>
                        <td className="amount-cell">Rs. {sale.amount.toLocaleString()}</td>
                        <td>{sale.time}</td>
                        <td>
                          <button className="view-btn">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="view-all-link">View All Sales →</button>
              </div>

            </div>

            {/* RIGHT COLUMN — Shopping Cart */}
            <div className="right-col">
              <div className="cart-panel">

                {/* Cart header with item count badge */}
                <div className="cart-header">
                  <h2 className="cart-title">🛒 Shopping Cart</h2>
                  {cart.length > 0 && (
                    <span className="cart-badge">{cart.reduce((sum, c) => sum + c.qty, 0)}</span>
                  )}
                </div>

                {/* Cart items */}
                <div className="cart-items">
                  {cart.length === 0 ? (
                    <p className="cart-empty">No items in cart. Add medicines to get started.</p>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="cart-item">
                        <div className="cart-item-top">
                          <div className="cart-item-name">{item.name}</div>
                          <button className="cart-remove-btn" onClick={() => removeFromCart(item.id)}>✕</button>
                        </div>
                        <div className="cart-item-price">Price: Rs. {item.price.toLocaleString()}</div>
                        <div className="cart-item-bottom">
                          {/* Quantity input */}
                          <input
                            className="cart-qty-input"
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => updateQty(item.id, Number(e.target.value))}
                          />
                          <span className="cart-item-total">Rs. {(item.price * item.qty).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Subtotal, Tax, Discount, Total */}
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
                    <span>Discount:</span>
                    <span className="discount-val">-Rs. 0.00</span>
                  </div>
                  <div className="total-row grand">
                    <span>Total:</span>
                    <span className="grand-total-val">Rs. {total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Customer info */}
                <div className="customer-section">
                  <div className="customer-label">Customer Name (Optional)</div>
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

                {/* Cart action buttons */}
                <button className="clear-cart-btn" onClick={clearCart}>Clear Cart</button>
                <button className="proceed-btn" onClick={handleProceedToPayment}>
                  💳 Proceed to Payment
                </button>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessSales;