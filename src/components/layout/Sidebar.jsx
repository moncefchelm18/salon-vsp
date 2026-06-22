import { NavLink, useNavigate } from "react-router-dom";
import { Scissors, Coffee } from "lucide-react";

export default function Sidebar({ logo, navItems, appMode }) {
  const navigate = useNavigate();

  return (
    <aside className="w-64 h-full flex-shrink-0 bg-surface border-r border-subtle flex flex-col transition-colors duration-500 overflow-hidden">
      {/* 1. EN-TÊTE FIXE (Ne défile pas) */}
      <div className="px-6 border-b border-subtle flex gap-2 items-center h-20 shrink-0">
        <img src={logo} alt="Logo" className="w-12 h-12" />
        <h1 className="font-serif text-xl font-bold uppercase tracking-tight">
          Sallon Picasso
        </h1>
      </div>

      {/* 2. ZONE DE NAVIGATION DÉFILANTE (S'adapte dynamiquement à la hauteur de l'écran) */}
      {/* h-0 et min-h-0 forcent Flexbox à contenir la hauteur de la liste et à activer le défilement vertical */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto h-0 min-h-0 scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border ${
                isActive
                  ? "bg-brand text-white border-brand shadow-lg shadow-brand/20"
                  : "text-t-muted border-transparent hover:bg-main hover:text-t-main"
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* 3. SWITCHER DE DÉPARTEMENT FIXE EN BAS (Ne défile pas) */}
      <div className="p-6 border-t border-subtle bg-main shrink-0">
        <p className="text-[10px] uppercase font-bold text-t-muted tracking-widest mb-3 text-center">
          Changer de Département
        </p>

        {/* Track tactile glissant */}
        <div className="relative w-full h-12 bg-surface border border-subtle flex items-center p-1 shadow-inner cursor-pointer transition-colors duration-500">
          {/* Bloc de fond glissant */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] transition-transform duration-300 ease-out z-0 bg-brand shadow-lg shadow-brand/20 ${
              appMode === "coiffure"
                ? "translate-x-0"
                : "translate-x-[calc(100%+4px)]"
            }`}
          ></div>

          {/* Option 1: SALON (Coiffure) */}
          <button
            onClick={() => navigate("/administration/coiffure/dashboard")}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 h-full text-xs font-bold uppercase tracking-widest transition-colors duration-300 cursor-pointer ${
              appMode === "coiffure"
                ? "text-white"
                : "text-t-muted hover:text-t-main"
            }`}
          >
            <Scissors
              size={14}
              className={appMode === "coiffure" ? "" : "opacity-50"}
            />
            Salon
          </button>

          {/* Option 2: CAFE */}
          <button
            onClick={() => navigate("/administration/cafe/dashboard")}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 h-full text-xs font-bold uppercase tracking-widest transition-colors duration-300 cursor-pointer ${
              appMode === "cafe"
                ? "text-white"
                : "text-t-muted hover:text-t-main"
            }`}
          >
            <Coffee
              size={14}
              className={appMode === "cafe" ? "" : "opacity-50"}
            />
            Café
          </button>
        </div>
      </div>
    </aside>
  );
}
