const pool = require("../db");

// Get all sales
const getAllSales = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM sales ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Get sales error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single sale with its items
const getSaleById = async (req, res) => {
  const { id } = req.params;

  try {
    const sale = await pool.query("SELECT * FROM sales WHERE id = $1", [id]);

    if (sale.rows.length === 0) {
      return res.status(404).json({ message: "Sale not found" });
    }

    const items = await pool.query(
      `SELECT si.*, m.name AS medicine_name
       FROM sale_items si
       LEFT JOIN medicines m ON si.medicine_id = m.id
       WHERE si.sale_id = $1`,
      [id]
    );

    res.json({ sale: sale.rows[0], items: items.rows });
  } catch (error) {
    console.error("Get sale error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new sale
const createSale = async (req, res) => {
  const {
    customer_name,
    customer_phone,
    items,
    subtotal,
    tax,
    discount,
    total,
    payment_method,
    wallet_transaction_id,
  } = req.body;

  try {
    // Small checks
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Sale items are required." });
    }

    if (payment_method === "Digital Wallet" && !wallet_transaction_id) {
      return res
        .status(400)
        .json({ message: "wallet_transaction_id is required for Digital Wallet payments." });
    }

    // Debug line: you MUST see this in terminal when you create sale
    console.log("createSale: using DB default invoice_number (sequence)");

    await pool.query("BEGIN");

    // IMPORTANT: invoice_number is NOT included here
    const saleResult = await pool.query(
      `INSERT INTO sales
       (
         customer_name,
         customer_phone,
         subtotal,
         tax,
         discount,
         total,
         payment_method,
         wallet_transaction_id,
         status
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Paid')
       RETURNING *`,
      [
        customer_name || "Walk-in Customer",
        customer_phone || null,
        subtotal,
        tax,
        discount || 0,
        total,
        payment_method || "Cash",
        payment_method === "Digital Wallet" ? wallet_transaction_id : null,
      ]
    );

    const saleRow = saleResult.rows[0];
    const saleId = saleRow.id;

    // Insert items + reduce stock
    for (const item of items) {
      const itemTotal = item.quantity * item.unit_price;

      await pool.query(
        `INSERT INTO sale_items (sale_id, medicine_id, quantity, unit_price, total)
         VALUES ($1, $2, $3, $4, $5)`,
        [saleId, item.medicine_id, item.quantity, item.unit_price, itemTotal]
      );

      await pool.query(
        "UPDATE medicines SET quantity = quantity - $1 WHERE id = $2",
        [item.quantity, item.medicine_id]
      );
    }

    await pool.query("COMMIT");

    // saleRow.invoice_number will now be INV-1, INV-2...
    res.status(201).json({
      message: "Sale created successfully",
      sale: saleRow,
    });
  } catch (error) {
    try {
      await pool.query("ROLLBACK");
    } catch (e) {
      // ignore
    }
    console.error("Create sale error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Get today's sales only
const getTodaySales = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM sales
       WHERE DATE(created_at) = CURRENT_DATE
       ORDER BY id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Today sales error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a sale
const deleteSale = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM sales WHERE id = $1 RETURNING id", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Sale not found" });
    }

    res.json({ message: "Sale deleted successfully" });
  } catch (error) {
    console.error("Delete sale error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllSales,
  getSaleById,
  createSale,
  getTodaySales,
  deleteSale,
};