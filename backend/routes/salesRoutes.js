const express = require('express');
const router = express.Router();
const {
  getAllSales,
  getSaleById,
  createSale,
  getTodaySales,
  deleteSale
} = require('../controllers/salesController');
// GET    /api/sales          → all sales
router.get('/', getAllSales);
// GET    /api/sales/today    → today's sales
router.get('/today', getTodaySales);
// GET    /api/sales/:id      → single sale with items
router.get('/:id', getSaleById);
// POST   /api/sales          → create new sale
router.post('/', createSale);
// DELETE /api/sales/:id      → delete sale
router.delete('/:id', deleteSale);
module.exports = router;