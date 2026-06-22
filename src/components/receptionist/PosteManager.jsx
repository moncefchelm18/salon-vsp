import { useState, useEffect } from "react";
import { Plus, Trash2, RefreshCcw, LayoutGrid } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

import Button from "../common/Button";
import DataTable from "../common/DataTable";
import Modal from "../common/Modal";
import Input from "../common/Input";

export default function PosteManager() {
  const [postes, setPostes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ number: "", description: "" });

  const fetchPostes = async () => {
    try {
      const res = await api.get("/postes");
      setPostes(res.data);
    } catch (err) {
      toast.error("Failed to load stations.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPostes();
  }, []);

  const handleSave = async () => {
    if (!formData.number) return toast.error("Number is required.");
    try {
      await api.post("/postes", formData);
      toast.success("Station created!");
      setIsModalOpen(false);
      setFormData({ number: "", description: "" });
      fetchPostes();
    } catch (err) {
      toast.error(err.response?.data?.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this station?")) return;
    try {
      await api.delete(`/postes/${id}`);
      toast.success("Station removed.");
      fetchPostes();
    } catch (err) {
      toast.error("Station in use.");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER : Remplacement de bg-slate-900 par bg-surface avec une icône */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 p-6 bg-surface border border-subtle shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-t-main flex items-center gap-2">
            <LayoutGrid className="text-brand" size={24} /> Postes & Stations
          </h2>
          <p className="text-t-muted text-sm mt-1">
            Gérez l'emplacement des fauteuils physiques dans le salon.
          </p>
        </div>
        <Button
          variant="success"
          onClick={() => setIsModalOpen(true)}
          className="py-3 px-6 text-sm"
        >
          <Plus size={18} /> Nouveau Poste
        </Button>
      </div>

      <DataTable
        headers={[
          { label: "Numéro du Poste" },
          { label: "Description / Localisation" },
          { label: "Actions", align: "right" },
        ]}
      >
        {isLoading ? (
          <tr>
            <td
              colSpan="3"
              className="py-12 text-center text-brand flex flex-col items-center gap-3"
            >
              <RefreshCcw className="animate-spin w-8 h-8" />
              <span className="font-bold text-lg">Synchronisation...</span>
            </td>
          </tr>
        ) : postes.length === 0 ? (
          <tr>
            <td
              colSpan="3"
              className="py-12 text-center text-t-muted font-bold text-lg border border-subtle border-dashed bg-surface"
            >
              Aucun poste configuré.
            </td>
          </tr>
        ) : (
          postes.map((p) => (
            <tr
              key={p.id}
              className="border-b border-subtle hover:bg-brand/5 transition-all"
            >
              <td className="px-6 py-4 font-mono font-bold text-brand text-lg">
                Poste #{p.number}
              </td>
              <td className="px-6 py-4 text-t-main text-sm font-medium">
                {p.description || "Aucune description"}
              </td>
              <td className="px-6 py-4 text-right">
                <Button
                  variant="danger"
                  onClick={() => handleDelete(p.id)}
                  className="py-2 px-3 bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white"
                  title="Supprimer ce poste"
                >
                  <Trash2 size={16} />
                </Button>
              </td>
            </tr>
          ))
        )}
      </DataTable>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-8">
          <h3 className="text-2xl font-bold text-t-main mb-6 border-b border-subtle pb-4">
            Configurer un nouveau Poste
          </h3>
          <div className="space-y-6">
            <Input
              label="Numéro ou Référence du Poste *"
              placeholder="Ex: 01"
              value={formData.number}
              onChange={(e) =>
                setFormData({ ...formData, number: e.target.value })
              }
            />
            <Input
              label="Description (Optionnelle)"
              placeholder="Ex: Près de la fenêtre"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-subtle">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="py-4 font-bold"
              >
                Annuler
              </Button>
              <Button
                variant="success"
                onClick={handleSave}
                className="py-4 font-bold"
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
