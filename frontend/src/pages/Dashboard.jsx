import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getDashboardStats,
  getSalesReport,
  getExpiringSoon,
  getMedicines, // <-- import getMedicines!
} from "../api";
import "./Dashboard.css";

const LOW_STOCK_THRESHOLD = 50;

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

const timeAgo = (dateStr) => {
  const now  = new Date();
  const past = new Date(dateStr);
  const diff = Math.floor((now - past) / 1000);
  if (diff < 60)    return "Just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} days ago`;
  return past.toLocaleDateString();
};

const Dashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats]                 = useState(null);
  const [chartData, setChartData]         = useState([]);
  const [activities, setActivities]       = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0); // Corrected count
  const [expiringCount, setExpiringCount] = useState(0);
  const [error, setError]                 = useState("");
  const [showAll, setShowAll]             = useState(false);

  useEffect(() => {
    fetchStats();
    fetchSalesTrend();
    fetchLowStockAndExpiring();
    fetchActivities();
  }, []);

  // this can stay as is
  const fetchStats = async () => {
    try {
      const res = await getDashboardStats();
      setStats(res.data);
    } catch {
      setError("Failed to load dashboard stats.");
    }
  };

  const fetchSalesTrend = async () => {
    try {
      const end   = new Date().toISOString().split("T")[0];
      const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString().split("T")[0];
      const res = await getSalesReport(start, end);
      const mapped = res.data.trend.map((d) => ({
        day:    new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }),
        amount: Number(d.total),
      }));
      setChartData(mapped);
    } catch {
      setChartData([]);
    }
  };

  // ==== CORRECTED ALERT COUNTS ====
  const fetchLowStockAndExpiring = async () => {
    try {
      // Get ALL medicines, so you always have the correct logic
      const medsRes = await getMedicines();
      const allMeds = Array.isArray(medsRes.data) ? medsRes.data : [];

      // LOW STOCK: quantity <= 50 (including 0!)
      const lowStockItems = allMeds.filter(
        (m) => Number(m.quantity) <= LOW_STOCK_THRESHOLD
      );
      setLowStockCount(lowStockItems.length);

      // EXPIRING: Use getExpiringSoon for same logic as before
      const expRes = await getExpiringSoon();
      const sixMonthsLater = new Date();
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

      const expiringSoon = expRes.data.filter((m) => {
        if (!m.expiry_date) return false;
        const expiry = new Date(m.expiry_date);
        return expiry <= sixMonthsLater;
      });
      setExpiringCount(expiringSoon.length);
    } catch {
      setLowStockCount(0);
      setExpiringCount(0);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/reports/activities", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setActivities(data);
    } catch {
      setActivities([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const maxAmount = chartData.length > 0
    ? Math.max(...chartData.map((d) => d.amount))
    : 1;

  const displayedActivities = showAll ? activities : activities.slice(0, 5);

  return (
    <div className="dashboard-wrapper">

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
              className={`nav-link ${item.path === "/dashboard" ? "active" : ""}`}
              onClick={() => navigate(item.path)}
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
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <div className="dashboard-body">

          <div className="page-heading">
            <h1>Dashboard</h1>
            <p>Welcome back! Here's your pharmacy overview</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* ── STAT CARDS ── */}
          <div className="dashboard-stats-row">
            <div className="dashboard-stat-card">
              <div className="stat-icon-circle stat-blue">💊</div>
              <p className="stat-label">Total Medicines</p>
              <p className="stat-value" style={{ color: "#2563eb" }}>
                {stats ? stats.total_medicines : "—"}
              </p>
              <p className="stat-change">↑ Active in system</p>
            </div>
            <div className="dashboard-stat-card">
              <div className="stat-icon-circle stat-yellow">⚠️</div>
              <p className="stat-label">Low Stock Items</p>
              <p className="stat-value" style={{ color: "#d97706" }}>
                {lowStockCount}
              </p>
              <p className="stat-alert">⚠ Needs attention</p>
            </div>
            <div className="dashboard-stat-card">
              <div className="stat-icon-circle stat-pink">⏰</div>
              <p className="stat-label">Today's Sales</p>
              <p className="stat-value" style={{ color: "#dc2626" }}>
                {stats ? `Rs. ${Number(stats.today_sales).toLocaleString()}` : "—"}
              </p>
              <p className="stat-info">🕐 Today</p>
            </div>
            <div className="dashboard-stat-card">
              <div className="stat-icon-circle stat-green">👥</div>
              <p className="stat-label">Total Users</p>
              <p className="stat-value" style={{ color: "#16a34a" }}>
                {stats ? stats.total_users : "—"}
              </p>
              <p className="stat-change">System users</p>
            </div>
          </div>

          {/* ── MIDDLE ROW ── */}
          <div className="dashboard-middle-row">

            {/* Recent Activities — real data from backend */}
            <div className="dashboard-card">
              <h2 className="dashboard-card-title">Recent Activities</h2>

              {activities.length === 0 ? (
                <p className="no-results">No recent activities yet.</p>
              ) : (
                <>
                  <div className={`activity-list ${showAll ? "activity-list-expanded" : ""}`}>
                    {displayedActivities.map((item, index) => (
                      <div key={index} className="activity-item">
                        <div
                          className="activity-dot"
                          style={{ background: item.color }}
                        />
                        <div style={{ flex: 1 }}>
                          <p className="activity-text">{item.text}</p>
                          <span className="activity-time">{timeAgo(item.time)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Show toggle only if more than 5 activities */}
                  {activities.length > 5 && (
                    <button
                      className="view-all-btn"
                      onClick={() => setShowAll(!showAll)}
                    >
                      {showAll ? "Show Less ←" : "View All Activities →"}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Right column */}
            <div className="dashboard-right-col">

              {/* Quick Actions */}
              <div className="dashboard-card">
                <h2 className="dashboard-card-title">Quick Actions</h2>
                <div className="quick-actions-row">
                  <button
                    className="action-btn-blue"
                    onClick={() => navigate("/manage-inventory")}
                  >
                    <span className="action-btn-icon">+</span>
                    <span className="action-btn-title">Add Medicine</span>
                    <span className="action-btn-sub">Add new medicine to inventory</span>
                  </button>
                  <button
                    className="action-btn-green"
                    onClick={() => navigate("/process-sales")}
                  >
                    <span className="action-btn-icon">💰</span>
                    <span className="action-btn-title">New Sale</span>
                    <span className="action-btn-sub">Process a new sale</span>
                  </button>
                </div>
              </div>

              {/* Alerts — real counts, click to redirect */}
              <div className="dashboard-card">
                <h2 className="dashboard-card-title">⚠ Alerts & Notifications</h2>

                {/* Low Stock — quantity <= 50, always matches everywhere */}
                <div
                  className="alert-box-yellow alert-clickable"
                  onClick={() => navigate("/manage-medicines")}
                >
                  <div className="alert-row">
                    <p className="alert-title alert-yellow-text">🔴 Low Stock Alert</p>
                    {lowStockCount > 0 && (
                      <span className="alert-badge">{lowStockCount}</span>
                    )}
                  </div>
                  <p className="alert-desc alert-yellow-text">
                    {lowStockCount > 0
                      ? `${lowStockCount} medicine${lowStockCount > 1 ? "s" : ""} running low on stock`
                      : "All medicines are well stocked ✅"}
                  </p>
                </div>

                {/* Expiry — within 6 months, matches Manage Medicines */}
                <div
                  className="alert-box-red alert-clickable"
                  onClick={() => navigate("/manage-medicines")}
                >
                  <div className="alert-row">
                    <p className="alert-title alert-red-text">⏰ Expiry Alert</p>
                    {expiringCount > 0 && (
                      <span className="alert-badge alert-badge-red">{expiringCount}</span>
                    )}
                  </div>
                  <p className="alert-desc alert-red-text">
                    {expiringCount > 0
                      ? `${expiringCount} medicine${expiringCount > 1 ? "s" : ""} expiring within 6 months`
                      : "No medicines expiring soon ✅"}
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* ── SALES CHART — amount label above each bar ── */}
          <div className="dashboard-card">
            <h2 className="dashboard-card-title">Sales Overview (Last 7 Days)</h2>
            {chartData.length > 0 ? (
              <div className="chart-container">
                {chartData.map((data, index) => {
                  const heightPercent = (data.amount / maxAmount) * 100;
                  const isHighest     = index === chartData.length - 1;
                  return (
                    <div key={data.day} className="chart-bar-wrapper">
                      <p className="chart-amount-label">
                        Rs.{data.amount > 0 ? Number(data.amount).toLocaleString() : "0"}
                      </p>
                      <div className="chart-bar-inner">
                        <div
                          className={`chart-bar ${isHighest ? "bar-highlight" : ""}`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <p className="chart-day-label">{data.day}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="no-results">No sales data available yet.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;