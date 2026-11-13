import { getProducts, getWarehouses, getInventory, getAlerts } from "./api";

async function testConnection() {
  try {
    const [products, warehouses, inventory, alerts] = await Promise.all([
      getProducts(),
      getWarehouses(),
      getInventory(),
      getAlerts(),
    ]);

    console.log("Products:", products.data);
    console.log("Warehouses:", warehouses.data);
    console.log("Inventory:", inventory.data);
    console.log("Alerts:", alerts.data);

    console.log("Backend connection successful!");
  } catch (error) {
    console.error("Backend connection failed:", error);
  }
}

testConnection();