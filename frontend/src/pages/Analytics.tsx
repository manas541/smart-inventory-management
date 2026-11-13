
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import {
  getWarehouses,
  getInventory,
  getMovements,
  getAlerts,
} from "../services/api";

type AnyRecord = Record<string, any>;

const COLORS = ["#6366f1", "#f59e0b", "#ef4444", "#10b981"];

function extractArray(response: any): AnyRecord[] {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;

  for (const key of [
    "items",
    "data",
    "warehouses",
    "inventory",
    "movements",
    "alerts",
  ]) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

export default function Analytics() {
  const [warehouses, setWarehouses] = useState<AnyRecord[]>([]);
  const [inventory, setInventory] = useState<AnyRecord[]>([]);
  const [movements, setMovements] = useState<AnyRecord[]>([]);
  const [alerts, setAlerts] = useState<AnyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");

        const [w, i, m, a] = await Promise.all([
          getWarehouses(),
          getInventory(),
          getMovements(),
          getAlerts(),
        ]);

        setWarehouses(extractArray(w));
        setInventory(extractArray(i));
        setMovements(extractArray(m));
        setAlerts(extractArray(a));
      } catch (err) {
        console.error("Analytics loading failed:", err);
        setError("Unable to load analytics. Please check the backend.");
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  const movementSummary = useMemo(() => {
    const inbound = movements
      .filter((m) => m.movement_type === "INBOUND")
      .reduce((sum, m) => sum + Number(m.quantity || 0), 0);

    const outbound = movements
      .filter((m) => m.movement_type === "OUTBOUND")
      .reduce((sum, m) => sum + Number(m.quantity || 0), 0);

    return [
      { name: "Inbound", quantity: inbound },
      { name: "Outbound", quantity: outbound },
    ];
  }, [movements]);

  const warehouseSummary = useMemo(() => {
    return warehouses.map((warehouse) => {
      const warehouseInventory = inventory.filter(
        (item) => item.warehouse_id === warehouse.id
      );

      const totalStock = warehouseInventory.reduce(
        (sum, item) => sum + Number(item.available_quantity || 0),
        0
      );

      return {
        name: warehouse.name,
        stock: totalStock,
      };
    });
  }, [warehouses, inventory]);

  const alertTypeSummary = useMemo(() => {
    const types = ["LOW_STOCK", "FAST_DEPLETION"];

    return types.map((type) => ({
      name: type === "LOW_STOCK" ? "Low Stock" : "Fast Depletion",
      value: alerts.filter((alert) => alert.alert_type === type).length,
    }));
  }, [alerts]);

  const severitySummary = useMemo(() => {
    const levels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

    return levels.map((level) => ({
      name: level,
      value: alerts.filter((alert) => alert.severity === level).length,
    }));
  }, [alerts]);

  const totalStock = inventory.reduce(
    (sum, item) => sum + Number(item.available_quantity || 0),
    0
  );

  const activeAlerts = alerts.filter(
    (alert) => alert.status === "ACTIVE"
  ).length;

  if (loading) {
    return <div className="page-loading">Loading analytics...</div>;
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <h2>Analytics</h2>
          <p>Inventory performance and operational insights</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Stock</span>
          <h2>{totalStock.toLocaleString()}</h2>
          <span className="stat-description">Units across all warehouses</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Total Movements</span>
          <h2>{movements.length}</h2>
          <span className="stat-description">Recorded stock transactions</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Active Alerts</span>
          <h2>{activeAlerts}</h2>
          <span className="stat-description">Alerts requiring attention</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Warehouses</span>
          <h2>{warehouses.length}</h2>
          <span className="stat-description">Registered locations</span>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Inbound vs Outbound</h3>
              <p>Total units moved by transaction type</p>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={movementSummary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantity" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Alerts by Type</h3>
              <p>Distribution of recorded alerts</p>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={alertTypeSummary}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  label
                >
                  {alertTypeSummary.map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Stock by Warehouse</h3>
              <p>Current available units at each location</p>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={warehouseSummary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="stock" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Alerts by Severity</h3>
              <p>Breakdown of alert severity levels</p>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severitySummary}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  label
                >
                  {severitySummary.map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
