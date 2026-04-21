import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from "./pages/Dashboard";
import ManageUsers from './pages/ManageUsers';
import ManageInventory from "./pages/ManageInventory";
import ManageMedicines from "./pages/ManageMedicines";
import ManagePurchases from "./pages/ManagePurchases.jsx";
import ProcessSales from "./pages/ProcessSales";
import Payment from "./pages/Payment";
import ViewReports from "./pages/ViewReports";
import './App.css';

// Check if user is logged in
const isLoggedIn = () => {
  return localStorage.getItem("token") !== null;
};

// Get logged in user's role
const getUserRole = () => {
  const user = localStorage.getItem("user");
  if (!user) return null;
  try {
    return JSON.parse(user).role;
  } catch {
    return null;
  }
};

// Anyone logged in can access — if not logged in go to login
const ProtectedRoute = ({ element }) => {
  if (!isLoggedIn()) return <Navigate to="/login" />;
  return element;
};

// Only Admin can access — Staff and Customer go to dashboard
const AdminRoute = ({ element }) => {
  if (!isLoggedIn()) return <Navigate to="/login" />;
  if (getUserRole() !== "Admin") return <Navigate to="/dashboard" />;
  return element;
};

// Admin and Staff can access — Customer gets redirected to process-sales
const StaffRoute = ({ element }) => {
  if (!isLoggedIn()) return <Navigate to="/login" />;
  const role = getUserRole();
  if (role === "Customer") return <Navigate to="/process-sales" />;
  return element;
};

// Customer, Staff and Admin can access — just needs login
const CustomerRoute = ({ element }) => {
  if (!isLoggedIn()) return <Navigate to="/login" />;
  return element;
};

function App() {
  return (
    <Router>
      <Routes>

        {/* Public — no login needed */}
        <Route path="/"         element={<Navigate to="/login" />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin + Staff + Customer — all logged in users */}
        <Route path="/process-sales" element={<CustomerRoute element={<ProcessSales />} />} />
        <Route path="/payment"       element={<CustomerRoute element={<Payment />} />} />

        {/* Admin + Staff only — Customer cannot access */}
        <Route path="/dashboard"        element={<StaffRoute element={<Dashboard />} />} />
        <Route path="/manage-inventory" element={<StaffRoute element={<ManageInventory />} />} />
        <Route path="/manage-medicines" element={<StaffRoute element={<ManageMedicines />} />} />
        <Route path="/view-reports"     element={<StaffRoute element={<ViewReports />} />} />

        {/* Admin only — Staff and Customer cannot access */}
        <Route path="/manage-users"     element={<AdminRoute element={<ManageUsers />} />} />
        <Route path="/manage-purchases" element={<AdminRoute element={<ManagePurchases />} />} />

        {/* Unknown route — go to login */}
        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>
    </Router>
  );
}

export default App;