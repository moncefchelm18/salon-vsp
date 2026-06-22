import { useState, useEffect } from "react";
import { LogOut, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import logo from "../../assets/images/logo.png";

export default function BarberTabletView() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Login State
  const [barbers, setBarbers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [selectedBarberToLogin, setSelectedBarberToLogin] = useState(null);
  const [pinInput, setPinInput] = useState("");

  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const res = await api.get("/barbers");
        setBarbers(res.data);
      } catch (err) {
        toast.error("Échec de connexion réseau");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBarbers();
  }, []);

  const handleMasterLogout = () => {
    logout();
    navigate("/login");
  };

  const openPinModal = (barber) => {
    setSelectedBarberToLogin(barber);
    setPinInput("");
    setPinModalOpen(true);
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (!pinInput || pinInput.length !== 4)
      return toast.error("PIN doit contenir 4 chiffres");

    try {
      await api.post("/auth/barber/pin", {
        barberId: selectedBarberToLogin.id,
        pin: pinInput,
      });

      setPinModalOpen(false);
      toast.success(`Session activée pour ${selectedBarberToLogin.name}`);

      // --- NOUVEAU REDIRECT DYNAMIQUE : Redirige physiquement vers son URL unique ! ---
      navigate(`/coiffeur/salle/${selectedBarberToLogin.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Code PIN Incorrect");
      setPinInput("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-8 items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-slate-800/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-4xl relative z-10">
        <div className="flex justify-between items-end mb-10 border-b border-slate-800 pb-4">
          <div>
            <img src={logo} alt="Sallon Picasso" className="h-16 mb-4" />
            <h1 className="text-3xl font-serif font-bold text-slate-100 uppercase tracking-widest">
              Sélection Coiffeur
            </h1>
            <p className="text-slate-500 uppercase tracking-widest text-xs font-bold mt-1">
              Sallon Picasso Station Tactile
            </p>
          </div>
          <button
            onClick={handleMasterLogout}
            className="text-slate-500 hover:text-red-500 text-xs uppercase tracking-widest font-bold flex items-center gap-2 transition-colors pb-2 cursor-pointer"
          >
            <LogOut size={14} /> Déconnexion Tablette (Master)
          </button>
        </div>

        {isLoading ? (
          <p className="text-amber-500 animate-pulse text-center uppercase tracking-widest">
            Synchronisation de la station...
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {barbers.map((b) => (
              <div
                key={b.id}
                onClick={() => openPinModal(b)}
                className="bg-slate-900 border border-slate-800 hover:border-amber-500 p-6 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 group shadow-xl"
              >
                <img
                  src={
                    b.image ||
                    `https://ui-avatars.com/api/?name=${b.name}&background=D4AF37&color=1E1E1E&rounded=false&size=150&bold=true`
                  }
                  alt={b.name}
                  className="w-24 h-24 mb-4 object-cover border-4 border-slate-800 group-hover:border-amber-500/50 transition-colors"
                />
                <h3 className="text-lg font-bold text-slate-100 uppercase tracking-wide group-hover:text-amber-400">
                  {b.name}
                </h3>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PIN Verification Modal */}
      <Modal isOpen={pinModalOpen} onClose={() => setPinModalOpen(false)}>
        {selectedBarberToLogin && (
          <div className="p-8">
            <h3 className="text-2xl font-serif font-bold text-amber-500 mb-6 uppercase tracking-wider text-center border-b border-slate-800 pb-4">
              Code PIN : {selectedBarberToLogin.name}
            </h3>
            <form
              onSubmit={handlePinSubmit}
              className="space-y-6 flex flex-col items-center"
            >
              <input
                type="password"
                pattern="\d*"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full max-w-[200px] text-center text-4xl tracking-[0.5em] font-mono bg-slate-950 border border-slate-700 text-amber-400 py-4 focus:border-amber-500 focus:outline-none transition-all shadow-[0_0_20px_rgba(212,175,55,0.1)] rounded-none"
                placeholder="••••"
                autoFocus
                required
              />
              <div className="flex w-full max-w-[200px] gap-2 pt-4">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setPinModalOpen(false)}
                >
                  Retour
                </Button>
                <Button variant="primary" fullWidth type="submit">
                  Vérifier
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
