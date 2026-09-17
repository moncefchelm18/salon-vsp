import { useState, useEffect } from "react";
import { Layers, Plus, Edit, Trash2, RefreshCcw } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../../utils/api";

import Button from "../../../components/common/Button";
import DataTable from "../../../components/common/DataTable";
import Modal from "../../../components/common/Modal";

export default function CafeCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [nameInput, setNameInput] = useState("");

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/cafe/categories");
      setCategories(res.data);
    } catch (error) {
      toast.error("Erreur de synchronisation des catégories.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (mode, cat = null) => {
    setModalMode(mode);
    setCategoryToEdit(cat);
    setNameInput(cat ? cat.name : "");
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!nameInput.trim())
      return toast.error("Le nom de la catégorie est requis.");

    setIsSubmitting(true);
    try {
      if (modalMode === "add") {
        await api.post("/cafe/categories", { name: nameInput.trim() });
        toast.success(`Catégorie "${nameInput}" créée !`);
      } else {
        await api.put(`/cafe/categories/${categoryToEdit.id}`, {
          name: nameInput.trim(),
        });
        toast.success("Catégorie mise à jour !");
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer définitivement la catégorie "${name}" ?`))
      return;
    try {
      await api.delete(`/cafe/categories/${id}`);
      toast.success("Catégorie supprimée.");
      fetchCategories();
    } catch (error) {
      toast.error(
        "Impossible de supprimer : elle contient encore des articles au menu.",
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── EN-TÊTE ── */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-6 bg-surface border border-subtle shadow-sm">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-widest text-t-main flex items-center gap-2">
            <Layers size={22} className="text-brand" /> Catégories du Menu
            Cafétéria
          </h2>
          <p className="text-t-muted text-xs mt-1">
            Organisez vos boissons et encas par rayons pour la caisse tactile
            (ex: Boissons Chaudes, Canettes, Snacks).
          </p>
        </div>
        <Button
          variant="success"
          onClick={() => handleOpenModal("add")}
          className="py-3 px-6 text-xs font-bold rounded-none shadow-md"
        >
          <Plus size={16} className="mr-1.5" /> Nouvelle Catégorie
        </Button>
      </div>

      {/* ── TABLEAU DES CATÉGORIES ── */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-brand space-y-4">
          <RefreshCcw className="w-10 h-10 animate-spin" />
          <span className="font-bold text-xs uppercase tracking-widest">
            Chargement des catégories...
          </span>
        </div>
      ) : (
        <DataTable
          headers={[
            { label: "Nom de la Catégorie" },
            { label: "Articles rattachés", align: "center" },
            { label: "Actions", align: "right" },
          ]}
        >
          {categories.length === 0 ? (
            <tr>
              <td
                colSpan="3"
                className="py-12 text-center text-t-muted border border-subtle border-dashed bg-surface font-bold text-xs uppercase"
              >
                Aucune catégorie enregistrée. Cliquez sur "Nouvelle Catégorie".
              </td>
            </tr>
          ) : (
            categories.map((cat) => (
              <tr
                key={cat.id}
                className="border-b border-subtle hover:bg-brand/5 transition-colors"
              >
                <td className="px-6 py-4 font-bold text-t-main text-xs uppercase">
                  {cat.name}
                </td>
                <td className="px-6 py-4 text-center font-mono font-bold text-xs text-amber-500">
                  {cat._count?.products || 0} article(s)
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    className="py-1.5 px-3 text-xs bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white rounded-none"
                    onClick={() => handleOpenModal("edit", cat)}
                  >
                    <Edit size={14} className="mr-1" /> Modifier
                  </Button>
                  <Button
                    variant="danger"
                    className="py-1.5 px-3 bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white rounded-none"
                    onClick={() => handleDelete(cat.id, cat.name)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))
          )}
        </DataTable>
      )}

      {/* ── MODALE CRÉER / MODIFIER ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
      >
        <form
          onSubmit={handleSave}
          className="p-6 sm:p-8 bg-surface rounded-none"
        >
          <h3 className="text-lg font-bold text-t-main mb-6 border-b border-subtle pb-3 uppercase tracking-wider">
            {modalMode === "add"
              ? "Nouvelle Catégorie"
              : "Modifier la Catégorie"}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-t-muted mb-2">
                Nom de la catégorie *
              </label>
              <input
                className="w-full bg-main border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand font-bold text-xs uppercase rounded-none"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Ex: Boissons Chaudes, Canettes, Snacks"
                autoFocus
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-subtle mt-6">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="py-3 font-bold text-xs uppercase rounded-none"
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                variant="success"
                type="submit"
                className="py-3 font-bold text-xs uppercase rounded-none shadow-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
