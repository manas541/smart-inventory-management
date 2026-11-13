
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
export const getMovements = () => API.get("/api/inventory/movements");

// Products
export const createProduct = (data: {
  name: string;
  sku: string;
  description?: string;
  minimum_stock: number;
}) => API.post("/api/products/", data);

export const updateProduct = (id: number, data: {
  name?: string;
  sku?: string;
  description?: string | null;
  minimum_stock?: number;
}) => API.patch(`/api/products/${id}`, data);

export const deleteProduct = (id: number) =>
  API.delete(`/api/products/${id}`);

// Warehouses
export const createWarehouse = (data: {
  name: string;
  location: string;
}) => API.post("/api/warehouses/", data);

export const updateWarehouse = (id: number, data: {
  name?: string;
  location?: string;
}) => API.patch(`/api/warehouses/${id}`, data);

export const deleteWarehouse = (id: number) =>
  API.delete(`/api/warehouses/${id}`);

// Inventory
export const createInventory = (data: {
  product_id: number;
  warehouse_id: number;
  available_quantity: number;
}) => API.post("/api/inventory/", data);

export const updateInventory = (
  id: number,
  data: { available_quantity: number }
) => API.patch(`/api/inventory/${id}`, data);

export const deleteInventory = (id: number) =>
  API.delete(`/api/inventory/${id}`);

export const createStockMovement = (
  inventoryId: number,
  data: {
    movement_type: "INBOUND" | "OUTBOUND";
    quantity: number;
  }
) => API.post(`/api/inventory/${inventoryId}/movement`, data);

export default API;
