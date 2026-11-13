
import { useEffect, useState } from "react";
import {
  getInventory,
  getProducts,
  getWarehouses,
  createStockMovement,
} from "../services/api";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Package,
} from "lucide-react";

export default function Inventory() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [movementType, setMovementType] =
    useState<"INBOUND" | "OUTBOUND">("INBOUND");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [i, p, w] = await Promise.all([
        getInventory(),
        getProducts(),
        getWarehouses(),
      ]);

      setInventory(Array.isArray(i.data) ? i.data : []);
      setProducts(Array.isArray(p.data) ? p.data : []);
      setWarehouses(Array.isArray(w.data) ? w.data : []);
    } catch {
      setError("Unable to load inventory data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const amount = Number(quantity);

    if (!selectedId) {
      setError("Please select an inventory item.");
      return;
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    try {
      setSaving(true);

      await createStockMovement(Number(selectedId), {
        movement_type: movementType,
        quantity: amount,
      });

      setMessage(
        `${movementType === "INBOUND" ? "Stock received" : "Stock dispatched"} successfully.`
      );
      setQuantity("1");
      await loadData();
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Unable to process stock movement."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading inventory...</div>;

  return (
    <div className="dashboard">
      <div className="inventory-toolbar">
        <div>
          <h2>Inventory Management</h2>
          <p>Track stock levels across all warehouses.</p>
        </div>
        <button className="secondary-button" onClick={loadData}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="panel movement-panel">
        <div className="panel-heading">
          <div>
            <h3>Record Stock Movement</h3>
            <p>Receive new stock or dispatch existing stock.</p>
          </div>
        </div>

        <form className="movement-form" onSubmit={handleMovement}>
          <div className="form-group">
            <label>Inventory Item</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              required
            >
              <option value="">Select product and warehouse</option>
              {inventory.map((item) => {
                const product = products.find(
                  (p) => p.id === item.product_id
                );
                const warehouse = warehouses.find(
                  (w) => w.id === item.warehouse_id
                );

                return (
                  <option key={item.id} value={item.id}>
                    {product?.name ?? "Unknown"} - {warehouse?.name ?? "Unknown"}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-group">
            <label>Movement Type</label>
            <select
              value={movementType}
              onChange={(e) =>
                setMovementType(e.target.value as "INBOUND" | "OUTBOUND")
              }
            >
              <option value="INBOUND">Inbound - Stock In</option>
              <option value="OUTBOUND">Outbound - Stock Out</option>
            </select>
          </div>

          <div className="form-group">
            <label>Quantity</label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <button className="primary-button" disabled={saving || inventory.length === 0}>
            {saving ? "Processing..." : "Submit Movement"}
          </button>
        </form>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-banner">{error}</div>}
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Current Stock</h3>
            <p>Available inventory by product and warehouse.</p>
          </div>
          <span className="live-label">
            {inventory.length} Records
          </span>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Warehouse</th>
                <th>Available Quantity</th>
                <th>Minimum Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => {
                const product = products.find(
                  (p) => p.id === item.product_id
                );
                const warehouse = warehouses.find(
                  (w) => w.id === item.warehouse_id
                );
                const lowStock =
                  item.available_quantity <= (product?.minimum_stock ?? 10);

                return (
                  <tr key={item.id}>
                    <td><strong>{product?.name ?? "Unknown"}</strong></td>
                    <td>{product?.sku ?? "-"}</td>
                    <td>{warehouse?.name ?? "Unknown"}</td>
                    <td><strong>{item.available_quantity}</strong></td>
                    <td>{product?.minimum_stock ?? "-"}</td>
                    <td>
                      <span className={`status-badge ${lowStock ? "low" : "healthy"}`}>
                        {lowStock ? "Low Stock" : "Healthy"}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {inventory.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    <Package size={24} />
                    <p>No inventory records available.</p>
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
