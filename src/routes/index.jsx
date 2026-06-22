import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // <-- IMPORT THE HOOK
// Pages/Layouts (now acting as Shells)
import Login from "../pages/Login";
import ReceptionistLayout from "../pages/ReceptionistLayout";
import BarberLayout from "../components/layout/BarberLayout";

// Sub-components for Receptionist (Barber Shop)
import ReceptionistDashboard from "../components/receptionist/ReceptionistDashboard";
import ClientsManager from "../components/receptionist/ClientsManager";
import PaymentsManager from "../components/receptionist/PaymentsManager";
import SalonManager from "../components/receptionist/SalonManager";
import PosteManager from "../components/receptionist/PosteManager";
import BarbersManager from "../components/receptionist/BarbersManager";
import ReportsView from "../components/receptionist/ReportsView";
import SettingsView from "../components/receptionist/SettingsView";

// Sub-components for Receptionist (Cafe - Logic Placeholder)
import CafeDashboard from "../components/receptionist/cafe/CafeDashboard";
import CafePOS from "../components/receptionist/cafe/CafePOS";
import CafeMenuManager from "../components/receptionist/cafe/CafeMenuManager";

// Shared components for Barber
import BarberTabletView from "../pages/Barber"; // The Selection + PIN workspace we just built

// A quick Protection wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  // 1. Not logged in? Go to login
  if (!user) return <Navigate to="/login" replace />;

  // 2. Logged in but wrong role (e.g. Barber trying to see Reports)?
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      {/* --- RECEPTIONIST ROUTES (BARBERSHOP MODE) --- */}
      <Route
        path="/receptionist"
        element={
          <ProtectedRoute>
            <ReceptionistLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ReceptionistDashboard />} />
        <Route path="clients" element={<ClientsManager />} />
        <Route path="paiements" element={<PaymentsManager />} />
        <Route path="menu" element={<SalonManager />} />
        <Route path="postes" element={<PosteManager />} />
        <Route path="barbers" element={<BarbersManager />} />
        <Route path="reports" element={<ReportsView />} />
        <Route path="settings" element={<SettingsView />} />

        {/* --- CAFE MODE ROUTES (Same Layout, different content) --- */}
        <Route path="cafe">
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<CafeDashboard />} />
          <Route path="pos" element={<CafePOS />} />
          <Route path="menu" element={<CafeMenuManager />} />
        </Route>
      </Route>

      {/* --- BARBER TABLET ROUTES --- */}
      <Route path="/barber" element={<BarberTabletView />} />

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
