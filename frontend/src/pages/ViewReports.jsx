import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ViewReports.css";

// View Reports page — MediTrack Pharmacy System
// Features: Sales/Inventory/Purchase report tabs, date range, bar chart, top products

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

// Sales trend data for last 7 days (in Rs.)
const salesTrend = [
  { day: "Mon", amount: 5200  },
  { day: "Tue", amount: 6100  },
  { day: "Wed", amount: 7300  },
  { day: "Thu", amount: 6500  },
  { day: "Fri", amount: 5800  },
  { day: "Sat", amount: 8200  },
  { day: "Sun", amount: 9400  },
];

// Top 5 selling products
const topProducts = [
  { rank: 1, name: "Paracetamol 500mg",  category: "Painkiller",    sold: 1245, revenue: 417075  },
  { rank: 2, name: "Amoxicillin 250mg",  category: "Antibiotic",    sold: 856,  revenue: 654840  },
  { rank: 3, name: "Ibuprofen 400mg",    category: "Painkiller",    sold: 742,  revenue: 315350  },
  { rank: 4, name: "Cetirizine 10mg",    category: "Antihistamine", sold: 634,  revenue: 152160  },
  { rank: 5, name: "Omeprazole 20mg",    category: "Antacid",       sold: 521,  revenue: 311558  },
];

const ViewReports = () => {
  const navigate = useNavigate();

  // Active report tab
  const [activeReport, setActiveReport] = useState("sales");
  const [startDate, setStartDate]       = useState("2025-01-01");
  const [endDate, setEndDate]           = useState("2025-01-15");

  // Max bar height for chart scaling
  const maxAmount = Math.max(...salesTrend.map((d) => d.amount));

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="reports-wrapper">

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
              className={`nav-link ${item.path === "/view-reports" ? "active" : ""}`}
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
        <div className="reports-body">

          <div className="page-title">
            <h1>View Reports</h1>
            <p>Generate and view various business reports</p>
          </div>

          {/* ── Top 3 report type cards ── */}
          <div className="report-cards">
            <button
              className={`report-card card-blue ${activeReport === "sales" ? "card-selected" : ""}`}
              onClick={() => setActiveReport("sales")}
            >
              <div className="card-icon">📊</div>
              <div className="card-title">Sales Report</div>
              <div className="card-desc">View sales transactions and revenue details</div>
            </button>
            <button
              className={`report-card card-purple ${activeReport === "inventory" ? "card-selected" : ""}`}
              onClick={() => setActiveReport("inventory")}
            >
              <div className="card-icon">📦</div>
              <div className="card-title">Inventory Report</div>
              <div className="card-desc">View current stock levels and inventory status</div>
            </button>
            <button
              className={`report-card card-orange ${activeReport === "purchase" ? "card-selected" : ""}`}
              onClick={() => setActiveReport("purchase")}
            >
              <div className="card-icon">🛒</div>
              <div className="card-title">Purchase Report</div>
              <div className="card-desc">View purchase orders and supplier details</div>
            </button>
          </div>

          {/* ── Main report panel ── */}
          <div className="panel">

            {/* Report title */}
            <h2 className="panel-title">
              {activeReport === "sales"     && "📊 Sales Report"}
              {activeReport === "inventory" && "📦 Inventory Report"}
              {activeReport === "purchase"  && "🛒 Purchase Report"}
            </h2>

            {/* Date range + action buttons */}
            <div className="report-controls">
              <div className="date-group">
                <label className="date-label">Start Date</label>
                <input className="date-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="date-group">
                <label className="date-label">End Date</label>
                <input className="date-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <button className="generate-btn">Generate Report</button>
              <button className="export-pdf-btn">📄 Export PDF</button>
              <button className="export-excel-btn">📊 Export Excel</button>
            </div>

            {/* ── Summary stat cards ── */}
            <div className="summary-cards">
              <div className="summary-card sc-blue">
                <div className="sc-label">Total Sales</div>
                <div className="sc-value">Rs. 45,280</div>
                <div className="sc-sub">↑ 12.5% from last period</div>
              </div>
              <div className="summary-card sc-green">
                <div className="sc-label">Total Transactions</div>
                <div className="sc-value sc-green-val">342</div>
                <div className="sc-sub">↑ 8.3% from last period</div>
              </div>
              <div className="summary-card sc-orange">
                <div className="sc-label">Average Sale</div>
                <div className="sc-value sc-orange-val">Rs. 132.40</div>
                <div className="sc-sub">↑ 3.8% from last period</div>
              </div>
              <div className="summary-card sc-pink">
                <div className="sc-label">Top Selling Item</div>
                <div className="sc-value sc-pink-val">Paracetamol 500mg</div>
                <div className="sc-sub">1,245 units sold</div>
              </div>
            </div>

            {/* ── Bar chart — Sales Trend Last 7 Days ── */}
            <div className="chart-section">
              <h3 className="chart-title">Sales Trend (Last 7 Days)</h3>
              <div className="bar-chart">
                {salesTrend.map((d, i) => {
                  const isMax     = d.amount === maxAmount;
                  const heightPct = (d.amount / maxAmount) * 100;
                  return (
                    <div key={d.day} className="bar-col">
                      {/* Amount label above bar */}
                      <div className="bar-label">
                        Rs. {(d.amount / 1000).toFixed(1)}K
                      </div>
                      {/* The bar itself — last day (max) is green, others blue */}
                      <div
                        className={`bar ${isMax ? "bar-green" : "bar-blue"}`}
                        style={{ height: `${heightPct}%` }}
                      ></div>
                      {/* Day label below */}
                      <div className={`bar-day ${isMax ? "bar-day-bold" : ""}`}>{d.day}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Top 5 Selling Products table ── */}
            <div className="top-products-section">
              <h3 className="chart-title">Top 5 Selling Products</h3>
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Medicine Name</th>
                    <th>Category</th>
                    <th>Units Sold</th>
                    <th>Revenue (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p) => (
                    <tr key={p.rank}>
                      <td>
                        <span className={`rank-badge rank-${p.rank}`}>#{p.rank}</span>
                      </td>
                      <td className="product-name">{p.name}</td>
                      <td>
                        <span className="category-tag">{p.category}</span>
                      </td>
                      <td className="units-sold">{p.sold.toLocaleString()}</td>
                      <td className="revenue-cell">Rs. {p.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewReports;