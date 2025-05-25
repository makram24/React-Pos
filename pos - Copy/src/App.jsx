import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Auth, Home, Orders } from "./pages";
import Header from "./components/shared/Header";
import Tables from "./pages/Tables";
import TableOrder from "./pages/TableOrder";
import KitchenManagement from "./pages/KitchenManagement";
import DemoData from "./pages/DemoData";
import InventoryManagement from "./pages/InventoryManagement";
import ChefOrders from "./pages/ChefOrders";
import Analytics from "./pages/Analytics";
import { AuthProvider } from "./contexts/AuthContext";
import AdminDashboard from './pages/AdminDashboard';
// import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/Home" element={<Home />} />
          <Route path="/Tables" element={<Tables />} />
          <Route path="/Alerts" element={<Home />} />
          <Route path="/More" element={<Home />} />
          <Route path="/Orders" element={<Orders />} />
          <Route path="/TableOrder" element={<TableOrder />} />
          <Route path="/kitchen" element={<KitchenManagement />} />
          <Route path="/chef-orders" element={<ChefOrders />} />
          <Route path="/demo-data" element={<DemoData />} />
          <Route path="/inventory" element={<InventoryManagement />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
