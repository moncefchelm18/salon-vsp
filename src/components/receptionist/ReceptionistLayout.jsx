"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart2,
  UsersRound,
  BookOpen,
} from "lucide-react";
import ReceptionistDashboard from "./ReceptionistDashboard";
import ClientsManager from "./ClientsManager";
import PaymentsManager from "./PaymentsManager";
import ReportsView from "./ReportsView";
import BarbersManager from "./BarbersManager";
import SalonManager from "./SalonManager";

import logo from "../../images/logo.png";
// Navigation items configuration
const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "clients", label: "Clients", icon: Users },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "menu", label: "Salon Menu", icon: BookOpen },
  { id: "barbers", label: "Barbers", icon: UsersRound }, // <-- 3. ADD THE NEW NAV ITEM
  { id: "reports", label: "Reports", icon: BarChart2 },
];

export default function ReceptionistLayout() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  // Get the current page title based on the active tab
  const activePage = navItems.find((item) => item.id === activeTab);

  return (
    // Main flex container for the entire layout
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Logo/Brand Section */}
        <div className="px-6 border-b border-slate-800 flex gap-2 items-center h-20">
          <img
            src={logo}
            alt="Sallon Picasso Logo"
            className="w-12 h-12 mb-2"
          />
          <h1 className="font-serif text-xl font-bold ">Salon Picasso</h1>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3  px-3 py-2 text-xl font-medium transition-colors ${
                activeTab === item.id
                  ? "bg-amber-500 text-slate-950"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header for the Main Content */}
        <header className="flex-shrink-0 bg-slate-900 border-b border-slate-800">
          <div className="px-6 h-20 flex items-center justify-between">
            {/* Page Title */}
            <h2 className="text-xl font-bold text-slate-200">
              {activePage?.label}
            </h2>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="border border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent px-4 py-2  flex items-center gap-2 text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>

        {/* Page content, which will be scrollable */}
        <main className="flex-1 overflow-y-auto p-8">
          {activeTab === "dashboard" && <ReceptionistDashboard />}
          {activeTab === "clients" && <ClientsManager />}
          {activeTab === "payments" && <PaymentsManager />}
          {activeTab === "menu" && <SalonManager />}
          {activeTab === "barbers" && <BarbersManager />}
          {activeTab === "reports" && <ReportsView />}
        </main>
      </div>
    </div>
  );
}
