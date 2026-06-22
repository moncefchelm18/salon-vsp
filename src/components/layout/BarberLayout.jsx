import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LogOut, Lock, RefreshCcw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import BarberQueue from "../barber/BarberQueue";
import logo from "../../assets/images/logo.png";

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
        navigate("/coiffeur"); // Sécurité : retour à l'écran d'accueil si ID inconnu
      } finally {
        setIsLoading(false);
      }
    };
    fetchBarberInfo();
  }, [id, navigate]);

  const handleExitSession = () => {
    if (user?.role === "barber_global") {
      // SCÉNARIO IPAD TABLETTE : On verrouille simplement la session du coiffeur pour retourner au trombinoscope
      navigate("/coiffeur");
    } else {
      // SCÉNARIO SMARTPHONE INDIVIDUEL : On le déconnecte complètement
      logout();
      navigate("/login");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-500 font-bold uppercase tracking-widest text-xs animate-pulse">
        <RefreshCcw className="animate-spin w-8 h-8 mr-2" /> Initialisation du
        Poste...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header unifié et solide */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 h-20 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-serif text-xl font-bold text-amber-500 uppercase tracking-widest">
                Poste Coiffure
              </h1>
              <p className="text-slate-400 text-xs font-bold uppercase mt-0.5">
                Coiffeur connecté :{" "}
                <span className="text-slate-100">{barber?.name}</span> (Station{" "}
                {barber?.poste || "--"})
              </p>
            </div>
          </div>

          <button
            onClick={handleExitSession}
            className="border-2 border-amber-500/30 text-amber-500 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 font-bold px-4 py-3 text-xs uppercase tracking-widest transition-all rounded-none flex items-center gap-2"
          >
            {user?.role === "barber_global" ? (
              <Lock className="w-4 h-4" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            {user?.role === "barber_global" ? "Verrouiller" : "Déconnexion"}
          </button>
        </div>
      </header>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1">
        <BarberQueue barberId={Number(id)} barberName={barber?.name} />
      </main>
    </div>
  );
}
