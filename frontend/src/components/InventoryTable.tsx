
interface InventoryItem {
  id: number;
  product_id: number;
  warehouse_id: number;
  available_quantity: number;
}

interface Props {
  inventory: InventoryItem[];
  products: any[];
  warehouses: any[];
}

export default function InventoryTable({
  inventory,
  products,
  warehouses,
}: Props) {
  return (
    <div className="panel">
      <div className="panel-heading">
        <div>
          <h3>Current Inventory</h3>
          <p>Stock availability across warehouses</p>
        </div>
        <span className="live-label">Live data</span>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Warehouse</th>
              <th>Available Stock</th>
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
                item.available_quantity <=
                (product?.minimum_stock ?? 10);

              return (
                <tr key={item.id}>
                  <td><strong>{product?.name ?? "Unknown"}</strong></td>
                  <td>{product?.sku ?? "-"}</td>
                  <td>{warehouse?.name ?? "Unknown"}</td>
                  <td>{item.available_quantity}</td>
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
                <td colSpan={5} className="empty-state">
                  No inventory records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
