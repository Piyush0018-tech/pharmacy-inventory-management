import { useNavigate, useLocation } from "react-router-dom";

// Shared sidebar — shows different links based on user role
function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role;

  const navItems = [
    { label: "Dashboard", icon: "🏠", path: "/dashboard",        roles: ["Admin", "Staff"]   },
    { label: "Manage Users",     icon: "👥", path: "/manage-users",     roles: ["Admin"]   },
    { label: "Manage Inventory", icon: "📦", path: "/manage-inventory", roles: ["Admin", "Staff"]    },
    { label: "Manage Medicines", icon: "💊", path: "/manage-medicines", roles: ["Admin", "Staff"]   },
    { label: "Manage Purchases", icon: "🛍️", path: "/manage-purchases", roles: ["Admin"]    },
    { label: "Process Sales",  icon: "💰", path: "/process-sales",    roles: ["Admin", "Staff", "Customer"]  },
    { label: "Payment",   icon: "💳", path: "/payment",     roles: ["Admin", "Staff", "Customer"]  },
    { label: "View Reports",  icon: "📋", path: "/view-reports",     roles: ["Admin", "Staff"]  },
  ];

  // Only show links the logged in user is allowed to see
  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">💊</div>
        <div>
          <div className="sidebar-logo-name">MediTrack</div>
          <div className="sidebar-logo-sub">Pharmacy Inventory</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {visibleItems.map((item) => (
          <button
            key={item.label}
            className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;