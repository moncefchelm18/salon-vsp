import { useState, useEffect } from "react";
import {
  Scissors,
  Package,
  Plus,
  Edit,
  Trash2,
  RefreshCcw,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Store,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

import Button from "../common/Button";
import Modal from "../common/Modal";
import Input from "../common/Input";

export default function SalonManager() {
  const [activeTab, setActiveTab] = useState("services"); // 'services' ou 'products'

  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("service");
  const [modalMode, setModalMode] = useState("add");
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({});

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [servicesRes, productsRes] = await Promise.all([
        api.get("/services"),
        api.get("/products"),
      ]);
      setServices(servicesRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error("Erreur de chargement des données.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── GESTION DE L'ORDRE DES COUPES (MONTER / DESCENDRE) ──
  const handleSwapOrder = async (id, direction) => {
    try {
      await api.patch(`/services/${id}/swap`, { direction });
      fetchData();
    } catch (err) {
      toast.error("Impossible de modifier l'ordre.");
    }
  };

  const handleOpenModal = (type, mode, item = null) => {
    setModalType(type);
    setModalMode(mode);
    if (mode === "edit" && item) {
      setCurrentItem(item);
      setFormData(
        type === "service"
          ? {
              ...item,
              hasProductDeduction: item.hasProductDeduction || false,
              productCost: item.productCost ? item.productCost.toString() : "",
              isVipOnly: item.isVipOnly || false,
            }
          : {
              name: item.name,
              salePrice: item.salePrice ? item.salePrice.toString() : "",
            },
      );
    } else {
      setCurrentItem(null);
      setFormData(
        type === "service"
          ? {
              name: "",
              price: "",
              hasProductDeduction: false,
              productCost: "",
              isVipOnly: false,
            }
          : {
              name: "",
              salePrice: "",
            },
      );
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (!isSubmitting) setIsModalOpen(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) return toast.error("Le nom est obligatoire.");

    if (
      modalType === "service" &&
      (!formData.price || isNaN(parseFloat(formData.price)))
    ) {
      return toast.error("Veuillez renseigner un tarif valide.");
    }

    if (
      modalType === "product" &&
      (!formData.salePrice || isNaN(parseFloat(formData.salePrice)))
    ) {
      return toast.error("Veuillez renseigner un prix de vente valide.");
    }

    setIsSubmitting(true);
    const endpoint = modalType === "service" ? "/services" : "/products";

    try {
      const payload = {
        name: formData.name.trim(),
        ...(modalType === "service"
          ? {
              price: parseFloat(formData.price),
              hasProductDeduction: Boolean(formData.hasProductDeduction),
              productCost: formData.hasProductDeduction
                ? parseFloat(formData.productCost) || 0
                : 0,
              isVipOnly: Boolean(formData.isVipOnly),
            }
          : {
              salePrice: parseFloat(formData.salePrice),
            }),
      };

      if (modalMode === "add") {
        await api.post(endpoint, payload);
        toast.success(`${formData.name} ajouté au catalogue !`);
      } else {
        await api.put(`${endpoint}/${currentItem.id}`, payload);
        toast.success(`${formData.name} mis à jour !`);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur de sauvegarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (type, id, name) => {
    if (!window.confirm(`Supprimer définitivement "${name}" ?`)) return;

    const endpoint = type === "service" ? "/services" : "/products";
    try {
      await api.delete(`${endpoint}/${id}`);
      toast.success("Élément supprimé.");
      fetchData();
    } catch (error) {
      toast.error("Échec de la suppression.");
    }
  };

  // ── CARTE TACTILE ÉPURÉE (COUPE OU PRODUIT) ──
  const ItemCard = ({ item, isService, index }) => (
    <div className="bg-surface border border-subtle shadow-sm hover:shadow-md transition-all flex flex-col justify-between p-4 space-y-3 relative overflow-hidden rounded-none">
      <div
        className={`absolute top-0 left-0 w-full h-1 ${
          isService ? "bg-blue-500" : "bg-purple-500"
        }`}
      />

      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 text-[8px] font-bold text-white uppercase rounded-none ${
                isService ? "bg-blue-600" : "bg-purple-600"
              }`}
            >
              {isService ? "PRESTATION" : "PRODUIT BOUTIQUE"}
            </span>

            {isService && item.isVipOnly && (
              <span className="bg-amber-500 text-slate-900 px-2 py-0.5 text-[8px] font-bold uppercase rounded-none">
                ⭐ VIP
              </span>
            )}

            {isService && (
              <span className="text-[10px] font-mono font-bold text-brand bg-main border border-subtle px-1.5 py-0.5 rounded-none">
                #{index + 1}
              </span>
            )}
          </div>

          {/* Flèches pour organiser les coupes */}
          {isService && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleSwapOrder(item.id, "up")}
                disabled={index === 0}
                className="p-1 border border-subtle bg-main text-t-muted hover:text-brand disabled:opacity-20 transition-colors rounded-none"
                title="Monter en tête de liste"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleSwapOrder(item.id, "down")}
                disabled={index === services.length - 1}
                className="p-1 border border-subtle bg-main text-t-muted hover:text-brand disabled:opacity-20 transition-colors rounded-none"
                title="Descendre dans la liste"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          )}

          {isService && item.hasProductDeduction && (
            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/30 font-bold text-[8px] uppercase px-1.5 py-0.5 rounded-none">
              Dose: {item.productCost} DA
            </span>
          )}
        </div>

        <h3 className="font-bold text-t-main text-sm uppercase leading-tight line-clamp-2">
          {item.name}
        </h3>
      </div>

      <div className="space-y-2">
        {isService ? (
          <div>
            <div className="flex justify-between items-center bg-main p-2.5 border border-subtle">
              <span className="text-xs font-bold text-t-muted uppercase">
                Tarif Client
              </span>
              <span className="text-lg font-mono font-bold text-green-400">
                {Number(item.price).toFixed(2)} DA
              </span>
            </div>
            {item.hasProductDeduction ? (
              <p className="text-[9px] text-t-muted italic bg-amber-500/5 p-1 border border-amber-500/20 mt-1">
                Dose déduite : {item.productCost} DA avant partage 50/50
              </p>
            ) : (
              <p className="text-[9px] text-t-muted italic bg-main p-1 border border-subtle mt-1">
                Partage standard 50/50
              </p>
            )}
          </div>
        ) : (
          <div>
            <div className="bg-main p-2.5 border border-subtle flex justify-between items-center">
              <span className="text-xs font-bold text-t-muted uppercase">
                Prix Vente
              </span>
              <span className="text-xl font-mono font-bold text-green-400">
                {Number(item.salePrice).toFixed(2)} DA
              </span>
            </div>
            <p className="text-[9px] text-purple-400 font-bold uppercase tracking-wider bg-purple-500/10 p-1 border border-purple-500/20 mt-1 text-center">
              100% Bénéfice Salon (Boutique)
            </p>
          </div>
        )}
      </div>

      <div className="flex border-t border-subtle pt-2 gap-2">
        <Button
          variant="secondary"
          fullWidth
          className="py-2 text-xs bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white rounded-none"
          onClick={() =>
            handleOpenModal(isService ? "service" : "product", "edit", item)
          }
        >
          <Edit size={14} className="mr-1" /> Modifier
        </Button>
        <Button
          variant="danger"
          className="py-2 px-3 bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white rounded-none"
          onClick={() =>
            handleDelete(isService ? "service" : "product", item.id, item.name)
          }
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* TABS : Prestations vs Produits */}
      <div className="flex gap-2 p-1 bg-surface border border-subtle w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("services")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-wider transition-colors rounded-none ${
            activeTab === "services"
              ? "bg-brand text-white shadow-md"
              : "text-t-muted hover:bg-main hover:text-t-main"
          }`}
        >
          <Scissors size={16} /> Prestations Coiffure ({services.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-wider transition-colors rounded-none ${
            activeTab === "products"
              ? "bg-brand text-white shadow-md"
              : "text-t-muted hover:bg-main hover:text-t-main"
          }`}
        >
          <Package size={16} /> Produits Boutique Salon ({products.length})
        </button>
      </div>

      {/* HEADER DE GESTION */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 p-6 bg-surface border border-subtle shadow-sm">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-widest text-t-main flex items-center gap-2">
            {activeTab === "services" ? (
              <Scissors size={20} className="text-brand" />
            ) : (
              <Store size={20} className="text-purple-400" />
            )}
            {activeTab === "services"
              ? "Catalogue des Prestations Coiffure"
              : "Articles Boutique & Soins de Revente"}
          </h2>
          <p className="text-t-muted text-xs mt-1">
            {activeTab === "services"
              ? "Organisez les coupes avec les flèches pour les placer en tête de caisse."
              : "Gérez vos cires, poudres et shampoings. Chaque vente est 100% attribuée au Salon."}
          </p>
        </div>
        <Button
          variant="success"
          onClick={() =>
            handleOpenModal(
              activeTab === "services" ? "service" : "product",
              "add",
            )
          }
          className="py-3 px-6 text-xs font-bold rounded-none shadow-md"
        >
          <Plus size={16} className="mr-1.5" />
          Ajouter {activeTab === "services" ? "une Prestation" : "un Produit"}
        </Button>
      </div>

      {/* GRILLE */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-brand space-y-4">
          <RefreshCcw className="w-10 h-10 animate-spin" />
          <span className="font-bold text-xs uppercase tracking-widest">
            Chargement du catalogue...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeTab === "services" &&
            services.map((s, index) => (
              <ItemCard key={s.id} item={s} isService={true} index={index} />
            ))}
          {activeTab === "products" &&
            products.map((p, index) => (
              <ItemCard key={p.id} item={p} isService={false} index={index} />
            ))}
        </div>
      )}

      {/* ── MODALE UNIQUE ULTRA-SIMPLIFIÉE ── */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <div className="p-6 sm:p-8 bg-surface rounded-none">
          <h3 className="text-lg font-bold text-t-main mb-6 border-b border-subtle pb-3 uppercase tracking-wider">
            {modalMode === "add" ? "Ajouter" : "Modifier"}{" "}
            {modalType === "service"
              ? "une Prestation Coiffure"
              : "un Produit Boutique"}
          </h3>

          <div className="space-y-4">
            {/* FORMULAIRE SERVICE */}
            {modalType === "service" ? (
              <>
                <Input
                  label="Désignation de la coupe *"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleFormChange}
                  placeholder="Ex: Dégradé Simple, Barbe Sculptée"
                  autoFocus
                />

                <Input
                  label="Tarif Facturé au Client (DZD) *"
                  name="price"
                  type="number"
                  value={formData.price || ""}
                  onChange={handleFormChange}
                  placeholder="Ex: 1000"
                />

                {/* Option VIP */}
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 mt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.isVipOnly)}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isVipOnly: e.target.checked,
                        }))
                      }
                      className="w-5 h-5 accent-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold uppercase text-amber-500">
                        Prestation Exclusive VIP
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Masque cette coupe aux barbiers travaillant sur un poste
                        standard.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Option Dose Technique */}
                <div className="bg-main border border-subtle p-3 space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.hasProductDeduction)}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          hasProductDeduction: e.target.checked,
                          productCost: e.target.checked ? prev.productCost : "",
                        }))
                      }
                      className="w-5 h-5 accent-brand"
                    />
                    <div>
                      <span className="text-xs font-bold uppercase text-t-main">
                        Déduction Dose Produit (Kératine / Soin)
                      </span>
                      <p className="text-[10px] text-t-muted">
                        Déduit le coût de la matière première avant le partage
                        50/50.
                      </p>
                    </div>
                  </label>

                  {formData.hasProductDeduction && (
                    <div className="pt-2 border-t border-subtle">
                      <Input
                        label="Coût de la dose déduite (DZD) *"
                        name="productCost"
                        type="number"
                        step="0.01"
                        value={formData.productCost || ""}
                        onChange={handleFormChange}
                        placeholder="Ex: 500"
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* FORMULAIRE PRODUIT (2 CHAMPS UNIQUEMENT !) */
              <>
                <Input
                  label="Nom du Produit *"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleFormChange}
                  placeholder="Ex: Cire Matifiante, Shampoing Keratine, Huile Barbe"
                  autoFocus
                />

                <Input
                  label="Prix de Vente au Client (DZD) *"
                  name="salePrice"
                  type="number"
                  value={formData.salePrice || ""}
                  onChange={handleFormChange}
                  placeholder="Ex: 1500"
                />

                <div className="bg-purple-500/10 border border-purple-500/30 p-3 mt-2">
                  <p className="text-[11px] text-purple-300 font-bold uppercase">
                    Règle Comptable :
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    100% de la vente de ce produit est injectée dans les
                    bénéfices du Salon. Aucune commission barbier n'est déduite.
                  </p>
                </div>
              </>
            )}

            <div className="mt-6 pt-4 border-t border-subtle grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                className="py-3 font-bold text-xs uppercase rounded-none"
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                variant="success"
                onClick={handleSave}
                className="py-3 font-bold text-xs uppercase rounded-none shadow-md"
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
