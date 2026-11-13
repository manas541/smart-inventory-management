import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Products from "./pages/Products";
import Warehouses from "./pages/Warehouses";
import Movements from "./pages/Movements";
import Alerts from "./pages/Alerts";
import Analytics from "./pages/Analytics";
import "./App.css";

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  return (
    <div className="app-layout">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <main className="main-content">
        <Header title={activePage} />

        {activePage === "Dashboard" && <Dashboard />}
        {activePage === "Inventory" && <Inventory />}
        {activePage === "Products" && <Products />}
        {activePage === "Warehouses" && <Warehouses />}
        {activePage === "Movements" && <Movements />}
        {activePage === "Alerts" && <Alerts />}
        {activePage === "Analytics" && <Analytics />}


{!["Dashboard", "Inventory","Products","Warehouses","Movements","Alerts","Analytics"].includes(activePage) && (
  <div className="page-placeholder">
    <h2>{activePage}</h2>
    <p>This section will be available shortly.</p>
  </div>
)}
      </main>
    </div>
  );
}