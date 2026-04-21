const express = require('express');
const router  = express.Router();
const {
  getAllMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getLowStock,
  getExpiringSoon,
  updateStock
} = require('../controllers/medicineController');

// GET    /api/medicines  → all medicines
router.get('/', getAllMedicines);

// GET    /api/medicines/low-stock    → low stock medicines
router.get('/low-stock', getLowStock);

// GET    /api/medicines/expiring     → expiring soon
router.get('/expiring', getExpiringSoon);

// GET    /api/medicines/:id    → single medicine
router.get('/:id', getMedicineById);

// POST   /api/medicines    → add medicine
router.post('/', createMedicine);

// PUT    /api/medicines/:id  → update medicine
router.put('/:id', updateMedicine);

// PUT    /api/medicines/:id/stock    → update stock only
router.put('/:id/stock', updateStock);

// DELETE /api/medicines/:id → delete medicine
router.delete('/:id', deleteMedicine);

module.exports = router;