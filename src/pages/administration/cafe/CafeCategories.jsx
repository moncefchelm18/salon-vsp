import { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  RefreshCcw,
  Tag,
  Bookmark,
  Scale,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../../utils/api";

import Button from "../../../components/common/Button";
import DataTable from "../../../components/common/DataTable";
import Modal from "../../../components/common/Modal";

// Couleurs uniques pour chaque onglet (Comme dans le POS)
const TAB_COLORS = {
  categories: {
    base: "text-blue-600 bg-blue-500/10 border-blue-500/20",
    active: "bg-blue-600 text-white border-blue-600 shadow-md",
  },
  families: {
    base: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    active: "bg-amber-500 text-white border-amber-500 shadow-md",
  },
  brands: {
    base: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    active: "bg-emerald-600 text-white border-emerald-600 shadow-md",
  },
  units: {
    base: "text-purple-600 bg-purple-500/10 border-purple-500/20",
    active: "bg-purple-600 text-white border-purple-600 shadow-md",
  },
};

export default function CafeCategories() {
  const [activeTab, setActiveTab] = useState("categories"); // 'categories', 'families', 'brands', 'units'
  const [data, setData] = useState({
    categories: [],
    families: [],
    brands: [],
    units: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unified Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [itemToEdit, setItemToEdit] = useState(null);
  const [nameInput, setNameInput] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [catRes, famRes, brandRes, unitRes] = await Promise.all([
        api.get("/cafe/categories"),
        api.get("/cafe/families"),
        api.get("/cafe/brands"),
        api.get("/cafe/units"),
      ]);
      setData({
        categories: catRes.data,
        families: famRes.data,
        brands: brandRes.data,
        units: unitRes.data,
      });
    } catch (error) {
      toast.error("Erreur de synchronisation");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setItemToEdit(item);
    setNameInput(item ? item.name : "");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!nameInput.trim()) return toast.error("Le nom est requis.");
    setIsSubmitting(true);

    const endpoint = `/cafe/${activeTab}`;

    try {
      if (modalMode === "add") {
        await api.post(endpoint, { name: nameInput });
        toast.success("Élément ajouté !");
      } else {
        await api.put(`${endpoint}/${itemToEdit.id}`, { name: nameInput });
        toast.success("Mise à jour réussie.");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer définitivement "${name}" ?`)) return;
    try {
      await api.delete(`/cafe/${activeTab}/${id}`);
      toast.success("Élément supprimé.");
      fetchData();
    } catch (error) {
      toast.error(
        "Erreur : L'élément est probablement lié à un produit existant.",
      );
    }
  };

  const currentList = data[activeTab] || [];

  return (
    <div className="space-y-6">
      {/* --- ONGLETS (TABS) COLORÉS ET TACTILES --- */}
      <div className="flex overflow-x-auto border-b border-subtle bg-surface p-3 gap-2 shadow-sm hide-scrollbar -mt-8 -mx-8 px-8 mb-6">
        {[
          { id: "categories", label: "Catégories", icon: Layers },
          { id: "families", label: "Familles", icon: Bookmark },
          { id: "brands", label: "Marques", icon: Tag },
          { id: "units", label: "Unités", icon: Scale },
        ].map((tab) => {
          const colorTheme = TAB_COLORS[tab.id];
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 whitespace-nowrap font-bold uppercase tracking-widest text-xs transition-all duration-200 border ${
                isActive ? colorTheme.active : colorTheme.base
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-6 bg-surface border border-subtle shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-t-main">
            Configuration Logique
          </h2>
          <p className="text-t-muted text-sm mt-1">
            Gérez les groupes, marques et unités utilisés dans le catalogue
            produit.
          </p>
        </div>
        <Button
          variant="success"
          onClick={() => handleOpenModal("add")}
          className="py-3 px-6 text-sm"
        >
          <Plus size={18} /> Ajouter{" "}
          {activeTab === "categories"
            ? "une Catégorie"
            : activeTab === "families"
              ? "une Famille"
              : activeTab === "units"
                ? "une Unité"
                : "une Marque"}
        </Button>
      </div>

      {/* --- LIST --- */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-brand space-y-4">
          <RefreshCcw className="w-10 h-10 animate-spin" />
          <span className="font-bold text-lg">Chargement des données...</span>
        </div>
      ) : (
        <DataTable
          headers={[
            { label: "Nom de l'élément" },
            { label: "Impact", align: "right" },
            { label: "Actions", align: "right" },
          ]}
        >
          {currentList.length === 0 ? (
            <tr>
              <td
                colSpan="3"
                className="py-12 text-center text-t-muted border border-subtle border-dashed bg-surface font-bold text-lg"
              >
                Aucune donnée enregistrée dans cet onglet.
              </td>
            </tr>
          ) : (
            currentList.map((item) => (
              <tr
                key={item.id}
                className="border-b border-subtle hover:bg-brand/5 transition-colors"
              >
                <td className="px-6 py-4 font-bold text-t-main text-sm">
                  {item.name}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="bg-main border border-subtle px-3 py-1 font-mono font-bold text-t-muted text-sm">
                    {item._count?.products || 0} Produits liés
                  </span>
                </td>

                {/* BOUTONS SOLIDES (Éditer / Retirer) */}
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    className="py-2 text-sm bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white transition-colors"
                    onClick={() => handleOpenModal("edit", item)}
                  >
                    <Edit size={16} /> Éditer
                  </Button>
                  <Button
                    variant="danger"
                    className="py-2 px-3 bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white transition-colors"
                    onClick={() => handleDelete(item.id, item.name)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))
          )}
        </DataTable>
      )}

      {/* --- MODAL --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-8">
          <h3 className="text-2xl font-bold text-t-main mb-6 border-b border-subtle pb-4">
            {modalMode === "add" ? "Nouvel Élément" : "Modifier l'Élément"}
          </h3>
          <div className="space-y-6">
            <div className="w-full">
              <label className="block text-sm font-bold text-t-muted mb-2">
                Nom de l'entrée *
              </label>
              <input
                className="w-full bg-surface border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand font-bold text-lg"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={`Ex: ${activeTab === "brands" ? "Coca Cola" : "Petit Déjeuner"}`}
                autoFocus
              />
            </div>

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
                disabled={isSubmitting}
                className="py-4 font-bold"
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
