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
  TrendingDown,
  Scissors,
  Store,
  ShieldCheck,
  List, // <-- NOUVEAU
  FileText, // <-- NOUVEAU
  PieChart, // <-- NOUVEAU
  Scale, // <-- NOUVEAU
} from "lucide-react";
import logo from "../../assets/images/logo-transparent.png";

export default function AdministrationLayout({ department = "coiffure" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const role = user?.role || "receptionist";

  // ══════════════════════════════════════════════════════════════
  // ── 1. MENU COIFFURE HIÉRARCHISÉ ──
  // ══════════════════════════════════════════════════════════════
  const coiffureNavItems = [
    {
      id: "dashboard",
      label: "Tableau de Bord",
      icon: LayoutDashboard,
      path: "/administration/coiffure/dashboard",
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
      id: "caisse-rapide",
      label: "Vente Directe",
      icon: ShoppingCart,
      path: "/administration/coiffure/caisse-rapide",
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
      id: "ardoise",
      label: "Carnet Clients",
      icon: BookOpen,
      path: "/administration/coiffure/ardoise",
      roles: ["admin", "receptionist"],
    },

    // ── CHARGES SORTIES AU 1ER NIVEAU ──
    {
      id: "charges",
      label: "Charges (OPEX)",
      icon: TrendingDown,
      path: "/administration/coiffure/charges",
      roles: ["admin", "receptionist"],
    },

    {
      id: "group-salon",
      label: "Gestion Salon",
      icon: Scissors,
      roles: ["admin", "receptionist"],
      children: [
        {
          id: "menu",
          label: "Catalogue Prestations",
          icon: Coffee,
          path: "/administration/coiffure/menu",
          roles: ["admin"],
        },
        {
          id: "stock",
          label: "Gestion du Stock",
          icon: PackageSearch,
          path: "/administration/coiffure/stock",
          roles: ["admin", "receptionist"],
        },
        {
          id: "postes",
          label: "Stations / Postes",
          icon: LayoutGrid,
          path: "/administration/coiffure/postes",
          roles: ["admin"],
        },
        {
          id: "coiffeurs",
          label: "Équipe Coiffeurs",
          icon: UsersRound,
          path: "/administration/coiffure/coiffeurs",
          roles: ["admin"],
        },
      ],
    },

    // ── NOUVEAU GROUPE FINANCES & BILAN ──
    {
      id: "group-finance",
      label: "Finances & Bilan",
      icon: LineChart,
      roles: ["admin"],
      children: [
        {
          id: "activite",
          label: "Activité (Journaux)",
          icon: List,
          path: "/administration/coiffure/activite",
          roles: ["admin"],
        },
        {
          id: "rapports",
          label: "Rapports Financiers",
          icon: FileText,
          path: "/administration/coiffure/rapports",
          roles: ["admin"],
        },
        {
          id: "statistiques",
          label: "Statistiques & KPIs",
          icon: PieChart,
          path: "/administration/coiffure/statistiques",
          roles: ["admin"],
        },
        {
          id: "bilan",
          label: "Bilan Global (P&L)",
          icon: Scale,
          path: "/administration/coiffure/bilan",
          roles: ["admin"],
        },
      ],
    },

    {
      id: "group-admin",
      label: "Administration",
      icon: ShieldCheck,
      roles: ["admin"],
      children: [
        {
          id: "utilisateurs",
          label: "Comptes d'accès",
          icon: Key,
          path: "/administration/coiffure/utilisateurs",
          roles: ["admin"],
        },
        {
          id: "parametres",
          label: "Paramètres Système",
          icon: Settings,
          path: "/administration/coiffure/parametres",
          roles: ["admin"],
        },
      ],
    },
  ];

  // ══════════════════════════════════════════════════════════════
  // ── 2. MENU CAFÉ HIÉRARCHISÉ ──
  // ══════════════════════════════════════════════════════════════
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
      label: "Point de Vente (POS)",
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

    // ── CHARGES SORTIES AU 1ER NIVEAU ──
    {
      id: "charges",
      label: "Charges (OPEX)",
      icon: TrendingDown,
      path: "/administration/cafe/charges",
      roles: ["admin", "receptionist"],
    },

    {
      id: "group-cafe-stock",
      label: "Stocks & Articles",
      icon: Store,
      roles: ["admin"],
      children: [
        {
          id: "produits",
          label: "Catalogue Boissons",
          icon: Coffee,
          path: "/administration/cafe/produits",
          roles: ["admin"],
        },
        {
          id: "categories",
          label: "Catégories & Marques",
          icon: BadgeAlert,
          path: "/administration/cafe/categories",
          roles: ["admin"],
        },
        {
          id: "stock",
          label: "Gestion du Stock",
          icon: PackageSearch,
          path: "/administration/cafe/stock",
          roles: ["admin"],
        },
        {
          id: "fournisseurs",
          label: "Grossistes",
          icon: Truck,
          path: "/administration/cafe/fournisseurs",
          roles: ["admin"],
        },
      ],
    },

    // ── NOUVEAU GROUPE FINANCES & BILAN ──
    {
      id: "group-cafe-finance",
      label: "Finances & Bilan",
      icon: LineChart,
      roles: ["admin"],
      children: [
        {
          id: "activite",
          label: "Activité (Journaux)",
          icon: List,
          path: "/administration/cafe/activite",
          roles: ["admin"],
        },
        {
          id: "rapports",
          label: "Rapports Financiers",
          icon: FileText,
          path: "/administration/cafe/rapports",
          roles: ["admin"],
        },
        {
          id: "statistiques",
          label: "Statistiques & KPIs",
          icon: PieChart,
          path: "/administration/cafe/statistiques",
          roles: ["admin"],
        },
        {
          id: "bilan",
          label: "Bilan Global (P&L)",
          icon: Scale,
          path: "/administration/cafe/bilan",
          roles: ["admin"],
        },
      ],
    },
  ];

  const rawNavItems = department === "cafe" ? cafeNavItems : coiffureNavItems;

  const filteredNavItems = rawNavItems
    .filter((item) => user && item.roles.includes(user.role))
    .map((item) => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter((child) =>
            child.roles.includes(user.role),
          ),
        };
      }
      return item;
    })
    .filter((item) => !item.children || item.children.length > 0);

  useEffect(() => {
    if (department === "cafe")
      document.documentElement.classList.add("theme-cafe");
    else document.documentElement.classList.remove("theme-cafe");
    return () => document.documentElement.classList.remove("theme-cafe");
  }, [department]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getCurrentPageTitle = () => {
    for (const item of rawNavItems) {
      if (item.path === location.pathname) return item.label;
      if (item.children) {
        const found = item.children.find((c) => c.path === location.pathname);
        if (found) return found.label;
      }
    }
    return "VSP Admin";
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-main text-t-main transition-colors duration-100">
      <Sidebar logo={logo} navItems={filteredNavItems} appMode={department} />

      <div className="flex-1 flex flex-col h-full relative min-w-0">
        <header className="h-20 bg-surface border-b border-subtle px-8 flex items-center justify-between shrink-0 z-40 transition-colors duration-100 shadow-sm">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-brand transition-colors duration-100">
              {getCurrentPageTitle()}
            </h2>
            <p className="text-[10px] text-t-muted uppercase tracking-widest font-bold mt-1">
              {role === "admin" ? "Administrateur / Gérant" : "Réceptionniste"}{" "}
              —{" "}
              {department === "cafe" ? "Espace Cafétéria" : "Salon de Coiffure"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {user?.role === "admin" && (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    department === "cafe"
                      ? "/administration/cafe/parametres"
                      : "/administration/coiffure/parametres",
                  )
                }
                className={`p-2.5 sm:p-3 border transition-all cursor-pointer rounded-none flex items-center justify-center ${
                  location.pathname.includes("/parametres")
                    ? "bg-brand text-white border-brand shadow-md shadow-brand/20"
                    : "bg-main text-t-main border-subtle hover:text-brand hover:border-brand/50"
                }`}
                title="Paramètres Système"
              >
                <Settings size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="p-2.5 sm:p-3 bg-main text-red-500 border border-red-500/30 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all rounded-none flex items-center justify-center cursor-pointer shadow-sm"
              title="Se Déconnecter"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 sm:p-8 bg-main transition-colors duration-100 relative min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
