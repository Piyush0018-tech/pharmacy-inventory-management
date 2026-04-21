import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Attach token to every request automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Auth
export const loginUser= (data) => API.post('/auth/login', data);
export const registerUser = (data) => API.post('/auth/register', data);

// Users
export const getUsers    = ()   => API.get('/users');
export const createUser  = (data)     => API.post('/users', data);
export const updateUser  = (id, data) => API.put(`/users/${id}`, data);
export const deleteUser  = (id)   => API.delete(`/users/${id}`);

// Medicines
export const getMedicines  = ()    => API.get('/medicines');
export const createMedicine  = (data)     => API.post('/medicines', data);
export const updateMedicine  = (id, data) => API.put(`/medicines/${id}`, data);
export const deleteMedicine  = (id)  => API.delete(`/medicines/${id}`);
export const getLowStock   = ()    => API.get('/medicines/low-stock');
export const getExpiring   = ()   => API.get('/medicines/expiring');
export const getExpiringSoon = ()   => API.get('/medicines/expiring');
export const updateStock   = (id, data) => API.put(`/medicines/${id}/stock`, data);

// Purchases
export const getPurchases  = ()  => API.get('/purchases');
export const createPurchase   = (data)  => API.post('/purchases', data);
export const updatePurchaseStatus = (id, data) => API.put(`/purchases/${id}/status`, data);
export const getSuppliers   = ()    => API.get('/purchases/suppliers');
export const createSupplier   = (data)  => API.post('/purchases/suppliers', data);

// Sales
export const getSales  = ()   => API.get('/sales');
export const getTodaySales = () => API.get('/sales/today');
export const createSale = (data) => API.post('/sales', data);
export const getSaleById = (id) => API.get(`/sales/${id}`);

// Reports
export const getSalesReport   = (start, end) => API.get(`/reports/sales?start_date=${start}&end_date=${end}`);
export const getInventoryReport = ()  => API.get('/reports/inventory');
export const getPurchaseReport  = (start, end) => API.get(`/reports/purchases?start_date=${start}&end_date=${end}`);
export const getTopMedicines  = ()   => API.get('/reports/top-medicines');
export const getDashboardStats  = ()  => API.get('/reports/dashboard');