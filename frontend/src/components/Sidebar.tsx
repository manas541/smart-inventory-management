
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ArrowLeftRight,
  Bell,
  BarChart3,
  Boxes,
} from "lucide-react";

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Inventory", icon: Package },
  { name: "Products", icon: Boxes },
  { name: "Warehouses", icon: Warehouse },
  { name: "Movements", icon: ArrowLeftRight },
  { name: "Alerts", icon: Bell },
  { name: "Analytics", icon: BarChart3 },
];

export default function Sidebar({
  activePage,
  setActivePage,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Boxes size={23} />
        </div>
        <div>
          <h2>StockFlow</h2>
          <span>Inventory Management</span>
        </div>
      </div>

      <div className="menu-label">WORKSPACE</div>

      <nav>
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              className={`nav-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => setActivePage(item.name)}
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="status-dot" />
        <span>System operational</span>
      </div>
    </aside>
  );
}
