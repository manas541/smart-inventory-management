
import { useEffect, useMemo, useState } from "react";
import { getAlerts, getProducts, getWarehouses } from "../services/api";
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

interface Alert {
  id: number;
  product_id: number;
  warehouse_id: number;
  alert_type: string;
  severity: string;
  status: string;
  message: string;
  created_at: string;
  resolved_at?: string | null;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [a, p, w] = await Promise.all([
        getAlerts(),
        getProducts(),
        getWarehouses(),
      ]);

      setAlerts(Array.isArray(a.data) ? a.data : []);
      setProducts(Array.isArray(p.data) ? p.data : []);
      setWarehouses(Array.isArray(w.data) ? w.data : []);
      setError("");
    } catch {
      setError("Unable to load alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeAlerts = alerts.filter((a) => a.status === "ACTIVE");
  const resolvedAlerts = alerts.filter((a) => a.status === "RESOLVED");
  const criticalAlerts = activeAlerts.filter(
    (a) => ["HIGH", "CRITICAL"].includes(a.severity)
  );

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesStatus =
        statusFilter === "ALL" || alert.status === statusFilter;

      const matchesType =
        typeFilter === "ALL" || alert.alert_type === typeFilter;

      return matchesStatus && matchesType;
    });
  }, [alerts, statusFilter, typeFilter]);

  if (loading) return <div className="loading">Loading alerts...</div>;

  return (
    <div className="dashboard">
      <div className="inventory-toolbar">
        <div>
          <h2>Inventory Alerts</h2>
          <p>Monitor low stock and fast-depleting inventory.</p>
        </div>

        <button className="secondary-button" onClick={loadData}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>Active Alerts</span>
            <AlertTriangle color="#e58a22" />
          </div>
          <h2>{activeAlerts.length}</h2>
          <p>Require attention</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Critical / High</span>
            <AlertTriangle color="#ef4444" />
          </div>
          <h2>{criticalAlerts.length}</h2>
          <p>High-priority active alerts</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Resolved Alerts</span>
            <CheckCircle color="#16a36a" />
          </div>
          <h2>{resolvedAlerts.length}</h2>
          <p>Previously resolved</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Total Alerts</span>
          </div>
          <h2>{alerts.length}</h2>
          <p>All recorded alerts</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Alert History</h3>
            <p>{filteredAlerts.length} alerts displayed</p>
          </div>

          <div className="alert-filters">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="FAST_DEPLETION">Fast Depletion</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Product</th>
                <th>Warehouse</th>
                <th>Alert Type</th>
                <th>Message</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>

            <tbody>
              {filteredAlerts.map((alert) => {
                const product = products.find(
                  (p) => p.id === alert.product_id
                );

                const warehouse = warehouses.find(
                  (w) => w.id === alert.warehouse_id
                );

                return (
                  <tr key={alert.id}>
                    <td>#{alert.id}</td>
                    <td><strong>{product?.name ?? "Unknown"}</strong></td>
                    <td>{warehouse?.name ?? "Unknown"}</td>
                    <td>{alert.alert_type.replace("_", " ")}</td>
                    <td className="alert-message-cell">{alert.message}</td>
                    <td>
                      <span className={`severity-badge ${alert.severity.toLowerCase()}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${alert.status === "ACTIVE" ? "low" : "healthy"}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td>{new Date(alert.created_at).toLocaleString()}</td>
                  </tr>
                );
              })}

              {filteredAlerts.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-state">
                    No alerts match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
