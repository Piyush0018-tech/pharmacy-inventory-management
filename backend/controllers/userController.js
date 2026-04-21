const pool = require('../db');
const bcrypt = require('bcryptjs');

// ─── GET ALL USERS ───────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, role, status, created_at FROM users ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET SINGLE USER ─────────────────────────────────────
const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, role, status, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── ADD NEW USER ────────────────────────────────────────
const createUser = async (req, res) => {
  const { full_name, email, password, role, status } = req.body;

  try {
    // Check if email already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password, role, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, role, status`,
      [full_name, email, hashedPassword, role || 'Staff', status || 'Active']
    );

    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Create user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── UPDATE USER ─────────────────────────────────────────
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, role, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users 
       SET full_name = $1, email = $2, role = $3, status = $4
       WHERE id = $5
       RETURNING id, full_name, email, role, status`,
      [full_name, email, role, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── DELETE USER ─────────────────────────────────────────
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};