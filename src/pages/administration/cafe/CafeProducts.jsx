import { useState, useEffect } from "react";
import {
  Coffee,
  Plus,
  Edit,
  Trash2,
  RefreshCcw,
  Bookmark,
  Tag,
  Layers,
  Database,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../../utils/api";

import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import ImageUpload from "../../../components/common/ImageUpload";
import ColorfulStatCard from "../../../components/common/ColorfulStatCard"; // <-- IMPORT THE COLORFUL CARD

export default function CafeProducts() {
  const [products, setProducts] = useState([]);

  // Master Lists
  const [categories, setCategories] = useState([]);
  const [families, setFamilies] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);

  const [inventoryStats, setInventoryStats] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [itemToEdit, setItemToEdit] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    reference: "",
    image: "",
    purchasePrice: "",
    price: "",
    nuc: "1",
    packagingUnitId: "",
    categoryId: "",
    familyId: "",
    brandId: "",
    canSell: true,
    canBuy: true,
    isTracked: true,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes, famRes, brandRes, unitRes, statsRes] =
        await Promise.all([
          api.get("/cafe/products"),
          api.get("/cafe/categories"),
          api.get("/cafe/families"),
          api.get("/cafe/brands"),
          api.get("/cafe/units"),
          api.get("/cafe/stats"),
        ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
      setFamilies(famRes.data);
      setBrands(brandRes.data);
      setUnits(unitRes.data);
      setInventoryStats(statsRes.data); // <-- SAVE THE STATS
    } catch (error) {
      toast.error("Erreur de synchronisation.");
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
            reference: item.reference || "",
            image: item.image || "",
            purchasePrice: item.purchasePrice,
            price: item.price,
            nuc: item.nuc,
            packagingUnitId: item.packagingUnitId || "",
            categoryId: item.categoryId || "",
            familyId: item.familyId || "",
            brandId: item.brandId || "",
            canSell: item.canSell ?? true,
            canBuy: item.canBuy ?? true,
            isTracked: item.isTracked ?? true,
          }
        : {
            name: "",
            reference: "",
            image: "",
            purchasePrice: "",
            price: "",
            nuc: "1",
            packagingUnitId: "",
            categoryId: "",
            familyId: "",
            brandId: "",
            canSell: true,
            canBuy: true,
            isTracked: true,
          },
    );
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    // 1. Validation de base (Nom)
    if (!formData.name || !formData.name.trim()) {
      return toast.error("Le nom du produit est requis.");
    }

    // 2. VALIDATION DYNAMIQUE : Prix de Vente (uniquement si le produit est vendable)
    if (
      formData.canSell &&
      (!formData.price || isNaN(parseFloat(formData.price)))
    ) {
      return toast.error("Le prix de vente unitaire est requis.");
    }

    // 3. VALIDATION DYNAMIQUE : Prix d'Achat (uniquement si le produit est achetable)
    if (
      formData.canBuy &&
      (!formData.purchasePrice || isNaN(parseFloat(formData.purchasePrice)))
    ) {
      return toast.error("Le prix d'achat unitaire est requis.");
    }

    // 4. Validation de la catégorie (Toujours requis)
    if (!formData.categoryId) {
      return toast.error("La catégorie est requise.");
    }

    // 5. Validation du NUC (Uniquement si le produit est achetable)
    if (formData.canBuy && (!formData.nuc || Number(formData.nuc) < 1)) {
      return toast.error("Le NUC doit être d'au moins 1.");
    }

    setIsSubmitting(true);
    try {
      // Préparation sécurisée du Payload
      const payload = {
        name: formData.name.trim(),
        reference: formData.reference.trim() || undefined,
        image: formData.image,

        // Sécurités : On force à 0 les valeurs masquées du formulaire
        price: formData.canSell ? parseFloat(formData.price) : 0.0,
        purchasePrice: formData.canBuy
          ? parseFloat(formData.purchasePrice)
          : 0.0,
        nuc: formData.canBuy ? parseInt(formData.nuc, 10) : 1,

        categoryId: Number(formData.categoryId),

        // Relations optionnelles uniquement si achetables
        packagingUnitId:
          formData.canBuy && formData.packagingUnitId
            ? Number(formData.packagingUnitId)
            : undefined,

        familyId: formData.familyId ? Number(formData.familyId) : undefined,
        brandId: formData.brandId ? Number(formData.brandId) : undefined,

        canSell: formData.canSell,
        canBuy: formData.canBuy,
        // On ne gère pas le stock si le produit n'est pas vendu !
        isTracked: formData.canSell ? formData.isTracked : false,
      };

      if (modalMode === "add") {
        await api.post("/cafe/products", payload);
        toast.success("Produit ajouté avec succès");
      } else {
        await api.put(`/cafe/products/${itemToEdit.id}`, payload);
        toast.success("Produit mis à jour");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur d'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (
      !window.confirm(`Voulez-vous vraiment supprimer le produit "${name}" ?`)
    )
      return;
    try {
      await api.delete(`/cafe/products/${id}`);
      toast.success("Produit supprimé");
      fetchData();
    } catch (error) {
      toast.error("Suppression impossible (utilisé dans l'historique)");
    }
  };

  return (
    <div className="space-y-6">
      {/* --- RANGÉE DE STATS COLORÉES --- */}
      {inventoryStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ColorfulStatCard
            label="Articles Actifs"
            value={inventoryStats.productsCount}
            icon={Coffee}
            colorTheme="blue"
          />
          <ColorfulStatCard
            label="Catégories du Menu"
            value={inventoryStats.categoriesCount}
            icon={Layers}
            colorTheme="rose"
          />
          <ColorfulStatCard
            label="Marques Référencées"
            value={inventoryStats.brandsCount}
            icon={Tag}
            colorTheme="emerald"
          />
          <ColorfulStatCard
            label="Familles"
            value={inventoryStats.familiesCount}
            icon={Bookmark}
            colorTheme="amber"
          />
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-6 bg-surface border border-subtle shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-t-main flex items-center gap-2">
            <Coffee size={24} className="text-brand" /> Catalogue Produits
          </h2>
          <p className="text-t-muted text-sm mt-1">
            Gérez les articles vendus dans la cafétéria, leurs prix et
            comportements.
          </p>
        </div>
        <Button
          variant="success"
          onClick={() => handleOpenModal("add")}
          className="py-3 px-6 text-sm"
        >
          <Plus size={18} /> Nouveau Produit
        </Button>
      </div>

      {/* --- CONTENT GRID --- */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center text-brand space-y-4">
          <RefreshCcw className="w-10 h-10 animate-spin" />
          <span className="font-bold text-lg">
            Chargement de la base de données...
          </span>
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-subtle bg-surface font-bold text-lg text-t-muted">
          Aucun produit dans le catalogue. Cliquez sur "Nouveau Produit".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-surface border border-subtle flex flex-col group shadow-md hover:shadow-lg transition-all"
            >
              <div className="h-40 bg-main border-b border-subtle p-2 relative">
                {/* Badge ID */}
                <span className="absolute top-2 right-2 bg-slate-800 text-white text-[10px] font-mono font-bold px-2 py-1 shadow-sm">
                  #{p.id}
                </span>
                <img
                  src={
                    p.image ||
                    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=400"
                  }
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  alt={p.name}
                />
              </div>

              <div className="p-4 flex-1 space-y-4">
                <div>
                  <span className="inline-block px-2 py-1 mb-2 bg-blue-600 text-white text-[10px] font-bold uppercase shadow-sm">
                    {p.category?.name || "Sans Catégorie"}
                  </span>
                  <h3 className="font-bold text-t-main text-lg leading-tight line-clamp-2">
                    {p.name}
                  </h3>
                </div>

                <div className="flex gap-2">
                  {p.brand && (
                    <span className="text-xs text-t-muted bg-main border border-subtle px-2 py-1 flex items-center gap-1 font-semibold">
                      <Tag size={12} /> {p.brand.name}
                    </span>
                  )}
                  {p.family && (
                    <span className="text-xs text-t-muted bg-main border border-subtle px-2 py-1 flex items-center gap-1 font-semibold">
                      <Bookmark size={12} /> {p.family.name}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center bg-main p-2 border border-subtle">
                  <span className="text-xs font-bold text-t-muted">
                    Prix de vente
                  </span>
                  <span className="text-lg font-mono font-bold text-green-500">
                    {p.price.toFixed(2)} DA
                  </span>
                </div>
              </div>

              <div className="flex border-t border-subtle bg-surface p-2 gap-2">
                <Button
                  variant="secondary"
                  fullWidth
                  className="py-2 text-sm bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white transition-colors"
                  onClick={() => handleOpenModal("edit", p)}
                >
                  <Edit size={16} /> Éditer
                </Button>
                <Button
                  variant="danger"
                  className="py-2 px-3 bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white transition-colors"
                  onClick={() => handleDelete(p.id, p.name)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MASSIVE ERP MODAL --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
      >
        <div className="p-8 max-h-[90vh] overflow-y-auto bg-surface">
          <h3 className="text-2xl font-bold text-t-main mb-6 border-b border-subtle pb-4">
            {modalMode === "add"
              ? "Créer une Fiche Article"
              : "Modifier l'Article"}
          </h3>

          <div className="space-y-6">
            <ImageUpload
              label="Photo de l'article"
              value={formData.image}
              onChange={(val) => setFormData({ ...formData, image: val })}
            />

            {/* BLOCK 1: IDENTIFICATION */}
            <div className="p-5 border border-subtle bg-main shadow-inner space-y-4">
              <h4 className="text-sm font-bold text-brand uppercase border-b border-subtle pb-2">
                1. Identification
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-t-muted mb-2">
                    Nom du Produit *
                  </label>
                  <input
                    type="text"
                    className="w-full bg-surface border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand font-bold"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Coca Cola 33cl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-t-muted mb-2">
                    Référence
                  </label>
                  <input
                    type="text"
                    className="w-full bg-surface border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand font-bold"
                    value={formData.reference}
                    onChange={(e) =>
                      setFormData({ ...formData, reference: e.target.value })
                    }
                    placeholder="Ex: CC-33"
                  />
                </div>
              </div>
            </div>

            {/* BLOCK 2: CLASSIFICATION */}
            <div className="p-5 border border-subtle bg-main shadow-inner space-y-4">
              <h4 className="text-sm font-bold text-brand uppercase border-b border-subtle pb-2">
                2. Classification
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="w-full">
                  <label className="block text-xs font-bold text-t-muted mb-2">
                    Catégorie *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="w-full bg-surface border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand font-bold"
                  >
                    <option value="">Sélectionner</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full">
                  <label className="block text-xs font-bold text-t-muted mb-2">
                    Marque
                  </label>
                  <select
                    value={formData.brandId}
                    onChange={(e) =>
                      setFormData({ ...formData, brandId: e.target.value })
                    }
                    className="w-full bg-surface border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand font-bold"
                  >
                    <option value="">Aucune</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full">
                  <label className="block text-xs font-bold text-t-muted mb-2">
                    Famille
                  </label>
                  <select
                    value={formData.familyId}
                    onChange={(e) =>
                      setFormData({ ...formData, familyId: e.target.value })
                    }
                    className="w-full bg-surface border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand font-bold"
                  >
                    <option value="">Aucune</option>
                    {families.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* BLOCK 3: LOGISTICS & PRICING */}
            <div className="p-5 border border-subtle bg-main shadow-inner space-y-4 transition-all">
              <div className="flex justify-between items-center border-b border-subtle pb-2">
                <h4 className="text-sm font-bold text-brand uppercase">
                  3. Logistique & Tarification
                </h4>
                {!formData.canBuy && (
                  <span className="text-xs bg-amber-500 text-white px-2 py-1 font-bold shadow-sm">
                    Mode Service (Immatériel)
                  </span>
                )}
              </div>

              {formData.canBuy && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="w-full">
                    <label className="block text-xs font-bold text-t-muted mb-2">
                      Unité de Vente
                    </label>
                    <div className="w-full bg-surface border border-subtle text-t-muted px-4 py-3 font-bold cursor-not-allowed opacity-70">
                      Unité (Pièce)
                    </div>
                  </div>
                  <div className="w-full">
                    <label className="block text-xs font-bold text-t-muted mb-2">
                      Unité de Colisage
                    </label>
                    <select
                      value={formData.packagingUnitId || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          packagingUnitId: e.target.value,
                        })
                      }
                      className="w-full bg-surface border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand font-bold"
                    >
                      <option value="">Sélectionner (Optionnel)</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-t-muted mb-2">
                      NUC (Qté/Colis) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full bg-surface border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand font-bold font-mono"
                      value={formData.nuc}
                      onChange={(e) =>
                        setFormData({ ...formData, nuc: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}

              <div
                className={`grid ${formData.canBuy ? "grid-cols-2" : "grid-cols-1"} gap-4 pt-4 border-t border-subtle border-dashed`}
              >
                {formData.canBuy && (
                  <div>
                    <label className="block text-xs font-bold text-t-muted mb-2">
                      Prix d'Achat Unitaire (DZD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-surface border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand font-bold font-mono"
                      value={formData.purchasePrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          purchasePrice: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
                {formData.canSell ? (
                  <div>
                    <label className="block text-xs font-bold text-brand mb-2">
                      Prix de Vente Unitaire (DZD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-surface border-2 border-brand/50 text-t-main px-4 py-3 focus:outline-none focus:border-brand font-bold font-mono shadow-inner"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-4 border border-dashed border-subtle text-t-muted font-bold bg-surface">
                    Produit Non Destiné à la Vente (Interne)
                  </div>
                )}
              </div>
            </div>

            {/* BLOCK 4: COMPORTEMENT DU PRODUIT */}
            <div className="p-5 border border-subtle bg-main shadow-inner space-y-4">
              <h4 className="text-sm font-bold text-brand uppercase border-b border-subtle pb-2">
                4. Comportement du Système
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.canSell}
                    onChange={(e) =>
                      setFormData({ ...formData, canSell: e.target.checked })
                    }
                    className="w-5 h-5 accent-brand"
                  />
                  <div>
                    <p className="text-sm font-bold text-t-main group-hover:text-brand transition-colors">
                      Vendable (POS)
                    </p>
                    <p className="text-xs text-t-muted">Apparaît en caisse</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.canBuy}
                    onChange={(e) =>
                      setFormData({ ...formData, canBuy: e.target.checked })
                    }
                    className="w-5 h-5 accent-brand"
                  />
                  <div>
                    <p className="text-sm font-bold text-t-main group-hover:text-brand transition-colors">
                      Achetable (Stock)
                    </p>
                    <p className="text-xs text-t-muted">
                      Pour les fournisseurs
                    </p>
                  </div>
                </label>
                <label
                  className={`flex items-center gap-3 cursor-pointer group ${!formData.canBuy ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={formData.canBuy ? formData.isTracked : false}
                    onChange={(e) => {
                      if (formData.canBuy)
                        setFormData({
                          ...formData,
                          isTracked: e.target.checked,
                        });
                    }}
                    className="w-5 h-5 accent-brand"
                    disabled={!formData.canBuy}
                  />
                  <div>
                    <p className="text-sm font-bold text-t-main group-hover:text-brand transition-colors">
                      Gérer le Stock
                    </p>
                    <p className="text-xs text-t-muted">Décompte automatique</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="py-4 font-bold"
              >
                Annuler
              </Button>
              <Button
                variant="success"
                fullWidth
                onClick={handleSave}
                disabled={isSubmitting}
                className="py-4 font-bold shadow-lg shadow-green-500/20"
              >
                {isSubmitting ? "Traitement..." : "Enregistrer Produit"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
