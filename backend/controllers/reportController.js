const pool = require("../db");

// SALES REPORT — with date range and 7-day trend
const getSalesReport = async (req, res) => {
  const { start_date, end_date } = req.query;

  try {
    if (!start_date || !end_date) {
      return res.status(400).json({ message: "start_date and end_date are required." });
    }

    const result = await pool.query(
      `SELECT
         COUNT(*) AS total_transactions,
         COALESCE(SUM(total), 0) AS total_sales,
         COALESCE(AVG(total), 0) AS average_sale,
         COALESCE(SUM(tax), 0) AS total_tax,
         COALESCE(SUM(discount), 0) AS total_discount
       FROM sales
       WHERE DATE(created_at) BETWEEN $1 AND $2`,
      [start_date, end_date]
    );

    const trend = await pool.query(
      `SELECT
         DATE(created_at) AS date,
         COALESCE(SUM(total), 0) AS total
       FROM sales
       WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    res.json({ summary: result.rows[0], trend: trend.rows });
  } catch (error) {
    console.error("Sales report error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
};

// TOP 5 SELLING MEDICINES
const getTopSellingMedicines = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         m.name,
         m.category,
         COALESCE(SUM(si.quantity), 0) AS total_sold,
         COALESCE(SUM(si.total), 0) AS total_revenue
       FROM sale_items si
       LEFT JOIN medicines m ON si.medicine_id = m.id
       GROUP BY m.id, m.name, m.category
       ORDER BY total_sold DESC
       LIMIT 5`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Top medicines error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
};

// INVENTORY REPORT — summary + low stock + expiring soon
const getInventoryReport = async (req, res) => {
  try {
    const summaryQ = await pool.query(
      `SELECT
         COUNT(*) AS total_medicines,
         COALESCE(SUM(quantity), 0) AS total_stock,
         COUNT(DISTINCT category) AS total_categories,
         COUNT(CASE WHEN quantity = 0 THEN 1 END) AS out_of_stock,
         COUNT(CASE WHEN quantity < min_stock THEN 1 END) AS low_stock
       FROM medicines`
    );

    const lowStockQ = await pool.query(
      `SELECT id, name, category, quantity, min_stock, price, expiry_date
       FROM medicines
       WHERE quantity < min_stock
       ORDER BY quantity ASC, name ASC
       LIMIT 50`
    );

    const expiringSoonQ = await pool.query(
      `SELECT id, name, category, quantity, price, expiry_date
       FROM medicines
       WHERE expiry_date IS NOT NULL
         AND expiry_date <> ''
         AND TO_DATE(expiry_date, 'YYYY-MM-DD') <= (CURRENT_DATE + INTERVAL '6 months')
       ORDER BY TO_DATE(expiry_date, 'YYYY-MM-DD') ASC, name ASC
       LIMIT 50`
    );

    res.json({
      summary:             summaryQ.rows[0],
      low_stock_items:     lowStockQ.rows,
      expiring_soon_items: expiringSoonQ.rows,
    });
  } catch (error) {
    console.error("Inventory report error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
};

// PURCHASE REPORT — summary by date range
const getPurchaseReport = async (req, res) => {
  const { start_date, end_date } = req.query;

  try {
    if (!start_date || !end_date) {
      return res.status(400).json({ message: "start_date and end_date are required." });
    }

    const summary = await pool.query(
      `SELECT
         COUNT(*) AS total_orders,
         COALESCE(SUM(total_amount), 0) AS total_spent,
         COUNT(CASE WHEN status = 'Pending'  THEN 1 END) AS pending,
         COUNT(CASE WHEN status = 'Approved' THEN 1 END) AS approved,
         COUNT(CASE WHEN status = 'Received' THEN 1 END) AS received
       FROM purchases
       WHERE DATE(created_at) BETWEEN $1 AND $2`,
      [start_date, end_date]
    );

    res.json({ summary: summary.rows[0] });
  } catch (error) {
    console.error("Purchase report error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
};

// DASHBOARD STATS — 4 summary numbers for stat cards
const getDashboardStats = async (req, res) => {
  try {
    const medicines  = await pool.query("SELECT COUNT(*) AS total FROM medicines");
    const todaySales = await pool.query(
      `SELECT COALESCE(SUM(total), 0) AS total
       FROM sales WHERE DATE(created_at) = CURRENT_DATE`
    );
    const lowStock = await pool.query(
      "SELECT COUNT(*) AS total FROM medicines WHERE quantity < min_stock"
    );
    const users = await pool.query("SELECT COUNT(*) AS total FROM users");

    res.json({
      total_medicines: medicines.rows[0].total,
      today_sales:     todaySales.rows[0].total,
      low_stock:       lowStock.rows[0].total,
      total_users:     users.rows[0].total,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
};

// RECENT ACTIVITIES — real data from sales, medicines, purchases
// Combines all 3 sources, sorts by newest, returns top 10
const getRecentActivities = async (req, res) => {
  try {
    // Last 5 completed sales
    const salesRes = await pool.query(
      `SELECT invoice_number, customer_name, total, created_at
       FROM sales
       ORDER BY created_at DESC
       LIMIT 5`
    );

    // Last 5 medicines added to system
    const medsRes = await pool.query(
      `SELECT name, category, created_at
       FROM medicines
       ORDER BY created_at DESC
       LIMIT 5`
    );

    // Last 3 purchase orders
    const purchasesRes = await pool.query(
      `SELECT p.status, p.created_at, s.name AS supplier_name
       FROM purchases p
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       ORDER BY p.created_at DESC
       LIMIT 3`
    );

    const activities = [];

    // Sales — green dot
    salesRes.rows.forEach((s) => {
      activities.push({
        color: "#22c55e",
        text:  `Sale completed — Invoice ${s.invoice_number} (${s.customer_name || "Walk-in"})`,
        time:  s.created_at,
      });
    });

    // Medicines — blue dot
    medsRes.rows.forEach((m) => {
      activities.push({
        color: "#3b82f6",
        text:  `Medicine "${m.name}" added to inventory`,
        time:  m.created_at,
      });
    });

    // Purchases — purple if received, orange if pending
    purchasesRes.rows.forEach((p) => {
      activities.push({
        color: p.status === "Received" ? "#8b5cf6" : "#f59e0b",
        text:  `Purchase order from ${p.supplier_name || "supplier"} — ${p.status}`,
        time:  p.created_at,
      });
    });

    // Sort newest first and return top 10
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    res.json(activities.slice(0, 10));

  } catch (error) {
    console.error("Recent activities error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getSalesReport,
  getTopSellingMedicines,
  getInventoryReport,
  getPurchaseReport,
  getDashboardStats,
  getRecentActivities,
};