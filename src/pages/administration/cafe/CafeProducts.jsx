import { useState, useEffect } from "react";
import {
  Coffee,
  Plus,
  Edit,
  Trash2,
  RefreshCcw,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../../utils/api";

import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import Input from "../../../components/common/Input";

export default function CafeProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [itemToEdit, setItemToEdit] = useState(null);

  // FORMULAIRE ÉPURÉ : 3 CHAMPS UNIQUEMENT
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    price: "",
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get("/cafe/products"),
        api.get("/cafe/categories"),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (error) {
      toast.error("Erreur de synchronisation du menu.");
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

    setFormData(
      item
        ? {
            name: item.name,
            categoryId: item.categoryId ? item.categoryId.toString() : "",
            price: item.price ? item.price.toString() : "",
          }
        : {
            name: "",
            categoryId:
              categories.length > 0 ? categories[0].id.toString() : "",
            price: "",
          },
    );
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    if (!formData.name?.trim()) {
      return toast.error("Le nom de l'article est requis.");
    }

    if (!formData.categoryId) {
      return toast.error("Veuillez sélectionner une catégorie.");
    }

    if (!formData.price || isNaN(parseFloat(formData.price))) {
      return toast.error("Veuillez saisir un tarif de vente valide.");
    }

    setIsSubmitting(true);
    try {
      // Payload minimal et compatible avec la base de données
      const payload = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        purchasePrice: 0,
        categoryId: Number(formData.categoryId),
        nuc: 1,
        canSell: true,
        canBuy: false,
        isTracked: false, // Pas de décompte de stock inutile
      };

      if (modalMode === "add") {
        await api.post("/cafe/products", payload);
        toast.success(`${formData.name} ajouté à la carte !`);
      } else {
        await api.put(`/cafe/products/${itemToEdit.id}`, payload);
        toast.success(`${formData.name} mis à jour !`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur d'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer définitivement "${name}" du menu ?`)) return;
    try {
      await api.delete(`/cafe/products/${id}`);
      toast.success("Article supprimé.");
      fetchData();
    } catch (error) {
      toast.error("Impossible de supprimer cet article.");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── EN-TÊTE ── */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-6 bg-surface border border-subtle shadow-sm">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-widest text-t-main flex items-center gap-2">
            <Coffee size={22} className="text-brand" /> Carte des Boissons &amp;
            Snacks
          </h2>
          <p className="text-t-muted text-xs mt-1">
            Gérez vos cafés, canettes, eaux et encas. Chaque vente est
            immédiatement encaissable en caisse.
          </p>
        </div>
        <Button
          variant="success"
          onClick={() => handleOpenModal("add")}
          className="py-3 px-6 text-xs font-bold rounded-none shadow-md"
        >
          <Plus size={16} className="mr-1.5" /> Nouvel Article
        </Button>
      </div>

      {/* ── GRILLE DES ARTICLES SANS PHOTO (STYLE TACTILE ÉPURÉ) ── */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center text-brand space-y-4">
          <RefreshCcw className="w-10 h-10 animate-spin" />
          <span className="font-bold text-xs uppercase tracking-widest">
            Chargement de la carte...
          </span>
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-subtle bg-surface text-t-muted font-bold text-sm uppercase">
          Aucun article au menu. Cliquez sur "Nouvel Article".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-surface border border-subtle flex flex-col justify-between p-4 shadow-sm hover:border-brand/50 transition-all rounded-none relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />

              <div>
                <span className="inline-block px-2 py-0.5 mb-2 bg-amber-500/10 text-amber-500 border border-amber-500/30 text-[9px] font-bold uppercase rounded-none">
                  {p.category?.name || "Cafétéria"}
                </span>

                <h3 className="font-bold text-t-main text-sm uppercase leading-tight line-clamp-2">
                  {p.name}
                </h3>
              </div>

              <div className="mt-4 pt-3 border-t border-subtle space-y-3">
                <div className="flex justify-between items-center bg-main p-2 border border-subtle">
                  <span className="text-[10px] font-bold text-t-muted uppercase">
                    Tarif Caisse
                  </span>
                  <span className="text-lg font-mono font-bold text-amber-400">
                    {Number(p.price).toFixed(2)} DA
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    fullWidth
                    className="py-2 text-xs bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white rounded-none"
                    onClick={() => handleOpenModal("edit", p)}
                  >
                    <Edit size={14} className="mr-1" /> Modifier
                  </Button>
                  <Button
                    variant="danger"
                    className="py-2 px-3 bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white rounded-none"
                    onClick={() => handleDelete(p.id, p.name)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODALE SIMPLIFIÉE (3 CHAMPS UNIQUEMENT) ── */}
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
              ? "Ajouter un Article au Menu"
              : "Modifier l'Article"}
          </h3>

          <div className="space-y-4">
            {/* 1. NOM DE L'ARTICLE */}
            <Input
              label="Nom de l'article *"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ex: Café Espresso, Red Bull 250ml, Eau Minérale 0.5L"
              autoFocus
              required
            />

            {/* 2. CATÉGORIE */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-t-muted mb-2">
                Catégorie *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                className="w-full bg-main border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand font-bold text-xs uppercase rounded-none cursor-pointer"
                required
              >
                <option value="">-- Sélectionner une Catégorie --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-[10px] text-red-500 mt-1 font-bold">
                  ⚠️ Créez d'abord au moins une catégorie dans l'onglet
                  "Catégories".
                </p>
              )}
            </div>

            {/* 3. PRIX DE VENTE */}
            <Input
              label="Prix de Vente Client (DZD) *"
              type="number"
              step="10"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              placeholder="Ex: 150"
              required
            />

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
