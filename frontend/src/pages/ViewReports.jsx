import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import {
  getSalesReport,
  getInventoryReport,
  getPurchaseReport,
  getTopMedicines,
  getMedicines,
} from "../api";
import "./ViewReports.css";

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

const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const nowDateTime = () =>
  new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

const nowTimeOnly = () =>
  new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

// LOW STOCK: <= 50 (including 0! Out of stock is a sub-set)
const LOW_STOCK_THRESHOLD = 50;

const ViewReports = () => {
  const navigate = useNavigate();

  const [activeReport, setActiveReport] = useState("sales");
  const [startDate, setStartDate] = useState("2025-01-01");
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const [salesSummary, setSalesSummary] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  const [invSummary, setInvSummary] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [expiringSoonItems, setExpiringSoonItems] = useState([]);

  const [purSummary, setPurSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const showApiError = (err, fallbackMsg) => {
    console.error(err);
    const message = err?.response?.data?.message;
    const details = err?.response?.data?.details;
    if (message && details) { setError(`${message}: ${details}`); return; }
    if (message) { setError(message); return; }
    setError(fallbackMsg);
  };

  const fetchSalesReport = async () => {
    try {
      setError(""); setLoading(true);
      const res = await getSalesReport(startDate, endDate);
      setSalesSummary(res.data.summary);
      setSalesTrend(res.data.trend || []);
      return true;
    } catch (err) { showApiError(err, "Failed to load sales report."); return false;
    } finally { setLoading(false); }
  };

  const fetchTopMedicines = async () => {
    try {
      const res = await getTopMedicines();
      setTopProducts(res.data || []);
      return true;
    } catch (err) { showApiError(err, "Failed to load top medicines."); return false }
  };

  // ----- THIS FUNCTION IS 100% CORRECTED LOGIC -----
  const fetchInventoryReport = async () => {
    try {
      setError(""); setLoading(true);
      const res = await getInventoryReport();
      let allMeds = res.data.all_medicines; // Try from backend
      if (!Array.isArray(allMeds)) { // fallback: get all meds directly
        try {
          const medsRes = await getMedicines();
          allMeds = medsRes.data || [];
        } catch { allMeds = []; }
      }
      // "Low stock" = quantity <= 50 (INCLUDING zero, INCLUDING out of stocks)
      // "Out of stock" = quantity === 0
      // Both should be calculated on all medicines
      const newLowStockItems = (allMeds || []).filter(
        m => safeNum(m.quantity) <= LOW_STOCK_THRESHOLD // include zeros!
      );
      const outOfStockCount = (allMeds || []).filter(
        m => safeNum(m.quantity) === 0
      ).length;

      setInvSummary({
        ...res.data.summary,
        low_stock: newLowStockItems.length,
        out_of_stock: outOfStockCount,
      });
      setLowStockItems(newLowStockItems); // this array includes both out of stock and near out
      setExpiringSoonItems(res.data.expiring_soon_items || []);
      return true;
    } catch (err) { showApiError(err, "Failed to load inventory report."); return false;
    } finally { setLoading(false); }
  };

  const fetchPurchaseReport = async () => {
    try {
      setError(""); setLoading(true);
      const res = await getPurchaseReport(startDate, endDate);
      setPurSummary(res.data.summary);
      return true;
    } catch (err) { showApiError(err, "Failed to load purchase report."); return false; }
    finally { setLoading(false); }
  };

  useEffect(() => {
    (async () => {
      const ok1 = await fetchSalesReport();
      const ok2 = await fetchTopMedicines();
      if (ok1 && ok2) setStatusMsg(`Sales Report loaded at ${nowTimeOnly()}`);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    setError(""); setStatusMsg("");
    if ((activeReport === "sales" || activeReport === "purchase") && startDate > endDate) {
      setError("Start date cannot be after end date."); return;
    }
    if (activeReport === "sales") {
      const ok1 = await fetchSalesReport();
      const ok2 = await fetchTopMedicines();
      if (ok1 && ok2) setStatusMsg(`Sales Report updated at ${nowTimeOnly()}`); return;
    }
    if (activeReport === "inventory") {
      const ok = await fetchInventoryReport();
      if (ok) setStatusMsg(`Inventory Report updated at ${nowTimeOnly()}`); return;
    }
    if (activeReport === "purchase") {
      const ok = await fetchPurchaseReport();
      if (ok) setStatusMsg(`Purchase Report updated at ${nowTimeOnly()}`);
    }
  };

  const handleTabChange = async (tab) => {
    setActiveReport(tab); setError(""); setStatusMsg("");
    if (tab === "sales") {
      const ok1 = await fetchSalesReport(); const ok2 = await fetchTopMedicines();
      if (ok1 && ok2) setStatusMsg(`Sales Report loaded at ${nowTimeOnly()}`); return;
    }
    if (tab === "inventory") {
      const ok = await fetchInventoryReport();
      if (ok) setStatusMsg(`Inventory Report loaded at ${nowTimeOnly()}`); return;
    }
    if (tab === "purchase") {
      const ok = await fetchPurchaseReport();
      if (ok) setStatusMsg(`Purchase Report loaded at ${nowTimeOnly()}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); localStorage.removeItem("user");
    navigate("/");
  };

  const chartData = useMemo(() => {
    return salesTrend.map((d) => ({
      day: new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }),
      amount: safeNum(d.total),
    }));
  }, [salesTrend]);
  const maxAmount = useMemo(() => {
    return chartData.length > 0 ? Math.max(...chartData.map((d) => d.amount)) : 1;
  }, [chartData]);

  // Export code (unchanged)
  const exportPdf = () => {
    if (activeReport === "sales" && !salesSummary) {
      setError("Please Generate Sales Report first, then export PDF."); return;
    }
    if (activeReport === "inventory" && !invSummary) {
      setError("Please Generate Inventory Report first, then export PDF."); return;
    }
    if (activeReport === "purchase" && !purSummary) {
      setError("Please Generate Purchase Report first, then export PDF."); return;
    }
    try {
      setError("");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const left = 50;
      let y = 60;
      const gap = 18;
      const line = (txt = "", bold = false) => {
        doc.setFont("courier", bold ? "bold" : "normal");
        doc.setFontSize(11);
        if (y > 780) { doc.addPage(); y = 60; }
        doc.text(String(txt), left, y); y += gap;
      };
      const divider = () =>
        line("====================================================");
      // Header
      line("MEDITRACK PHARMACY - REPORT", true);
      line(`Generated: ${nowDateTime()}`); divider(); line("");
      // SALES PDF
      if (activeReport === "sales") {
        const s = salesSummary || {};
        line("SALES REPORT", true);
        line(`Period: ${startDate}  to  ${endDate}`); divider(); line("");
        line("SUMMARY", true);
        line("----------------------------------------------");
        line(`Total Sales        : Rs. ${safeNum(s.total_sales).toLocaleString()}`);
        line(`Total Transactions : ${safeNum(s.total_transactions)}`);
        line(`Average Sale       : Rs. ${safeNum(s.average_sale).toFixed(2)}`);
        line(`Total Tax Collected: Rs. ${safeNum(s.total_tax).toFixed(2)}`); line("");
        divider();
        line("TOP 5 SELLING PRODUCTS", true);
        line("----------------------------------------------");
        if (!topProducts || topProducts.length === 0) {
          line("None - no top products data.");
        } else {
          topProducts.slice(0, 5).forEach((p, i) => {
            line(
              `${i + 1}. ${p?.name || "-"} (${p?.category || "-"}) | Sold: ${safeNum(
                p?.total_sold
              )} | Rev: Rs. ${safeNum(p?.total_revenue).toLocaleString()}`
            );
          });
        }
        doc.save(`sales-report-${startDate}-to-${endDate}.pdf`); return;
      }
      // INVENTORY PDF
      if (activeReport === "inventory") {
        const s = invSummary || {};
        line("INVENTORY / STOCK REPORT", true); divider(); line("");
        line("SUMMARY", true); line("----------------------------------------------");
        line(`Total Medicines : ${safeNum(s.total_medicines)} items`);
        line(`Categories      : ${safeNum(s.total_categories)}`);
        line(`Total Stock     : ${safeNum(s.total_stock).toLocaleString()} units`);
        line(`Low Stock       : ${safeNum(s.low_stock)} items`);
        line(`Out of Stock    : ${safeNum(s.out_of_stock)} items`); line("");
        divider(); line("LOW STOCK MEDICINES", true);
        line("----------------------------------------------");
        if (!lowStockItems || lowStockItems.length === 0) {
          line("None - all medicines are well stocked.");
        } else {
          lowStockItems.forEach((m) => {
            line(`${m?.name || "-"} | Qty: ${safeNum(m?.quantity)} units`);
          });
        }
        line(""); divider(); line("EXPIRING SOON (Within 6 Months)", true);
        line("----------------------------------------------");
        if (!expiringSoonItems || expiringSoonItems.length === 0) {
          line("None - no items expiring soon.");
        } else {
          expiringSoonItems.forEach((m) => {
            const exp = m?.expiry_date
              ? new Date(m.expiry_date).toLocaleDateString()
              : "-";
            line(
              `${m?.name || "-"} | Expiry: ${exp} | Qty: ${safeNum(m?.quantity)} units`
            );
          });
        }
        doc.save(`inventory-report-${endDate}.pdf`); return;
      }
      // PURCHASE PDF
      if (activeReport === "purchase") {
        const s = purSummary || {};
        line("PURCHASE REPORT", true);
        line(`Period: ${startDate}  to  ${endDate}`); divider(); line("");
        line("SUMMARY", true); line("----------------------------------------------");
        line(`Total Orders   : ${safeNum(s.total_orders)}`);
        line(`Total Spent    : Rs. ${safeNum(s.total_spent).toLocaleString()}`);
        line(`Pending Orders : ${safeNum(s.pending)}`);
        line(`Received Orders: ${safeNum(s.received)}`);
        doc.save(`purchase-report-${startDate}-to-${endDate}.pdf`);
      }
    } catch (e) {
      console.error("Export PDF error:", e);
      setError("PDF export failed. Check browser console for details.");
    }
  };

  return (
    <div className="reports-wrapper">
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
              className={`nav-link ${item.path === "/view-reports" ? "active" : ""}`}
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
              <span className="header-logo-sub">
                Pharmacy Inventory Management
              </span>
            </div>
          </div>
          <div className="header-right">
            <span className="header-admin-label">Admin</span>
            <button className="logout-btn" onClick={handleLogout} type="button">
              Logout
            </button>
          </div>
        </header>
        <div className="reports-body">
          <div className="page-title">
            <h1>View Reports</h1>
            <p>Generate and view various business reports</p>
          </div>
          {error && <div className="error-message">{error}</div>}
          {statusMsg && (
            <div style={{ marginBottom: 12, color: "#6b7280", fontSize: 13 }}>
              {statusMsg}
            </div>
          )}
          {/* Report type cards */}
          <div className="report-cards">
            <button
              className={`report-card card-blue ${
                activeReport === "sales" ? "card-selected" : ""
              }`}
              onClick={() => handleTabChange("sales")}
              type="button"
            >
              <div className="card-icon">📊</div>
              <div className="card-title">Sales Report</div>
              <div className="card-desc">
                View sales transactions and revenue details
              </div>
            </button>
            <button
              className={`report-card card-purple ${
                activeReport === "inventory" ? "card-selected" : ""
              }`}
              onClick={() => handleTabChange("inventory")}
              type="button"
            >
              <div className="card-icon">📦</div>
              <div className="card-title">Inventory Report</div>
              <div className="card-desc">
                View current stock levels and inventory status
              </div>
            </button>
            <button
              className={`report-card card-orange ${
                activeReport === "purchase" ? "card-selected" : ""
              }`}
              onClick={() => handleTabChange("purchase")}
              type="button"
            >
              <div className="card-icon">🛒</div>
              <div className="card-title">Purchase Report</div>
              <div className="card-desc">
                View purchase orders and supplier details
              </div>
            </button>
          </div>
          {/* Main panel */}
          <div className="panel">
            <h2 className="panel-title">
              {activeReport === "sales" && "📊 Sales Report"}
              {activeReport === "inventory" && "📦 Inventory Report"}
              {activeReport === "purchase" && "🛒 Purchase Report"}
            </h2>
            {/* Controls */}
            <div className="report-controls">
              <div className="date-group">
                <label className="date-label">Start Date</label>
                <input
                  className="date-input"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="date-group">
                <label className="date-label">End Date</label>
                <input
                  className="date-input"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <button
                className="generate-btn"
                onClick={handleGenerate}
                disabled={loading}
                type="button"
              >
                {loading ? "Loading..." : "Generate Report"}
              </button>
              <button className="export-pdf-btn" onClick={exportPdf} type="button">
                📄 Export PDF
              </button>
            </div>
            {/* SALES: Overview cards */}
            {activeReport === "sales" && salesSummary && (
              <div className="summary-cards">
                <div className="summary-card sc-blue">
                  <div className="sc-label">Total Sales</div>
                  <div className="sc-value">
                    Rs. {safeNum(salesSummary.total_sales).toLocaleString()}
                  </div>
                  <div className="sc-sub">Selected period</div>
                </div>
                <div className="summary-card sc-green">
                  <div className="sc-label">Total Transactions</div>
                  <div className="sc-value sc-green-val">
                    {safeNum(salesSummary.total_transactions)}
                  </div>
                  <div className="sc-sub">Selected period</div>
                </div>
                <div className="summary-card sc-orange">
                  <div className="sc-label">Average Sale</div>
                  <div className="sc-value sc-orange-val">
                    Rs. {safeNum(salesSummary.average_sale).toFixed(2)}
                  </div>
                  <div className="sc-sub">Per transaction</div>
                </div>
                <div className="summary-card sc-pink">
                  <div className="sc-label">Total Tax Collected</div>
                  <div className="sc-value sc-pink-val">
                    Rs. {safeNum(salesSummary.total_tax).toFixed(2)}
                  </div>
                  <div className="sc-sub">5% VAT</div>
                </div>
              </div>
            )}
            {/* SALES: Trend chart */}
            {activeReport === "sales" && (
              <div className="chart-section">
                <h3 className="chart-title">Sales Trend (Last 7 Days)</h3>
                {chartData.length > 0 ? (
                  <div className="bar-chart">
                    {chartData.map((d, i) => {
                      const heightPct = (d.amount / maxAmount) * 100;
                      const isMax = d.amount === maxAmount;
                      return (
                        <div key={i} className="bar-col">
                          <div className="bar-label">
                            Rs. {(d.amount / 1000).toFixed(1)}K
                          </div>
                          <div
                            className={`bar ${isMax ? "bar-green" : "bar-blue"}`}
                            style={{ height: `${heightPct}%` }}
                          />
                          <div
                            className={`bar-day ${isMax ? "bar-day-bold" : ""}`}
                          >
                            {d.day}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="no-results">No sales data available for chart.</p>
                )}
              </div>
            )}
            {/* SALES: Top 5 products table */}
            {activeReport === "sales" && (
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
                    {topProducts.length > 0 ? (
                      topProducts.map((p, i) => (
                        <tr key={i}>
                          <td>
                            <span className={`rank-badge rank-${i + 1}`}>
                              #{i + 1}
                            </span>
                          </td>
                          <td className="product-name">{p.name}</td>
                          <td>
                            <span className="category-tag">{p.category}</span>
                          </td>
                          <td className="units-sold">
                            {safeNum(p.total_sold).toLocaleString()}
                          </td>
                          <td className="revenue-cell">
                            Rs. {safeNum(p.total_revenue).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="no-results">
                          No sales data yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {/* INVENTORY: Overview cards */}
            {activeReport === "inventory" && invSummary && (
              <div className="summary-cards">
                <div className="summary-card sc-blue">
                  <div className="sc-label">Total Medicines</div>
                  <div className="sc-value">{safeNum(invSummary.total_medicines)}</div>
                  <div className="sc-sub">In system</div>
                </div>
                <div className="summary-card sc-green">
                  <div className="sc-label">Total Stock</div>
                  <div className="sc-value sc-green-val">
                    {safeNum(invSummary.total_stock).toLocaleString()}
                  </div>
                  <div className="sc-sub">Units available</div>
                </div>
                <div className="summary-card sc-orange">
                  <div className="sc-label">Low Stock</div>
                  <div className="sc-value sc-orange-val">{safeNum(invSummary.low_stock)}</div>
                  <div className="sc-sub">Need reorder</div>
                </div>
                <div className="summary-card sc-pink">
                  <div className="sc-label">Out of Stock</div>
                  <div className="sc-value sc-pink-val">{safeNum(invSummary.out_of_stock)}</div>
                  <div className="sc-sub">Urgent reorder</div>
                </div>
              </div>
            )}
            {/* PURCHASE: Overview cards */}
            {activeReport === "purchase" && purSummary && (
              <div className="summary-cards">
                <div className="summary-card sc-blue">
                  <div className="sc-label">Total Orders</div>
                  <div className="sc-value">{safeNum(purSummary.total_orders)}</div>
                  <div className="sc-sub">Selected period</div>
                </div>
                <div className="summary-card sc-green">
                  <div className="sc-label">Total Spent</div>
                  <div className="sc-value sc-green-val">
                    Rs. {safeNum(purSummary.total_spent).toLocaleString()}
                  </div>
                  <div className="sc-sub">Selected period</div>
                </div>
                <div className="summary-card sc-orange">
                  <div className="sc-label">Pending Orders</div>
                  <div className="sc-value sc-orange-val">{safeNum(purSummary.pending)}</div>
                  <div className="sc-sub">Awaiting approval</div>
                </div>
                <div className="summary-card sc-pink">
                  <div className="sc-label">Received Orders</div>
                  <div className="sc-value sc-pink-val">{safeNum(purSummary.received)}</div>
                  <div className="sc-sub">Completed</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewReports;