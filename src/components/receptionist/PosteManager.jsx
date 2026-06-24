import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, RefreshCcw, LayoutGrid, User } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

import Button from "../common/Button";
import DataTable from "../common/DataTable";
import Modal from "../common/Modal";
import Input from "../common/Input";

export default function PosteManager() {
  const [postes, setPostes] = useState([]);
  const [barbers, setBarbers] = useState([]); // Pour savoir qui occupe le poste
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" ou "edit"
  const [currentPosteId, setCurrentPosteId] = useState(null);

  const [formData, setFormData] = useState({
    number: "",
    description: "",
    isVip: false,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // On charge les postes ET les coiffeurs en même temps
      const [postesRes, barbersRes] = await Promise.all([
        api.get("/postes"),
        api.get("/barbers"),
      ]);
      setPostes(postesRes.data);
      setBarbers(barbersRes.data);
    } catch (err) {
      toast.error("Impossible de charger les stations.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (mode, poste = null) => {
    setModalMode(mode);
    if (mode === "edit" && poste) {
      setCurrentPosteId(poste.id);
      setFormData({
        number: poste.number,
        description: poste.description || "",
        isVip: poste.isVip || false,
      });
    } else {
      setCurrentPosteId(null);
      setFormData({ number: "", description: "", isVip: false });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.number) return toast.error("Le numéro de poste est requis.");

    setIsSubmitting(true);
    try {
      if (modalMode === "add") {
        await api.post("/postes", formData);
        toast.success("Poste de travail créé !");
      } else {
        await api.put(`/postes/${currentPosteId}`, formData);
        toast.success("Poste mis à jour !");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur de sauvegarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, number) => {
    if (
      !window.confirm(`Voulez-vous vraiment supprimer le Poste N°${number} ?`)
    )
      return;
    try {
      await api.delete(`/postes/${id}`);
      toast.success("Station supprimée.");
      fetchData();
    } catch (err) {
      toast.error(
        "Impossible de supprimer. Ce poste est peut-être lié à des factures.",
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 p-6 bg-surface border border-subtle shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-t-main flex items-center gap-2">
            <LayoutGrid className="text-brand" size={24} /> Postes & Stations
          </h2>
          <p className="text-t-muted text-sm mt-1">
            Gérez l'emplacement des fauteuils physiques et leurs statuts VIP.
          </p>
        </div>
        <Button
          variant="success"
          onClick={() => handleOpenModal("add")}
          className="py-3 px-6 text-sm"
        >
          <Plus size={18} className="mr-2" /> Nouveau Poste
        </Button>
      </div>

      {/* TABLEAU */}
      <DataTable
        headers={[
          { label: "Numéro du Poste" },
          { label: "Type de Poste" },
          { label: "Description / Localisation" },
          { label: "Occupé par" }, // <-- NOUVELLE COLONNE
          { label: "Actions", align: "right" },
        ]}
      >
        {isLoading ? (
          <tr>
            <td
              colSpan="5"
              className="py-12 text-center text-brand flex flex-col items-center gap-3"
            >
              <RefreshCcw className="animate-spin w-8 h-8" />
              <span className="font-bold text-lg">Synchronisation...</span>
            </td>
          </tr>
        ) : postes.length === 0 ? (
          <tr>
            <td
              colSpan="5"
              className="py-12 text-center text-t-muted font-bold text-lg border border-subtle border-dashed bg-surface"
            >
              Aucun poste configuré.
            </td>
          </tr>
        ) : (
          postes.map((p) => {
            // On cherche le coiffeur dont le champ "poste" correspond au numéro de ce poste
            const occupant = barbers.find((b) => b.poste === p.number);

            return (
              <tr
                key={p.id}
                className="border-b border-subtle hover:bg-brand/5 transition-all"
              >
                {/* 1. N° POSTE */}
                <td className="px-6 py-4 font-mono font-bold text-brand text-lg">
                  Poste #{p.number}
                </td>

                {/* 2. BADGE VIP */}
                <td className="px-6 py-4">
                  {p.isVip ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold text-xs uppercase shadow-sm">
                      ⭐ VIP
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 bg-main text-t-muted border border-subtle font-bold text-xs uppercase shadow-sm">
                      Standard
                    </span>
                  )}
                </td>

                {/* 3. DESCRIPTION */}
                <td className="px-6 py-4 text-t-main text-xs uppercase font-bold tracking-wider">
                  {p.description || "—"}
                </td>

                {/* 4. OCCUPANT (BARBIER) */}
                <td className="px-6 py-4">
                  {occupant ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-500 font-bold uppercase text-xs">
                      <User size={12} /> {occupant.name}
                    </span>
                  ) : (
                    <span className="text-t-muted italic text-[10px] uppercase font-bold tracking-widest">
                      Non Assigné
                    </span>
                  )}
                </td>

                {/* 5. ACTIONS (ÉDITION ET SUPPRESSION SOLIDES) */}
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleOpenModal("edit", p)}
                    className="py-2 px-3 text-xs bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white transition-colors"
                  >
                    <Edit size={14} className="mr-1" /> Éditer
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(p.id, p.number)}
                    className="py-2 px-3 bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white transition-colors"
                    title="Supprimer ce poste"
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            );
          })
        )}
      </DataTable>

      {/* --- MODALE D'AJOUT / ÉDITION --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
      >
        <div className="p-8 bg-surface">
          <h3 className="text-2xl font-bold text-t-main mb-6 border-b border-subtle pb-4">
            {modalMode === "add"
              ? "Configurer un nouveau Poste"
              : `Modifier le Poste #${formData.number}`}
          </h3>

          <div className="space-y-6">
            <Input
              label="Numéro ou Référence du Poste *"
              placeholder="Ex: 01 ou VIP-A"
              value={formData.number}
              onChange={(e) =>
                setFormData({ ...formData, number: e.target.value })
              }
            />

            <Input
              label="Description (Optionnelle)"
              placeholder="Ex: Siège près de la vitrine"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />

            {/* BOÎTE TACTILE VIP */}
            <label className="flex items-center gap-3 cursor-pointer group mt-4 bg-main border border-subtle p-4 hover:border-amber-500 transition-colors shadow-inner">
              <input
                type="checkbox"
                checked={formData.isVip}
                onChange={(e) =>
                  setFormData({ ...formData, isVip: e.target.checked })
                }
                className="w-5 h-5 accent-amber-500"
              />
              <div>
                <p className="text-sm font-bold text-t-main group-hover:text-amber-500 transition-colors uppercase">
                  Classer comme Poste VIP
                </p>
                <p className="text-[10px] text-t-muted uppercase tracking-widest mt-0.5 font-bold">
                  Permet d'y assigner directement des réservations de clients.
                </p>
              </div>
            </label>

            {/* BOUTONS D'ACTION */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-subtle">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="py-4 font-bold"
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                variant="success"
                onClick={handleSave}
                className="py-4 font-bold"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
