import { useEffect, useCallback, useState } from "react";
import {
  getProducts,
  getWarehouses,
  getInventory,
  getAlerts,
} from "../services/api";
import {
  Package,
  Warehouse,
  Boxes,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import StatCard from "../components/StatCard";
import InventoryTable from "../components/InventoryTable";
import AlertPanel from "../components/AlertPanel";

export default function Dashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [p, w, i, a] = await Promise.all([
        getProducts(),
        getWarehouses(),
        getInventory(),
        getAlerts(),
      ]);

      setProducts(p.data);
      setWarehouses(w.data);
      setInventory(i.data);
      setAlerts(a.data);
      setError("");
    } catch {
      setError("Unable to load dashboard data. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh dashboard whenever the backend pushes a WebSocket event.
  useEffect(() => {
    const socket = new WebSocket(import.meta.env.VITE_WS_URL);

    socket.onmessage = () => {
      loadData();
    };

    socket.onerror = () => {
      console.error("Inventory WebSocket connection error");
    };

    return () => socket.close();
  }, [loadData]);

  const activeAlerts = alerts.filter(
    (alert) => alert.status === "ACTIVE"
  );

  const totalUnits = inventory.reduce(
    (sum, item) => sum + item.available_quantity,
    0
  );

  const chartData = products.map((product) => {
    const quantity = inventory
      .filter((item) => item.product_id === product.id)
      .reduce((sum, item) => sum + item.available_quantity, 0);

    return {
      name: product.name,
      quantity,
    };
  });

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      {error && <div className="error-banner">{error}</div>}

      <div className="stats-grid">
        <StatCard
          title="Total Products"
          value={products.length}
          subtitle="Registered products"
          icon={Package}
          color="blue"
        />

        <StatCard
          title="Warehouses"
          value={warehouses.length}
          subtitle="Active locations"
          icon={Warehouse}
          color="purple"
        />

        <StatCard
          title="Total Stock Units"
          value={totalUnits.toLocaleString()}
          subtitle="Across all warehouses"
          icon={Boxes}
          color="green"
        />

        <StatCard
          title="Active Alerts"
          value={activeAlerts.length}
          subtitle="Require attention"
          icon={AlertTriangle}
          color="orange"
        />
      </div>

      <div className="content-grid">
        <div className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h3>Stock Overview</h3>
              <p>Available units by product</p>
            </div>
            <span className="live-label">Live data</span>
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="quantity"
                  fill="#4f46e5"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-state">No stock data available.</p>
          )}
        </div>

        <AlertPanel alerts={alerts} />
      </div>

      <InventoryTable
        inventory={inventory}
        products={products}
        warehouses={warehouses}
      />
    </div>
  );
}