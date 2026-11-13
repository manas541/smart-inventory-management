
import { useEffect, useState } from "react";
import { getMovements, getProducts, getWarehouses } from "../services/api";
import { ArrowDownCircle, ArrowUpCircle, RefreshCw } from "lucide-react";

interface Movement {
  id: number;
  product_id: number;
  warehouse_id: number;
  movement_type: "INBOUND" | "OUTBOUND";
  quantity: number;
  created_at: string;
}

export default function Movements() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [m, p, w] = await Promise.all([
        getMovements(),
        getProducts(),
        getWarehouses(),
      ]);

      setMovements(Array.isArray(m.data) ? m.data : []);
      setProducts(Array.isArray(p.data) ? p.data : []);
      setWarehouses(Array.isArray(w.data) ? w.data : []);
      setError("");
    } catch {
      setError("Unable to load movement history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMovements = movements.filter(
    (movement) =>
      filter === "ALL" || movement.movement_type === filter
  );

  const inboundTotal = movements
    .filter((m) => m.movement_type === "INBOUND")
    .reduce((sum, m) => sum + m.quantity, 0);

  const outboundTotal = movements
    .filter((m) => m.movement_type === "OUTBOUND")
    .reduce((sum, m) => sum + m.quantity, 0);

  if (loading) return <div className="loading">Loading movements...</div>;

  return (
    <div className="dashboard">
      <div className="inventory-toolbar">
        <div>
          <h2>Stock Movement History</h2>
          <p>Track every inbound and outbound stock transaction.</p>
        </div>

        <button className="secondary-button" onClick={loadData}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>Total Transactions</span>
          </div>
          <h2>{movements.length}</h2>
          <p>Recorded stock movements</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Units Received</span>
            <ArrowDownCircle color="#16a36a" />
          </div>
          <h2>{inboundTotal.toLocaleString()}</h2>
          <p>Total inbound quantity</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Units Dispatched</span>
            <ArrowUpCircle color="#e58a22" />
          </div>
          <h2>{outboundTotal.toLocaleString()}</h2>
          <p>Total outbound quantity</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Net Movement</span>
          </div>
          <h2>{(inboundTotal - outboundTotal).toLocaleString()}</h2>
          <p>Inbound minus outbound</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Transaction Records</h3>
            <p>{filteredMovements.length} transactions displayed</p>
          </div>

          <select
            className="movement-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">All Movements</option>
            <option value="INBOUND">Inbound Only</option>
            <option value="OUTBOUND">Outbound Only</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Product</th>
                <th>Warehouse</th>
                <th>Movement Type</th>
                <th>Quantity</th>
                <th>Date & Time</th>
              </tr>
            </thead>

            <tbody>
              {filteredMovements.map((movement) => {
                const product = products.find(
                  (p) => p.id === movement.product_id
                );

                const warehouse = warehouses.find(
                  (w) => w.id === movement.warehouse_id
                );

                const inbound = movement.movement_type === "INBOUND";

                return (
                  <tr key={movement.id}>
                    <td>#{movement.id}</td>
                    <td><strong>{product?.name ?? "Unknown"}</strong></td>
                    <td>{warehouse?.name ?? "Unknown"}</td>
                    <td>
                      <span className={`movement-badge ${inbound ? "inbound" : "outbound"}`}>
                        {inbound ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
                        {movement.movement_type}
                      </span>
                    </td>
                    <td><strong>{movement.quantity}</strong></td>
                    <td>
                      {new Date(movement.created_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}

              {filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No movement transactions found.
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
