const pool = require('../db');

// ─── GET ALL PURCHASES ─────────────
const getAllPurchases = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, s.name AS supplier_name
       FROM purchases p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       ORDER BY p.id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get purchases error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET SINGLE PURCHASE WITH ITEMS ──────────
const getPurchaseById = async (req, res) => {
  const { id } = req.params;
  try {
    // Get purchase order
    const purchase = await pool.query(
      `SELECT p.*, s.name AS supplier_name
       FROM purchases p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.id = $1`,
      [id]
    );

    if (purchase.rows.length === 0) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    // Get items inside this purchase
    const items = await pool.query(
      `SELECT pi.*, m.name AS medicine_name
       FROM purchase_items pi
       LEFT JOIN medicines m ON pi.medicine_id = m.id
       WHERE pi.purchase_id = $1`,
      [id]
    );

    res.json({
      purchase: purchase.rows[0],
      items: items.rows
    });
  } catch (error) {
    console.error('Get purchase error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── CREATE PURCHASE ORDER ───────────
const createPurchase = async (req, res) => {
  const { supplier_id, order_date, items } = req.body;
  // items = [{ medicine_id, quantity, unit_price }]

  try {
    // Calculate grand total
    const total_amount = items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price, 0
    );

    // Insert purchase order
    const purchase = await pool.query(
      `INSERT INTO purchases (supplier_id, order_date, total_amount, status)
       VALUES ($1, $2, $3, 'Pending')
       RETURNING *`,
      [supplier_id, order_date, total_amount]
    );

    const purchaseId = purchase.rows[0].id;

    // Insert each medicine item
    for (const item of items) {
      const itemTotal = item.quantity * item.unit_price;
      await pool.query(
        `INSERT INTO purchase_items (purchase_id, medicine_id, quantity, unit_price, total)
         VALUES ($1, $2, $3, $4, $5)`,
        [purchaseId, item.medicine_id, item.quantity, item.unit_price, itemTotal]
      );

      // Update medicine stock when purchase is created
      await pool.query(
        'UPDATE medicines SET quantity = quantity + $1 WHERE id = $2',
        [item.quantity, item.medicine_id]
      );
    }

    res.status(201).json({
      message: 'Purchase order created successfully',
      purchase: purchase.rows[0]
    });
  } catch (error) {
    console.error('Create purchase error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── UPDATE PURCHASE STATUS ──────────
const updatePurchaseStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE purchases SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    res.json({
      message: 'Purchase status updated',
      purchase: result.rows[0]
    });
  } catch (error) {
    console.error('Update purchase error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── DELETE PURCHASE ────
const deletePurchase = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM purchases WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    res.json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    console.error('Delete purchase error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET ALL SUPPLIERS ────────
const getAllSuppliers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM suppliers ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get suppliers error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── ADD SUPPLIER ─────────
const createSupplier = async (req, res) => {
  const { name, contact, address } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO suppliers (name, contact, address)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, contact, address]
    );
    res.status(201).json({
      message: 'Supplier added successfully',
      supplier: result.rows[0]
    });
  } catch (error) {
    console.error('Create supplier error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchaseStatus,
  deletePurchase,
  getAllSuppliers,
  createSupplier
};