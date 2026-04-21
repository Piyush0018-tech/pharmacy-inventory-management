const pool = require('../db');

// ─── GET ALL MEDICINES ───────────────────────────────────
const getAllMedicines = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM medicines ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get medicines error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET SINGLE MEDICINE ─────────────────────────────────
const getMedicineById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM medicines WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get medicine error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── ADD NEW MEDICINE ────────────────────────────────────
const createMedicine = async (req, res) => {
  const { name, category, quantity, min_stock, price, expiry_date } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO medicines (name, category, quantity, min_stock, price, expiry_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, category, quantity || 0, min_stock || 50, price, expiry_date]
    );

    res.status(201).json({
      message: 'Medicine added successfully',
      medicine: result.rows[0]
    });
  } catch (error) {
    console.error('Create medicine error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── UPDATE MEDICINE ─────────────────────────────────────
const updateMedicine = async (req, res) => {
  const { id } = req.params;
  const { name, category, quantity, min_stock, price, expiry_date } = req.body;

  try {
    const result = await pool.query(
      `UPDATE medicines
       SET name=$1, category=$2, quantity=$3, min_stock=$4, price=$5, expiry_date=$6
       WHERE id=$7
       RETURNING *`,
      [name, category, quantity, min_stock, price, expiry_date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    res.json({
      message: 'Medicine updated successfully',
      medicine: result.rows[0]
    });
  } catch (error) {
    console.error('Update medicine error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── DELETE MEDICINE ─────────────────────────────────────
const deleteMedicine = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM medicines WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error('Delete medicine error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET LOW STOCK MEDICINES ─────────────────────────────
// Returns medicines where quantity is below min_stock
const getLowStock = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM medicines WHERE quantity < min_stock ORDER BY quantity ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Low stock error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET EXPIRING SOON MEDICINES ─────────────────────────
// Returns medicines expiring within 90 days
const getExpiringSoon = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM medicines
       WHERE expiry_date IS NOT NULL
       ORDER BY expiry_date ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Expiring soon error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── UPDATE STOCK QUANTITY ───────────────────────────────
// Add or remove quantity from a medicine
const updateStock = async (req, res) => {
  const { id } = req.params;
  const { quantity, action } = req.body; // action = 'add' or 'remove'

  try {
    // Get current quantity
    const current = await pool.query(
      'SELECT quantity FROM medicines WHERE id = $1',
      [id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    let newQty = current.rows[0].quantity;

    if (action === 'add') {
      newQty += Number(quantity);
    } else if (action === 'remove') {
      newQty = Math.max(0, newQty - Number(quantity));
    }

    const result = await pool.query(
      'UPDATE medicines SET quantity = $1 WHERE id = $2 RETURNING *',
      [newQty, id]
    );

    res.json({
      message: 'Stock updated successfully',
      medicine: result.rows[0]
    });
  } catch (error) {
    console.error('Update stock error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getLowStock,
  getExpiringSoon,
  updateStock
};