const express = require('express');
const router  = express.Router();

const login    = require('../controllers/auth/login');
const register = require('../controllers/auth/register');

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/register
router.post('/register', register);

module.exports = router;