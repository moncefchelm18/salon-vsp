import { useState, useEffect } from "react";
import {
  UserPlus,
  Edit,
  Trash2,
  ChevronDown,
  MonitorSmartphone,
  RefreshCcw,
  Wallet,
  Coins,
  Users,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

import Input from "../common/Input";
import ImageUpload from "../common/ImageUpload";
import Button from "../common/Button";
import Modal from "../common/Modal";

const emptyForm = {
  name: "",
  pin: "",
  image: "",
  poste: "",
  commissionRate: "50",
  isOwner: false,
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

  const loadWorkspaceData = async () => {
    setIsLoading(true);
    try {
      const [barberRes, posteRes] = await Promise.all([
        api.get("/barbers"),
        api.get("/postes"),
      ]);
      // Filtrer pour exclure tout profil système
      const realBarbers = barberRes.data.filter(
        (b) => b.name !== "Boutique Salon",
      );
      setBarbers(realBarbers);
      setAvailableStations(posteRes.data);
    } catch (error) {
      toast.error("Échec de synchronisation des données.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  const handleOpenModal = (mode, barber = null) => {
    setModalMode(mode);
    if (mode === "edit" && barber) {
      setCurrentBarber(barber);
      setFormData({
        name: barber.name,
        pin: barber.pin,
        image: barber.image || "",
        poste: barber.poste || "",
        commissionRate: barber.commissionRate
          ? barber.commissionRate.toString()
          : "50",
        isOwner: barber.isOwner || false,
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

  const handleSaveBarber = async () => {
    if (!formData.name || !formData.pin || !formData.poste) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        // Si c'est le propriétaire, on force l'envoi de la commission à 0 (sécurité)
        commissionRate: formData.isOwner ? "0" : formData.commissionRate,
      };

      if (modalMode === "add") {
        await api.post("/barbers", payload);
        toast.success(`Le profil de ${formData.name} a été créé.`);
      } else if (modalMode === "edit" && currentBarber) {
        await api.put(`/barbers/${currentBarber.id}`, payload);
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

  // Calcul global pour le patron (N'inclut pas le solde du patron lui-même)
  const totalDueToBarbers = barbers.reduce(
    (sum, b) => sum + (b.currentBalance || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* ── HEADER ACTIONS & STATS ── */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 p-6 bg-surface border border-subtle shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-t-main flex items-center gap-2">
            <Users className="text-brand" size={24} /> Équipe de Coiffure
          </h2>
          <p className="text-t-muted text-sm mt-1">
            Gérez vos collaborateurs, leurs postes et surveillez leurs
            commissions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="bg-main border border-brand/20 px-4 py-2 text-right shadow-inner w-full sm:w-auto">
            <p className="text-[10px] uppercase font-bold text-t-muted tracking-widest flex items-center gap-1.5 justify-end">
              <Coins size={12} className="text-brand" /> Total dû à l'équipe
            </p>
            <p className="text-xl font-mono font-bold text-brand mt-0.5">
              DZD {totalDueToBarbers.toFixed(2)}
            </p>
          </div>

          <Button
            variant="success"
            onClick={() => handleOpenModal("add")}
            className="py-3 px-6 text-sm shrink-0 w-full sm:w-auto"
          >
            <UserPlus size={18} className="mr-2" /> Nouveau Coiffeur
          </Button>
        </div>
      </div>

      {/* ── BARBERS GRID ── */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-brand space-y-4">
          <RefreshCcw className="w-10 h-10 animate-spin" />
          <span className="font-bold text-lg">Chargement de l'équipe...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {barbers.map((barber) => (
            <div
              key={barber.id}
              className={`bg-surface border shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group ${
                barber.isOwner ? "border-amber-500/50" : "border-subtle"
              }`}
            >
              {/* Photo & Poste */}
              <div className="flex justify-center bg-main border-b border-subtle relative p-6">
                <div className="absolute top-2 left-2 flex gap-1 shadow-sm">
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">
                    POSTE {barber.poste || "--"}
                  </span>

                  {/* Badge VIP si le poste est VIP */}
                  {availableStations.find((st) => st.number === barber.poste)
                    ?.isVip && (
                    <span className="bg-amber-500 text-slate-900 text-[10px] font-black px-2 py-1 uppercase tracking-widest">
                      ⭐ VIP
                    </span>
                  )}
                </div>

                {barber.image ? (
                  <img
                    src={barber.image}
                    alt={barber.name}
                    className={`w-32 h-32 object-cover rounded-full border-4 shadow-md opacity-90 group-hover:opacity-100 transition-opacity ${
                      barber.isOwner ? "border-amber-500" : "border-surface"
                    }`}
                  />
                ) : (
                  <div
                    className={`w-32 h-32 rounded-full border-4 shadow-md opacity-90 group-hover:opacity-100 transition-opacity flex items-center justify-center ${
                      barber.isOwner
                        ? "bg-amber-500/10 border-amber-500"
                        : "bg-slate-800 border-surface"
                    }`}
                  >
                    <span
                      className={`text-5xl font-black uppercase ${barber.isOwner ? "text-amber-500" : "text-blue-500"}`}
                    >
                      {barber.name ? barber.name.charAt(0) : "?"}
                    </span>
                  </div>
                )}
              </div>

              {/* Infos : Nom, PIN et Solde */}
              <div className="p-4 space-y-4">
                <h3 className="text-lg font-bold text-t-main leading-tight text-center uppercase tracking-widest flex flex-col items-center gap-1">
                  {barber.name}
                  {barber.isOwner && (
                    <span className="bg-amber-500 text-slate-900 px-2 py-0.5 text-[9px] font-black uppercase rounded-full shadow-sm">
                      👑 Propriétaire
                    </span>
                  )}
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <div
                    className={`bg-main border border-subtle p-2 text-center ${barber.isOwner ? "col-span-2" : ""}`}
                  >
                    <p className="text-[9px] uppercase font-bold text-t-muted mb-1 flex items-center justify-center gap-1">
                      <MonitorSmartphone size={10} /> PIN
                    </p>
                    <p className="font-mono font-bold text-slate-300 tracking-widest text-sm">
                      {barber.pin}
                    </p>
                  </div>

                  {!barber.isOwner && (
                    <div className="bg-green-950/20 border border-green-500/20 p-2 text-center">
                      <p className="text-[9px] uppercase font-bold text-green-500/80 mb-1 flex items-center justify-center gap-1">
                        <Wallet size={10} /> Solde (DZD)
                      </p>
                      <p className="font-mono font-bold text-green-400 text-sm">
                        {(barber.currentBalance || 0).toFixed(2)}
                      </p>
                    </div>
                  )}

                  {!barber.isOwner && (
                    <div className="bg-blue-950/20 border border-blue-500/20 p-2 text-center col-span-2">
                      <p className="text-[9px] uppercase font-bold text-blue-500/80 mb-1">
                        Part / Commission
                      </p>
                      <p className="font-mono font-bold text-blue-400 text-sm">
                        {barber.commissionRate || 50} %
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex border-t border-subtle bg-surface p-2 gap-2">
                <Button
                  variant="secondary"
                  fullWidth
                  className="py-2.5 text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white"
                  onClick={() => handleOpenModal("edit", barber)}
                >
                  <Edit size={14} className="mr-1.5" /> Modifier
                </Button>
                <Button
                  variant="danger"
                  className="py-2.5 px-3 bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white"
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
        <div className="p-6 sm:p-8 bg-surface">
          <h3 className="text-xl sm:text-2xl font-bold text-t-main mb-6 border-b border-subtle pb-4 flex items-center gap-2">
            {modalMode === "add"
              ? "Nouvelle Fiche Coiffeur"
              : "Modifier Coiffeur"}
            {formData.isOwner && (
              <span className="bg-amber-500 text-slate-900 px-2 py-0.5 text-[10px] font-black uppercase rounded-full ml-auto">
                👑 Patron
              </span>
            )}
          </h3>

          <div className="space-y-6">
            <ImageUpload
              label="Portrait Coiffeur"
              value={formData.image || ""}
              onChange={handleFormChange}
            />

            <div className="space-y-4">
              <Input
                label="Nom du Coiffeur *"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Ex: Aissa"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Code PIN (4 chiffres) *"
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
                      className="w-full bg-main border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand transition-all rounded-none appearance-none font-bold uppercase text-xs"
                    >
                      <option value="">Sélectionner...</option>
                      {selectableStations.map((st) => (
                        <option key={st.id} value={st.number}>
                          POSTE {st.number} {st.isVip ? "⭐" : ""}{" "}
                          {st.description ? `- ${st.description}` : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-t-muted pointer-events-none" />
                  </div>
                  {availableStations.length === 0 && (
                    <p className="text-[10px] text-red-500 mt-1 font-bold italic">
                      ⚠️ Aucun poste configuré.
                    </p>
                  )}
                </div>
              </div>

              {/* ── CASE À COCHER PATRON (SANS COULEUR ORANGE DÉRANGEANTE) ── */}
              <div
                className={`p-3 shadow-inner mt-2 transition-all ${formData.isOwner ? "bg-amber-500/10 border border-amber-500/30" : "bg-main border border-subtle"}`}
              >
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isOwner)}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isOwner: e.target.checked,
                      }))
                    }
                    className="w-5 h-5 accent-amber-500"
                  />
                  <div>
                    <span
                      className={`text-xs font-bold uppercase transition-colors ${formData.isOwner ? "text-amber-500" : "text-t-main"}`}
                    >
                      Ce coiffeur est le Propriétaire du Salon
                    </span>
                    <p className="text-[9px] text-t-muted mt-0.5">
                      100% de l'argent de ses coupes sera directement injecté
                      dans le Bénéfice Net du salon sur le Bilan CEO.
                    </p>
                  </div>
                </label>
              </div>

              {/* ── LE TAUX N'APPARAÎT QUE S'IL N'EST PAS LE PATRON ── */}
              {!formData.isOwner && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <Input
                    label="Taux de Commission Coiffeur (%) *"
                    name="commissionRate"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.commissionRate}
                    onChange={handleFormChange}
                    placeholder="Ex: 50"
                    required
                  />
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-subtle grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                className="py-4 font-bold text-xs"
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                variant="success"
                onClick={handleSaveBarber}
                className="py-4 font-bold text-xs shadow-md"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Sauvegarde..."
                  : modalMode === "add"
                    ? "Créer Coiffeur"
                    : "Enregistrer"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
