
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getProducts = () => API.get("/api/products/");
export const getWarehouses = () => API.get("/api/warehouses/");
export const getInventory = () => API.get("/api/inventory/");
export const getAlerts = () => API.get("/api/alerts/");
export const getActiveAlerts = () => API.get("/api/alerts/active");

export const getMovements = () =>
  API.get("/api/inventory/movements");

export const createProduct = (data: {
  name: string;
  sku: string;
  description?: string;
  minimum_stock: number;
}) => API.post("/api/products/", data);

export const createWarehouse = (data: {
  name: string;
  location: string;
}) => API.post("/api/warehouses/", data);

export const createInventory = (data: {
  product_id: number;
  warehouse_id: number;
  available_quantity: number;
}) => API.post("/api/inventory/", data);

export const createStockMovement = (
  inventoryId: number,
  data: {
    movement_type: "INBOUND" | "OUTBOUND";
    quantity: number;
  }
) => API.post(`/api/inventory/${inventoryId}/movement`, data);

export default API;
