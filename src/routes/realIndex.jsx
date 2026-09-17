import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// LAYOUTS
import AdministrationLayout from "../components/layout/AdministrationLayout";
import BarberLayout from "../components/layout/BarberLayout";
import Login from "../pages/Login";

// (COIFFURE) PAGES
import ReceptionistDashboard from "../components/receptionist/ReceptionistDashboard";
import ClientsManager from "../components/receptionist/ClientsManager";
import PaymentsManager from "../components/receptionist/PaymentsManager";
import SalonManager from "../components/receptionist/SalonManager";
import PosteManager from "../components/receptionist/PosteManager";
import BarbersManager from "../components/receptionist/BarbersManager";
import StaffManager from "../components/receptionist/StaffManager";
import ReportsView from "../components/receptionist/ReportsView";
import SettingsView from "../components/receptionist/SettingsView";
import ArdoiseManager from "../components/receptionist/ArdoiseManager";
import CaisseManager from "../components/receptionist/CaisseManager";
import SalonPOS from "../pages/administration/coiffure/SalonPOS";

// (CAFE) PAGES
import CafeCommandes from "../pages/administration/cafe/CafeCommandes";
import CafeProducts from "../pages/administration/cafe/CafeProducts";
import CafeCategories from "../pages/administration/cafe/CafeCategories";
import CafeReports from "../pages/administration/cafe/CafeReports";
import CafeDashboard from "../pages/administration/cafe/CafeDashboard";
import CEODashboard from "../pages/administration/CEODashboard";
import ActiviteView from "../pages/administration/ActiviteView";
import StatistiquesView from "../pages/administration/StatistiquesView";

// IPAD / TABLET PAGES
import BarberTabletView from "../pages/coiffeur/BarberTabletView";

// SECURITY WRAPPER (Route Guard)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "barber_global")
      return <Navigate to="/coiffeur" replace />;
    if (user.role === "barber")
      return <Navigate to={`/coiffeur/salle/${user.barberId}`} replace />;
    return <Navigate to="/administration/coiffure/dashboard" replace />;
  }
  return children;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />

      {/* 1. ADMINISTRATION (COIFFURE) */}
      <Route
        path="/administration/coiffure"
        element={
          <ProtectedRoute allowedRoles={["admin", "receptionist"]}>
            <AdministrationLayout department="coiffure" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ReceptionistDashboard />} />
        <Route path="caisse-rapide" element={<SalonPOS />} />
        <Route path="clients" element={<ClientsManager />} />
        <Route path="paiements" element={<PaymentsManager />} />
        <Route path="ardoise" element={<ArdoiseManager />} />
        <Route path="caisse" element={<CaisseManager />} />

        {/* Gestion Salon */}
        <Route
          path="menu"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <SalonManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="postes"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <PosteManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="coiffeurs"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <BarbersManager />
            </ProtectedRoute>
          }
        />

        {/* Finances & Bilan */}
        <Route
          path="activite"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ActiviteView />
            </ProtectedRoute>
          }
        />
        <Route
          path="rapports"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ReportsView />
            </ProtectedRoute>
          }
        />
        <Route
          path="statistiques"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <StatistiquesView />
            </ProtectedRoute>
          }
        />
        <Route
          path="bilan"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CEODashboard />
            </ProtectedRoute>
          }
        />

        {/* Administration */}
        <Route
          path="utilisateurs"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <StaffManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="parametres"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <SettingsView />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 2. COIFFEUR (TABLETTE) */}
      <Route
        path="/coiffeur"
        element={
          <ProtectedRoute allowedRoles={["admin", "barber_global"]}>
            <BarberTabletView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coiffeur/salle/:id"
        element={
          <ProtectedRoute allowedRoles={["admin", "barber", "barber_global"]}>
            <BarberLayout />
          </ProtectedRoute>
        }
      />

      {/* 3. ADMINISTRATION (CAFÉ) */}
      <Route
        path="/administration/cafe"
        element={
          <ProtectedRoute allowedRoles={["admin", "receptionist"]}>
            <AdministrationLayout department="cafe" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CafeDashboard />} />
        <Route path="commandes" element={<CafeCommandes />} />
        <Route path="caisse" element={<CaisseManager />} />

        {/* Menu & Boissons */}
        <Route
          path="produits"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CafeProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="categories"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CafeCategories />
            </ProtectedRoute>
          }
        />

        {/* Finances & Bilan */}
        <Route
          path="activite"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ActiviteView />
            </ProtectedRoute>
          }
        />
        <Route
          path="rapports"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CafeReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="statistiques"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <StatistiquesView />
            </ProtectedRoute>
          }
        />
        <Route
          path="bilan"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CEODashboard />
            </ProtectedRoute>
          }
        />

        {/* Administration */}
        <Route
          path="parametres"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <SettingsView />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
