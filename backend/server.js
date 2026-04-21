const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Allow frontend on port 5173 to talk to backend
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
require('./db');

// Routes
const authRoutes     = require('./routes/authRoutes');
const userRoutes     = require('./routes/userRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const salesRoutes    = require('./routes/salesRoutes');
const reportRoutes   = require('./routes/reportRoutes');

app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales',     salesRoutes);
app.use('/api/reports',   reportRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'MediTrack Pharmacy API', status: 'Running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});