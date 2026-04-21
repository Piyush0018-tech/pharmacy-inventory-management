const express = require('express');
const router  = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

// GET    /api/users          → get all users
router.get('/',        getAllUsers);

// GET    /api/users/:id      → get single user
router.get('/:id',     getUserById);

// POST   /api/users          → create new user
router.post('/',       createUser);

// PUT    /api/users/:id      → update user
router.put('/:id',     updateUser);

// DELETE /api/users/:id      → delete user
router.delete('/:id',  deleteUser);

module.exports = router;