import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LogOut, Lock, RefreshCcw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import BarberQueue from "../barber/BarberQueue";
import logo from "../../assets/images/logo-transparent.png";

export default function BarberLayout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [barber, setBarber] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBarberInfo = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/barbers/${id}`);
        setBarber(res.data);
      } catch (err) {
        navigate("/coiffeur");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBarberInfo();
  }, [id, navigate]);

  const handleExitSession = () => {
    if (user?.role === "barber_global") {
      navigate("/coiffeur");
    } else {
      logout();
      navigate("/login");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-500 font-bold uppercase tracking-widest text-xs animate-pulse">
        <RefreshCcw className="animate-spin w-6 h-6 mr-2" /> Chargement du
        poste...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* ── HEADER ULTRA-COMPACT ET RESPONSIVE ── */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 h-16 sm:h-20 shadow-lg shrink-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-full flex items-center justify-between gap-2">
          {/* Logo + Nom & Poste (Pas de superposition) */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <img
              src={logo}
              alt="Logo"
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0"
            />
            <div className="min-w-0">
              <h1 className="font-serif text-sm sm:text-lg font-bold text-amber-500 uppercase tracking-wide truncate">
                {barber?.name || "Coiffeur"}
              </h1>
              <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">
                Station {barber?.poste || "--"}
              </p>
            </div>
          </div>

          {/* Bouton Déconnexion / Verrouillage (Icône seule avec zone tactile confortable) */}
          <button
            onClick={handleExitSession}
            title={
              user?.role === "barber_global"
                ? "Verrouiller le poste"
                : "Se déconnecter"
            }
            className="border-2 border-amber-500/30 text-amber-500 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 p-2.5 sm:p-3 transition-all rounded-none flex items-center justify-center shrink-0 cursor-pointer shadow-md"
          >
            {user?.role === "barber_global" ? (
              <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>
      </header>

      {/* ── ZONE DE CONTENU PRINCIPALE (Paddings adaptés aux mobiles) ── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 w-full flex-1 min-w-0">
        <BarberQueue barberId={Number(id)} barberName={barber?.name} />
      </main>
    </div>
  );
}
