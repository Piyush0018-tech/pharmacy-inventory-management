import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

// MediTrack — Dashboard Page
// Sidebar fixed left, header with logo top, body scrolls

const Dashboard = () => {
  const navigate = useNavigate();

  // Recent activity feed data
  const recentActivities = [
    { id: 1, dotColor: "#3b82f6", text: 'Medicine "Paracetamol 500mg" added to inventory', time: "2 hours ago" },
    { id: 2, dotColor: "#22c55e", text: "Sale completed - Invoice #12345",                   time: "3 hours ago" },
    { id: 3, dotColor: "#f59e0b", text: 'Low stock alert - "Amoxicillin 250mg"',              time: "5 hours ago" },
    { id: 4, dotColor: "#8b5cf6", text: "Purchase order #PO-789 received",                    time: "1 day ago"   },
    { id: 5, dotColor: "#ef4444", text: "Expiry alert - 3 medicines expiring this month",     time: "1 day ago"   },
  ];

  // Sales data for last 7 days bar chart
  const salesData = [
    { day: "Mon", amount: 320 },
    { day: "Tue", amount: 410 },
    { day: "Wed", amount: 500 },
    { day: "Thu", amount: 460 },
    { day: "Fri", amount: 380 },
    { day: "Sat", amount: 540 },
    { day: "Sun", amount: 620 },
  ];

  const maxAmount = Math.max(...salesData.map((d) => d.amount));

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

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="dashboard-wrapper">

      {/* ════════ SIDEBAR ════════ */}
      <aside className="sidebar">

        {/* Sidebar logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">💊</div>
          <div>
            <div className="sidebar-logo-name">MediTrack</div>
            <div className="sidebar-logo-sub">Pharmacy Inventory</div>
          </div>
        </div>

        {/* Nav links */}
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

      {/* ════════ MAIN COLUMN ════════ */}
      <div className="main-content">

        {/* ── TOP HEADER
             Left side: logo icon + "Pharmacy Inventory Management"
             Right side: Admin label + Logout button
             No card, no rounded box — plain white bar flush to top ── */}
        <header className="top-header">

          {/* Left — logo + title */}
          <div className="header-left">
            <div className="header-logo-icon">💊</div>
            <div className="header-logo-text">
              <span className="header-logo-title">MediTrack</span>
              <span className="header-logo-sub">Pharmacy Inventory Management</span>
            </div>
          </div>

          {/* Right — admin name + logout */}
          <div className="header-right">
            <span className="header-admin-label">Admin</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>

        </header>

        {/* ── SCROLLABLE BODY — everything here scrolls ── */}
        <div className="dashboard-body">

          {/* Page title */}
          <div className="page-heading">
            <h1>Dashboard</h1>
            <p>Welcome back! Here's your pharmacy overview</p>
          </div>

          {/* ══ STATS CARDS ══ */}
          <div className="dashboard-stats-row">

            <div className="dashboard-stat-card">
              <div className="stat-icon-circle stat-blue">💊</div>
              <p className="stat-label">Total Medicines</p>
              <p className="stat-value" style={{ color: "#2563eb" }}>1,247</p>
              <p className="stat-change">↑ 12% from last month</p>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-icon-circle stat-yellow">⚠️</div>
              <p className="stat-label">Low Stock Items</p>
              <p className="stat-value" style={{ color: "#d97706" }}>23</p>
              <p className="stat-alert">⚠ Needs attention</p>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-icon-circle stat-pink">⏰</div>
              <p className="stat-label">Expiring Soon</p>
              <p className="stat-value" style={{ color: "#dc2626" }}>8</p>
              <p className="stat-info">🕐 Within 30 days</p>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-icon-circle stat-green">💵</div>
              <p className="stat-label">Monthly Sales</p>
              <p className="stat-value" style={{ color: "#16a34a" }}>$45.2K</p>
              <p className="stat-change">↑ 8% from last month</p>
            </div>

          </div>

          {/* ══ MIDDLE ROW ══ */}
          <div className="dashboard-middle-row">

            {/* Recent Activities */}
            <div className="dashboard-card">
              <h2 className="dashboard-card-title">Recent Activities</h2>

              <div className="activity-list">
                {recentActivities.map((item) => (
                  <div key={item.id} className="activity-item">
                    <div className="activity-dot" style={{ background: item.dotColor }} />
                    <div style={{ flex: 1 }}>
                      <p className="activity-text">{item.text}</p>
                      <span className="activity-time">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button className="view-all-btn" onClick={() => navigate("/activities")}>
                View All Activities →
              </button>
            </div>

            {/* Right column */}
            <div className="dashboard-right-col">

              {/* Quick Actions */}
              <div className="dashboard-card">
                <h2 className="dashboard-card-title">Quick Actions</h2>
                <div className="quick-actions-row">
                  <button className="action-btn-blue" onClick={() => navigate("/manage-inventory")}>
                    <span className="action-btn-icon">+</span>
                    <span className="action-btn-title">Add Medicine</span>
                    <span className="action-btn-sub">Add new medicine to inventory</span>
                  </button>
                  <button className="action-btn-green" onClick={() => navigate("/process-sales")}>
                    <span className="action-btn-icon">💰</span>
                    <span className="action-btn-title">New Sale</span>
                    <span className="action-btn-sub">Process a new sale</span>
                  </button>
                </div>
              </div>

              {/* Alerts */}
              <div className="dashboard-card">
                <h2 className="dashboard-card-title">⚠ Alerts & Notifications</h2>
                <div className="alert-box-yellow">
                  <p className="alert-title alert-yellow-text">Low Stock Alert</p>
                  <p className="alert-desc alert-yellow-text">23 medicines are running low on stock</p>
                </div>
                <div className="alert-box-red">
                  <p className="alert-title alert-red-text">Expiry Alert</p>
                  <p className="alert-desc alert-red-text">8 medicines will expire within 30 days</p>
                </div>
              </div>

            </div>
          </div>

          {/* ══ SALES CHART ══ */}
          <div className="dashboard-card">
            <h2 className="dashboard-card-title">Sales Overview (Last 7 Days)</h2>
            <div className="chart-container">
              {salesData.map((data, index) => {
                const heightPercent = (data.amount / maxAmount) * 100;
                const isHighest    = index === salesData.length - 1;
                return (
                  <div key={data.day} className="chart-bar-wrapper">
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
          </div>

        </div>{/* end dashboard-body */}
      </div>{/* end main-content */}

    </div>
  );
};

export default Dashboard;