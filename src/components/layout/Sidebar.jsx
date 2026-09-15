import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Scissors, Coffee, ChevronDown, ChevronRight } from "lucide-react";

export default function Sidebar({ logo, navItems, appMode }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Mémorise les sous-menus ouverts
  const [openGroups, setOpenGroups] = useState({});

  // Ouvre automatiquement le sous-menu correspondant si la page actuelle est dedans
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some(
          (child) => child.path === location.pathname,
        );
        if (isChildActive) {
          setOpenGroups((prev) => ({ ...prev, [item.id]: true }));
        }
      }
    });
  }, [location.pathname, navItems]);

  const toggleGroup = (groupId) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  return (
    <aside className="w-64 h-full flex-shrink-0 bg-surface border-r border-subtle flex flex-col transition-colors duration-500 overflow-hidden select-none">
      {/* 1. EN-TÊTE FIXE */}
      <div className="px-6 border-b border-subtle flex gap-3 items-center h-20 shrink-0">
        <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
        <div>
          <h1 className="font-serif text-lg font-bold uppercase tracking-widest text-t-main leading-tight">
            Salon VSP
          </h1>
          <p className="text-[9px] font-bold uppercase text-brand tracking-widest">
            {appMode === "coiffure" ? "Espace Coiffure" : "Espace Café"}
          </p>
        </div>
      </div>

      {/* 2. ZONE DE NAVIGATION ORGANISÉE & DÉPLIANTE */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto h-0 min-h-0 scrollbar-thin">
        {navItems.map((item) => {
          // CAS A : SOUS-MENU DÉPLIANT (ACCORDÉON)
          if (item.children) {
            const isOpen = Boolean(openGroups[item.id]);
            const isGroupActive = item.children.some(
              (c) => c.path === location.pathname,
            );

            return (
              <div key={item.id} className="space-y-1 pt-1">
                {/* Bouton En-tête du Groupe */}
                <button
                  type="button"
                  onClick={() => toggleGroup(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border ${
                    isGroupActive
                      ? "text-brand bg-main/70 border-brand/20 shadow-sm"
                      : "text-t-muted border-transparent hover:bg-main hover:text-t-main"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon
                      className={`w-4 h-4 shrink-0 ${isGroupActive ? "text-brand" : "text-t-muted"}`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>

                {/* Liens Enfants (Dépliés) */}
                {isOpen && (
                  <div className="pl-3 space-y-1 animate-in slide-in-from-top-2 duration-150 border-l-2 border-brand/20 ml-3 my-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.id}
                        to={child.path}
                        className={({ isActive }) =>
                          `w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition-all border ${
                            isActive
                              ? "bg-brand text-white border-brand shadow-md shadow-brand/20"
                              : "text-t-muted border-transparent hover:bg-main hover:text-t-main"
                          }`
                        }
                      >
                        <child.icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{child.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // CAS B : LIEN DIRECT SIMPLE (QUOTIDIEN)
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border ${
                  isActive
                    ? "bg-brand text-white border-brand shadow-md shadow-brand/20"
                    : "text-t-muted border-transparent hover:bg-main hover:text-t-main"
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* 3. SWITCHER DE DÉPARTEMENT FIXE (SALON / CAFÉ) */}
      <div className="p-4 border-t border-subtle bg-main shrink-0">
        <div className="relative w-full h-11 bg-surface border border-subtle flex items-center p-1 shadow-inner">
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] transition-transform duration-300 ease-out z-0 bg-brand shadow-md shadow-brand/20 ${
              appMode === "coiffure"
                ? "translate-x-0"
                : "translate-x-[calc(100%+4px)]"
            }`}
          />

          <button
            onClick={() => navigate("/administration/coiffure/dashboard")}
            className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 h-full text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 cursor-pointer ${
              appMode === "coiffure"
                ? "text-white"
                : "text-t-muted hover:text-t-main"
            }`}
          >
            <Scissors
              size={13}
              className={appMode === "coiffure" ? "" : "opacity-40"}
            />
            Salon
          </button>

          <button
            onClick={() => navigate("/administration/cafe/dashboard")}
            className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 h-full text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 cursor-pointer ${
              appMode === "cafe"
                ? "text-white"
                : "text-t-muted hover:text-t-main"
            }`}
          >
            <Coffee
              size={13}
              className={appMode === "cafe" ? "" : "opacity-40"}
            />
            Café
          </button>
        </div>
      </div>
    </aside>
  );
}
