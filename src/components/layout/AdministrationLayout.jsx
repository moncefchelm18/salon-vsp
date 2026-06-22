import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BookOpen,
  LayoutGrid,
  UsersRound,
  BarChart2,
  Settings,
  ShoppingCart,
  Coffee,
  PackageSearch,
  Truck,
  BadgeAlert,
  Wallet,
  Key,
  LogOut,
  LineChart,
  BookOpenCheck,
  TrendingDown,
} from "lucide-react";
import logo from "../../assets/images/logo.png";

export default function AdministrationLayout({ department = "coiffure" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const role = user?.role || "receptionist"; // Default to receptionist if no role is found

  // --- CONFIGURATION DES MENUS AVEC ROLES ---
  // Rôles disponibles : "admin", "receptionist"

  const coiffureNavItems = [
    {
      id: "dashboard",
      label: "Tableau de Bord",
      icon: LayoutDashboard,
      path: "/administration/coiffure/dashboard",
      roles: ["admin", "receptionist"],
    },
    {
      id: "caisse-rapide",
      label: "Vente Directe",
      icon: ShoppingCart,
      path: "/administration/coiffure/caisse-rapide",
      roles: ["admin", "receptionist"],
    },
    {
      id: "clients",
      label: "Salle d'Attente",
      icon: Users,
      path: "/administration/coiffure/clients",
      roles: ["admin", "receptionist"],
    },
    {
      id: "paiements",
      label: "Encaissements",
      icon: CreditCard,
      path: "/administration/coiffure/paiements",
      roles: ["admin", "receptionist"],
    },
    {
      id: "ardoise",
      label: "Carnet Clients",
      icon: BookOpen,
      path: "/administration/coiffure/ardoise",
      roles: ["admin", "receptionist"],
    },
    {
      id: "caisse",
      label: "Trésorerie",
      icon: Wallet,
      path: "/administration/coiffure/caisse",
      roles: ["admin", "receptionist"],
    },
    {
      id: "menu",
      label: "Catalogue",
      icon: Coffee,
      path: "/administration/coiffure/menu",
      roles: ["admin"],
    },
    {
      id: "postes",
      label: "Stations",
      icon: LayoutGrid,
      path: "/administration/coiffure/postes",
      roles: ["admin"],
    },
    {
      id: "coiffeurs",
      label: "Équipe",
      icon: UsersRound,
      path: "/administration/coiffure/coiffeurs",
      roles: ["admin"],
    },
    {
      id: "utilisateurs",
      label: "Comptes",
      icon: Key,
      path: "/administration/coiffure/utilisateurs",
      roles: ["admin"],
    },
    {
      id: "rapports",
      label: "Rapports",
      icon: BarChart2,
      path: "/administration/coiffure/rapports",
      roles: ["admin"],
    },
    {
      id: "ceo-dashboard",
      label: "Bilan",
      icon: LineChart,
      path: "/administration/coiffure/ceo-dashboard",
      roles: ["admin"],
    },
    {
      id: "charges",
      label: "Charges",
      icon: TrendingDown,
      path: "/administration/coiffure/charges",
      roles: ["admin"],
    }, // Import TrendingDown if needed
    {
      id: "parametres",
      label: "Paramètres",
      icon: Settings,
      path: "/administration/coiffure/parametres",
      roles: ["admin"],
    },
  ];

  const cafeNavItems = [
    {
      id: "dashboard",
      label: "Tableau de Bord",
      icon: LayoutDashboard,
      path: "/administration/cafe/dashboard",
      roles: ["admin", "receptionist"],
    },
    {
      id: "commandes",
      label: "Point de Vente",
      icon: ShoppingCart,
      path: "/administration/cafe/commandes",
      roles: ["admin", "receptionist"],
    },
    {
      id: "caisse",
      label: "Trésorerie",
      icon: Wallet,
      path: "/administration/cafe/caisse",
      roles: ["admin", "receptionist"],
    },
    {
      id: "produits",
      label: "Catalogue",
      icon: Coffee,
      path: "/administration/cafe/produits",
      roles: ["admin"],
    },
    {
      id: "categories",
      label: "Catégories",
      icon: BadgeAlert,
      path: "/administration/cafe/categories",
      roles: ["admin"],
    },
    {
      id: "stock",
      label: "Stocks",
      icon: PackageSearch,
      path: "/administration/cafe/stock",
      roles: ["admin"],
    },
    {
      id: "fournisseurs",
      label: "Fournisseurs",
      icon: Truck,
      path: "/administration/cafe/fournisseurs",
      roles: ["admin"],
    },
    {
      id: "rapports",
      label: "Rapports",
      icon: BarChart2,
      path: "/administration/cafe/rapports",
      roles: ["admin"],
    },
    {
      id: "ceo-dashboard",
      label: "Bilan",
      icon: LineChart,
      path: "/administration/cafe/ceo-dashboard",
      roles: ["admin"],
    },
    {
      id: "charges",
      label: "Charges",
      icon: TrendingDown,
      path: "/administration/cafe/charges",
      roles: ["admin"],
    },
    {
      id: "parametres",
      label: "Paramètres",
      icon: Settings,
      path: "/administration/cafe/parametres",
      roles: ["admin"],
    },
  ];

  // 1. Filtrer les menus en fonction du rôle de l'utilisateur connecté
  const rawNavItems = department === "cafe" ? cafeNavItems : coiffureNavItems;
  const filteredNavItems = rawNavItems.filter(
    (item) => user && item.roles.includes(user.role),
  );

  useEffect(() => {
    if (department === "cafe") {
      document.documentElement.classList.add("theme-cafe");
    } else {
      document.documentElement.classList.remove("theme-cafe");
    }
    return () => document.documentElement.classList.remove("theme-cafe");
  }, [department]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-main text-t-main transition-colors duration-100">
      {/* On envoie les items filtrés à la Sidebar */}
      <Sidebar logo={logo} navItems={filteredNavItems} appMode={department} />

      <div className="flex-1 flex flex-col h-full relative">
        <header className="h-20 bg-surface border-b border-subtle px-8 flex items-center justify-between shrink-0 z-40 transition-colors duration-100 shadow-sm">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-brand transition-colors duration-100">
              {filteredNavItems.find((n) => location.pathname === n.path)
                ?.label || "Picasso Admin"}
            </h2>
            <p className="text-[10px] text-t-muted uppercase tracking-widest font-bold mt-1">
              {role === "admin" ? "Administrateur" : "Receptionniste"} -{" "}
              {department === "cafe" ? "Cafétéria" : "Salon de Coiffure"}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="text-t-muted hover:text-red-500 flex items-center gap-2 font-bold text-xs uppercase transition-colors bg-main px-4 py-2 border border-subtle"
          >
            <LogOut size={14} /> Déconnexion
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-main transition-colors duration-100 relative">
          {/* L'Outlet rendra les pages filles */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
