const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const {
  getAllPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchaseStatus,
  deletePurchase,
  getAllSuppliers,
  createSupplier
} = require('../controllers/purchaseController');

// NOTE: /suppliers routes must come BEFORE /:id
// Otherwise Express will treat "suppliers" as an ID param

// GET  /api/purchases/suppliers → get all suppliers
router.get('/suppliers', getAllSuppliers);

// POST /api/purchases/suppliers → add new supplier
router.post('/suppliers', createSupplier);

// DELETE /api/purchases/suppliers/:id → delete a supplier
router.delete('/suppliers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM suppliers WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Delete supplier error:', error.message);
    res.status(500).json({ message: 'Cannot delete supplier with existing orders' });
  }
});

// GET    /api/purchases      → get all purchases
router.get('/', getAllPurchases);

// GET    /api/purchases/:id  → get single purchase with items
router.get('/:id', getPurchaseById);

// POST   /api/purchases      → create new purchase order
router.post('/', createPurchase);

// PUT    /api/purchases/:id/status → update order status
router.put('/:id/status', updatePurchaseStatus);

// DELETE /api/purchases/:id  → delete purchase
router.delete('/:id', deletePurchase);

module.exports = router;