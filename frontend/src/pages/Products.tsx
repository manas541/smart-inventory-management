
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/api";
import { Package, Plus, Search, RefreshCw, Pencil, Trash2, X, Check } from "lucide-react";

interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string;
  minimum_stock: number;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [minimumStock, setMinimumStock] = useState("10");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    sku: "",
    description: "",
    minimum_stock: "10",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProducts = async () => {
    try {
      const response = await getProducts();
      setProducts(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch {
      setError("Unable to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term)
    );
  }, [products, search]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const threshold = Number(minimumStock);

    if (!name.trim() || !sku.trim()) {
      setError("Product name and SKU are required.");
      return;
    }

    if (!Number.isInteger(threshold) || threshold < 0) {
      setError("Minimum stock must be a non-negative whole number.");
      return;
    }

    try {
      setSaving(true);
      await createProduct({
        name: name.trim(),
        sku: sku.trim(),
        description: description.trim(),
        minimum_stock: threshold,
      });

      setMessage("Product created successfully.");
      setName("");
      setSku("");
      setDescription("");
      setMinimumStock("10");
      await loadProducts();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Unable to create product.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      sku: product.sku,
      description: product.description ?? "",
      minimum_stock: String(product.minimum_stock),
    });
    setError("");
    setMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async (id: number) => {
    setError("");
    setMessage("");

    const threshold = Number(editForm.minimum_stock);

    if (!editForm.name.trim() || !editForm.sku.trim()) {
      setError("Product name and SKU are required.");
      return;
    }

    if (!Number.isInteger(threshold) || threshold < 0) {
      setError("Minimum stock must be a non-negative whole number.");
      return;
    }

    try {
      setSaving(true);
      await updateProduct(id, {
        name: editForm.name.trim(),
        sku: editForm.sku.trim(),
        description: editForm.description.trim(),
        minimum_stock: threshold,
      });

      setEditingId(null);
      setMessage("Product updated successfully.");
      await loadProducts();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Unable to update product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    const confirmed = window.confirm(
      `Delete product "${product.name}"?\n\nProducts with inventory, movement or alert history cannot be deleted.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await deleteProduct(product.id);
      setMessage("Product deleted successfully.");
      if (editingId === product.id) setEditingId(null);
      await loadProducts();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Unable to delete product.");
    }
  };

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div className="dashboard">
      <div className="inventory-toolbar">
        <div>
          <h2>Product Management</h2>
          <p>Create and manage the products tracked by your inventory.</p>
        </div>
        <button className="secondary-button" onClick={loadProducts}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-banner">{error}</div>}

      <div className="panel movement-panel">
        <div className="panel-heading">
          <div>
            <h3><Plus size={17} /> Add New Product</h3>
            <p>Enter product details and its low-stock threshold.</p>
          </div>
        </div>

        <form className="product-form" onSubmit={handleCreate}>
          <div className="form-group">
            <label>Product Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Laptop" required />
          </div>

          <div className="form-group">
            <label>SKU</label>
            <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. LAP-001" required />
          </div>

          <div className="form-group">
            <label>Minimum Stock Threshold</label>
            <input type="number" min="0" step="1" value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} required />
          </div>

          <div className="form-group full-width">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Product description (optional)" rows={3} />
          </div>

          <button className="primary-button" disabled={saving}>
            {saving ? "Creating..." : "Create Product"}
          </button>
        </form>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>All Products</h3>
            <p>{products.length} registered products</p>
          </div>
          <div className="product-search">
            <Search size={16} />
            <input placeholder="Search name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Description</th>
                <th>Minimum Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  {editingId === product.id ? (
                    <>
                      <td><input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></td>
                      <td><input value={editForm.sku} onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })} /></td>
                      <td><input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></td>
                      <td><input type="number" min="0" step="1" value={editForm.minimum_stock} onChange={(e) => setEditForm({ ...editForm, minimum_stock: e.target.value })} /></td>
                      <td>
                        <button className="primary-button" disabled={saving} onClick={() => handleUpdate(product.id)} title="Save">
                          <Check size={15} /> Save
                        </button>
                        <button className="secondary-button" onClick={cancelEdit} title="Cancel">
                          <X size={15} /> Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td><strong>{product.name}</strong></td>
                      <td>{product.sku}</td>
                      <td>{product.description || "-"}</td>
                      <td>{product.minimum_stock} units</td>
                      <td>
                        <button className="secondary-button" onClick={() => startEdit(product)} title="Edit product">
                          <Pencil size={15} /> Edit
                        </button>
                        <button className="secondary-button" onClick={() => handleDelete(product)} title="Delete product">
                          <Trash2 size={15} /> Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    <Package size={22} />
                    <p>No matching products found.</p>
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
