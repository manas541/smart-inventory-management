
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  getInventory,
  getProducts,
  getWarehouses,
  createStockMovement,
  updateInventory,
  deleteInventory,
} from "../services/api";
import { RefreshCw, Package, Pencil, Trash2, X, Check } from "lucide-react";

interface InventoryRecord {
  id: number;
  product_id: number;
  warehouse_id: number;
  available_quantity: number;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  minimum_stock: number;
}

interface Warehouse {
  id: number;
  name: string;
}

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [movementType, setMovementType] = useState<"INBOUND" | "OUTBOUND">("INBOUND");
  const [quantity, setQuantity] = useState("1");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState("");

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
      setError("");
    } catch {
      setError("Unable to load inventory data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMovement = async (e: FormEvent) => {
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
      setError(err.response?.data?.detail || "Unable to process stock movement.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: InventoryRecord) => {
    setEditingId(item.id);
    setEditQuantity(String(item.available_quantity));
    setError("");
    setMessage("");
  };

  const handleUpdate = async (id: number) => {
    setError("");
    setMessage("");

    const newQuantity = Number(editQuantity);

    if (!Number.isInteger(newQuantity) || newQuantity < 0) {
      setError("Available quantity must be a non-negative whole number.");
      return;
    }

    try {
      setSaving(true);
      await updateInventory(id, {
        available_quantity: newQuantity,
      });

      setEditingId(null);
      setMessage("Inventory quantity updated successfully. Stock adjustment recorded.");
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Unable to update inventory.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: InventoryRecord) => {
    const product = products.find((p) => p.id === item.product_id);
    const warehouse = warehouses.find((w) => w.id === item.warehouse_id);

    const confirmed = window.confirm(
      `Delete inventory record for "${product?.name ?? "Unknown"}" at "${warehouse?.name ?? "Unknown"}"?\n\nOnly zero-stock records without movement history can be deleted.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await deleteInventory(item.id);
      setMessage("Inventory record deleted successfully.");
      if (editingId === item.id) setEditingId(null);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Unable to delete inventory record.");
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

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-banner">{error}</div>}

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
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} required>
              <option value="">Select product and warehouse</option>
              {inventory.map((item) => {
                const product = products.find((p) => p.id === item.product_id);
                const warehouse = warehouses.find((w) => w.id === item.warehouse_id);

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
              onChange={(e) => setMovementType(e.target.value as "INBOUND" | "OUTBOUND")}
            >
              <option value="INBOUND">Inbound - Stock In</option>
              <option value="OUTBOUND">Outbound - Stock Out</option>
            </select>
          </div>

          <div className="form-group">
            <label>Quantity</label>
            <input type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          </div>

          <button className="primary-button" disabled={saving || inventory.length === 0}>
            {saving ? "Processing..." : "Submit Movement"}
          </button>
        </form>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Current Stock</h3>
            <p>Available inventory by product and warehouse.</p>
          </div>
          <span className="live-label">{inventory.length} Records</span>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => {
                const product = products.find((p) => p.id === item.product_id);
                const warehouse = warehouses.find((w) => w.id === item.warehouse_id);
                const lowStock = item.available_quantity <= (product?.minimum_stock ?? 10);

                return (
                  <tr key={item.id}>
                    <td><strong>{product?.name ?? "Unknown"}</strong></td>
                    <td>{product?.sku ?? "-"}</td>
                    <td>{warehouse?.name ?? "Unknown"}</td>

                    <td>
                      {editingId === item.id ? (
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                        />
                      ) : (
                        <strong>{item.available_quantity}</strong>
                      )}
                    </td>

                    <td>{product?.minimum_stock ?? "-"}</td>

                    <td>
                      <span className={`status-badge ${lowStock ? "low" : "healthy"}`}>
                        {lowStock ? "Low Stock" : "Healthy"}
                      </span>
                    </td>

                    <td>
                      {editingId === item.id ? (
                        <>
                          <button className="primary-button" disabled={saving} onClick={() => handleUpdate(item.id)}>
                            <Check size={15} /> Save
                          </button>
                          <button className="secondary-button" onClick={() => setEditingId(null)}>
                            <X size={15} /> Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="secondary-button" onClick={() => startEdit(item)}>
                            <Pencil size={15} /> Edit
                          </button>
                          <button className="secondary-button" onClick={() => handleDelete(item)}>
                            <Trash2 size={15} /> Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}

              {inventory.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-state">
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
