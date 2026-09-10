import { useState, useEffect } from "react";
import {
  UserPlus,
  Edit,
  Trash2,
  ChevronDown,
  MonitorSmartphone,
  RefreshCcw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

// Common UI Imports
import Input from "../common/Input";
import ImageUpload from "../common/ImageUpload";
import Button from "../common/Button";
import Modal from "../common/Modal";

const emptyForm = {
  name: "",
  pin: "",
  image: "",
  poste: "",
};

export default function BarbersManager() {
  const [barbers, setBarbers] = useState([]);
  const [availableStations, setAvailableStations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentBarber, setCurrentBarber] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  // --- 1. DATA FETCHING ---
  const loadWorkspaceData = async () => {
    setIsLoading(true);
    try {
      const [barberRes, posteRes] = await Promise.all([
        api.get("/barbers"),
        api.get("/postes"),
      ]);
      setBarbers(barberRes.data);
      setAvailableStations(posteRes.data);
    } catch (error) {
      console.error("Load error:", error);
      toast.error("Échec de synchronisation des données.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  // --- 2. MODAL CONTROLS ---
  const handleOpenModal = (mode, barber = null) => {
    setModalMode(mode);
    if (mode === "edit" && barber) {
      setCurrentBarber(barber);
      setFormData({
        name: barber.name,
        pin: barber.pin,
        image: barber.image || "",
        poste: barber.poste || "",
      });
    } else {
      setCurrentBarber(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setCurrentBarber(null);
    setFormData(emptyForm);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getSelectableStations = () => {
    const usedStationNumbers = barbers.map((b) => b.poste).filter(Boolean);
    return availableStations.filter((station) => {
      const isUnused = !usedStationNumbers.includes(station.number);
      const isOwnedByCurrentBarber =
        modalMode === "edit" && currentBarber?.poste === station.number;
      return isUnused || isOwnedByCurrentBarber;
    });
  };

  const selectableStations = getSelectableStations();

  // --- 3. DATABASE LOGIC ---
  const handleSaveBarber = async () => {
    if (!formData.name || !formData.pin || !formData.poste) {
      toast.error(
        "Veuillez remplir tous les champs obligatoires (Nom, PIN, Poste).",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === "add") {
        await api.post("/barbers", formData);
        toast.success(`Le profil de ${formData.name} a été créé.`);
      } else if (modalMode === "edit" && currentBarber) {
        await api.put(`/barbers/${currentBarber.id}`, formData);
        toast.success("Mise à jour réussie.");
      }

      handleCloseModal();
      loadWorkspaceData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de l'enregistrement.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBarber = async (barber) => {
    if (
      window.confirm(`Voulez-vous vraiment retirer ${barber.name} du système ?`)
    ) {
      try {
        await api.delete(`/barbers/${barber.id}`);
        toast.success("Barbier supprimé.");
        loadWorkspaceData();
      } catch (error) {
        toast.error("Erreur serveur lors de la suppression.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* --- HEADER ACTIONS --- */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 p-6 bg-surface border border-subtle shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-t-main">Équipe de Coiffure</h2>
          <p className="text-t-muted text-sm mt-1">
            Gérez vos collaborateurs, leurs postes et leurs codes PIN d'accès.
          </p>
        </div>
        <Button
          variant="success"
          onClick={() => handleOpenModal("add")}
          className="py-3 px-6 text-sm"
        >
          <UserPlus size={18} /> Nouveau Collaborateur
        </Button>
      </div>

      {/* --- BARBERS GRID --- */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-brand space-y-4">
          <RefreshCcw className="w-10 h-10 animate-spin" />
          <span className="font-bold text-lg">Chargement de l'équipe...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {barbers.map((barber) => (
            <div
              key={barber.id}
              className="bg-surface border border-subtle shadow-md hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              {/* Top part with Avatar and Station Badge */}
              <div className="flex justify-center bg-main border-b border-subtle relative p-6">
                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 shadow-sm">
                  POSTE {barber.poste || "--"}
                </div>
                {barber.image ? (
                  <img
                    src={barber.image}
                    alt={barber.name}
                    className="w-32 h-32 object-cover border-4 border-surface shadow-sm opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <div className="w-32 h-32 bg-slate-800 border-4 border-surface shadow-sm opacity-90 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-5xl font-black text-blue-500 uppercase">
                      {barber.name ? barber.name.charAt(0) : "?"}
                    </span>
                  </div>
                )}
              </div>

              {/* Info Part */}
              <div className="p-5 text-center space-y-4">
                <h3 className="text-xl font-bold text-t-main leading-tight line-clamp-1">
                  {barber.name}
                </h3>
                <div className="inline-flex bg-main border border-subtle px-4 py-2 items-center gap-3 w-full justify-center">
                  <MonitorSmartphone size={16} className="text-t-muted" />
                  <span className="text-sm font-bold text-t-muted">PIN:</span>
                  <span className="text-lg font-mono font-bold text-brand tracking-widest">
                    {barber.pin}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex border-t border-subtle bg-surface p-2 gap-2">
                <Button
                  variant="secondary"
                  fullWidth
                  className="py-2 text-sm bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white"
                  onClick={() => handleOpenModal("edit", barber)}
                >
                  <Edit size={16} /> Modifier
                </Button>
                <Button
                  variant="danger"
                  className="py-2 px-3 bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white"
                  onClick={() => handleDeleteBarber(barber)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- ADD/EDIT MODAL --- */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <div className="p-8">
          <h3 className="text-2xl font-bold text-t-main mb-6 border-b border-subtle pb-4">
            {modalMode === "add"
              ? "Nouvelle Fiche Collaborateur"
              : "Modifier Fiche Collaborateur"}
          </h3>

          <div className="space-y-6">
            <ImageUpload
              label="Portrait Collaborateur"
              value={formData.image || ""}
              onChange={handleFormChange}
            />

            <div className="space-y-4">
              <Input
                label="Nom Complet *"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Ex: Marco VSP"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="PIN Tablette (4 chiffres) *"
                  name="pin"
                  type="text"
                  maxLength={4}
                  value={formData.pin}
                  onChange={handleFormChange}
                  placeholder="Ex: 1234"
                  required
                />

                <div className="w-full">
                  <label className="block text-xs font-bold uppercase tracking-wider text-t-muted mb-2">
                    Poste Assigné *
                  </label>
                  <div className="relative">
                    <select
                      name="poste"
                      value={formData.poste}
                      onChange={handleFormChange}
                      required
                      className="w-full bg-main border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand transition-all rounded-none appearance-none font-bold"
                    >
                      <option value="">Sélectionner...</option>
                      {selectableStations.map((st) => (
                        <option key={st.id} value={st.number}>
                          Poste {st.number}{" "}
                          {st.description ? `- ${st.description}` : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-t-muted pointer-events-none" />
                  </div>

                  {availableStations.length === 0 ? (
                    <p className="text-xs text-red-500 mt-2 font-bold italic">
                      ⚠️ Aucun poste configuré dans l'onglet Stations.
                    </p>
                  ) : selectableStations.length === 0 ? (
                    <p className="text-xs text-brand mt-2 font-bold italic">
                      ⚠️ Tous les postes sont actuellement occupés.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-subtle grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                className="py-4 font-bold"
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                variant="success"
                onClick={handleSaveBarber}
                className="py-4 font-bold"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Sauvegarde..."
                  : modalMode === "add"
                    ? "Créer le compte"
                    : "Enregistrer"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
