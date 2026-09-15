import { Outlet, useLocation, useNavigate } from "react-router-dom"; // <-- Add useNavigate
import { useAuth } from "../context/AuthContext"; // <-- Import the context hook
import Sidebar from "../components/layout/Sidebar"; // Assuming path
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BookOpen,
  UsersRound,
  BarChart2,
  ShoppingCart,
  Coffee,
  LayoutGrid,
  LogOut,
  Settings,
} from "lucide-react";
import logo from "../assets/images/logo_no_bg.png";

export default function ReceptionistLayout() {
  const location = useLocation();
  const navigate = useNavigate(); // <-- Initialize navigate
  const { logout } = useAuth(); // <-- Get the logout function from your auth context
  const isCafe = location.pathname.startsWith("/cafe");

  const navItems = isCafe
    ? [
        {
          id: "dashboard",
          label: "Cafe Dashboard",
          icon: LayoutDashboard,
          path: "/receptionist/cafe/dashboard",
        },
        {
          id: "pos",
          label: "Point of Sale",
          icon: ShoppingCart,
          path: "/receptionist/cafe/pos",
        },
        {
          id: "menu",
          label: "Cafe Menu",
          icon: Coffee,
          path: "/receptionist/cafe/menu",
        },
      ]
    : [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          path: "/receptionist/dashboard",
        },
        {
          id: "clients",
          label: "Clients",
          icon: Users,
          path: "/receptionist/clients",
        },
        {
          id: "payments",
          label: "Payments",
          icon: CreditCard,
          path: "/receptionist/payments",
        },
        {
          id: "menu",
          label: "Salon Menu",
          icon: BookOpen,
          path: "/receptionist/menu",
        },
        {
          id: "postes",
          label: "Stations",
          icon: LayoutGrid,
          path: "/receptionist/postes",
        },
        {
          id: "barbers",
          label: "Barbers",
          icon: UsersRound,
          path: "/receptionist/barbers",
        },
        {
          id: "reports",
          label: "Reports",
          icon: BarChart2,
          path: "/receptionist/reports",
        },
        {
          id: "settings",
          label: "Settings",
          icon: Settings,
          path: "/receptionist/settings",
        },
      ];
  const handleLogout = () => {
    logout(); // This clears localStorage and user state from AuthContext
    navigate("/login"); // Instantly sends them back to the login page
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar
        logo={logo}
        navItems={navItems}
        appMode={isCafe ? "cafe" : "barber"}
      />

      <div className="flex-1 flex flex-col h-full relative">
        <header className="h-20 bg-slate-900 border-b border-slate-800 px-8 flex items-center justify-between shrink-0 z-40">
          <h2 className="text-xl font-bold uppercase tracking-widest text-slate-200">
            {navItems.find((n) => location.pathname === n.path)?.label ||
              "VSP Admin"}
          </h2>

          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-amber-400 flex items-center gap-2 font-bold text-xs uppercase transition-colors hover:cursor-pointer"
          >
            <LogOut size={16} /> Logout
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
