
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  getWarehouses,
  getProducts,
  getInventory,
  createWarehouse,
  createInventory,
} from "../services/api";
import { Warehouse as WarehouseIcon, Plus, RefreshCw } from "lucide-react";

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [initialQuantity, setInitialQuantity] = useState("0");

  const [loading, setLoading] = useState(true);
  const [savingWarehouse, setSavingWarehouse] = useState(false);
  const [savingInventory, setSavingInventory] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [w, p, i] = await Promise.all([
        getWarehouses(),
        getProducts(),
        getInventory(),
      ]);

      setWarehouses(Array.isArray(w.data) ? w.data : []);
      setProducts(Array.isArray(p.data) ? p.data : []);
      setInventory(Array.isArray(i.data) ? i.data : []);
      setError("");
    } catch {
      setError("Unable to load warehouse data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateWarehouse = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!name.trim() || !location.trim()) {
      setError("Warehouse name and location are required.");
      return;
    }

    try {
      setSavingWarehouse(true);

      await createWarehouse({
        name: name.trim(),
        location: location.trim(),
      });

      setMessage("Warehouse created successfully.");
      setName("");
      setLocation("");

      await loadData();
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Unable to create warehouse."
      );
    } finally {
      setSavingWarehouse(false);
    }
  };

  const handleAssignInventory = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const quantity = Number(initialQuantity);

    if (!productId || !warehouseId) {
      setError("Please select both a product and warehouse.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      setError("Initial stock must be a non-negative whole number.");
      return;
    }

    const alreadyExists = inventory.some(
      (item) =>
        item.product_id === Number(productId) &&
        item.warehouse_id === Number(warehouseId)
    );

    if (alreadyExists) {
      setError("This product already has an inventory record in this warehouse.");
      return;
    }

    try {
      setSavingInventory(true);

      await createInventory({
        product_id: Number(productId),
        warehouse_id: Number(warehouseId),
        available_quantity: quantity,
      });

      setMessage("Product successfully assigned to warehouse.");
      setProductId("");
      setWarehouseId("");
      setInitialQuantity("0");

      await loadData();
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Unable to assign product to warehouse."
      );
    } finally {
      setSavingInventory(false);
    }
  };

  if (loading) return <div className="loading">Loading warehouses...</div>;

  return (
    <div className="dashboard">
      <div className="inventory-toolbar">
        <div>
          <h2>Warehouse Management</h2>
          <p>Manage warehouse locations and their stock.</p>
        </div>

        <button className="secondary-button" onClick={loadData}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <div className="content-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3><Plus size={17} /> Create Warehouse</h3>
              <p>Add a new storage location.</p>
            </div>
          </div>

          <form className="stacked-form" onSubmit={handleCreateWarehouse}>
            <div className="form-group">
              <label>Warehouse Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mumbai Warehouse"
                required
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Mumbai, Maharashtra"
                required
              />
            </div>

            <button className="primary-button" disabled={savingWarehouse}>
              {savingWarehouse ? "Creating..." : "Create Warehouse"}
            </button>
          </form>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3><WarehouseIcon size={17} /> Assign Product Stock</h3>
              <p>Create an inventory record for a warehouse.</p>
            </div>
          </div>

          <form className="stacked-form" onSubmit={handleAssignInventory}>
            <div className="form-group">
              <label>Product</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Warehouse</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                required
              >
                <option value="">Select warehouse</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Initial Stock Quantity</label>
              <input
                type="number"
                min="0"
                step="1"
                value={initialQuantity}
                onChange={(e) => setInitialQuantity(e.target.value)}
                required
              />
            </div>

            <button
              className="primary-button"
              disabled={savingInventory || products.length === 0 || warehouses.length === 0}
            >
              {savingInventory ? "Assigning..." : "Assign Product"}
            </button>
          </form>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Registered Warehouses</h3>
            <p>{warehouses.length} warehouse locations</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Warehouse</th>
                <th>Location</th>
                <th>Product Records</th>
                <th>Total Stock Units</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((warehouse) => {
                const records = inventory.filter(
                  (item) => item.warehouse_id === warehouse.id
                );

                const totalStock = records.reduce(
                  (sum, item) => sum + item.available_quantity,
                  0
                );

                return (
                  <tr key={warehouse.id}>
                    <td><strong>{warehouse.name}</strong></td>
                    <td>{warehouse.location}</td>
                    <td>{records.length}</td>
                    <td>{totalStock}</td>
                  </tr>
                );
              })}

              {warehouses.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-state">
                    No warehouses registered yet.
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
