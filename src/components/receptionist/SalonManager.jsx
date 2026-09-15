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
      toast.error("Erreur de chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── GESTION DU DÉPLACEMENT (MONTER / DESCENDRE) ──
  const handleSwapOrder = async (id, direction) => {
    try {
      await api.patch(`/services/${id}/swap`, { direction });
      fetchData(); // Rafraîchit l'ordre immédiatement
    } catch (err) {
      toast.error("Impossible de modifier l'ordre.");
    }
  };

  const handleOpenModal = (type, mode, item = null) => {
    setModalType(type);
    setModalMode(mode);
    if (mode === "edit" && item) {
      setCurrentItem(item);
      setFormData({
        ...item,
        hasProductDeduction: item.hasProductDeduction || false,
        productCost: item.productCost ? item.productCost.toString() : "",
      });
    } else {
      setCurrentItem(null);
      setFormData(
        type === "service"
          ? {
              name: "",
              price: "",
              hasProductDeduction: false,
              productCost: "",
              isVipOnly: false, // <-- NOUVEAU
            }
          : {
              name: "",
              salePrice: "",
              purchasePrice: "",
              stock: "0",
              minStock: "3",
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

    setIsSubmitting(true);
    const endpoint = modalType === "service" ? "/services" : "/products";

    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
      };

      if (modalMode === "add") {
        await api.post(endpoint, payload);
        toast.success(`${formData.name} ajouté !`);
      } else {
        await api.put(`${endpoint}/${currentItem.id}`, payload);
        toast.success(`${formData.name} mis à jour !`);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur de sauvegarde");
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

  // ── CARTE TACTILE AVEC CONTRÔLE D'ORDRE ──
  const ItemCard = ({ item, isService, index }) => (
    <div className="bg-surface border border-subtle shadow-sm hover:shadow-md transition-all flex flex-col justify-between p-4 space-y-3 relative overflow-hidden group">
      <div
        className={`absolute top-0 left-0 w-full h-1 ${isService ? "bg-blue-500" : "bg-purple-500"}`}
      />

      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 text-[9px] font-bold text-white uppercase ${isService ? "bg-blue-600" : "bg-purple-600"}`}
            >
              {isService ? "PRESTATION" : "PRODUIT"}
            </span>

            {isService && item.isVipOnly && (
              <span className="bg-amber-500 text-slate-900 px-2 py-0.5 text-[9px] font-bold uppercase shadow-sm flex items-center gap-1">
                👑 VIP
              </span>
            )}

            {isService && (
              <span className="text-[10px] font-mono font-bold text-brand bg-main border border-subtle px-1.5 py-0.5">
                #{index + 1}
              </span>
            )}
          </div>

          {/* BOUTONS MONTER 🔼 / DESCENDRE 🔽 POUR LES COUPES */}
          {isService && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleSwapOrder(item.id, "up")}
                disabled={index === 0}
                className="p-1 border border-subtle bg-main text-t-muted hover:text-brand hover:border-brand/40 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                title="Monter en tête de liste"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleSwapOrder(item.id, "down")}
                disabled={index === services.length - 1}
                className="p-1 border border-subtle bg-main text-t-muted hover:text-brand hover:border-brand/40 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                title="Descendre dans la liste"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          )}

          {/* Badge Dose si produit technique */}
          {isService && item.hasProductDeduction && (
            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/30 font-bold text-[9px] uppercase px-2 py-0.5 flex items-center gap-1">
              <Sparkles size={10} /> Dose: {item.productCost} DA
            </span>
          )}
        </div>

        <h3 className="font-bold text-t-main text-base uppercase leading-tight line-clamp-2">
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
              <span className="text-xl font-mono font-bold text-green-500">
                {Number(item.price).toFixed(2)} DA
              </span>
            </div>

            {item.hasProductDeduction ? (
              <div className="text-[10px] text-t-muted italic bg-amber-500/5 p-1.5 border border-amber-500/20 mt-1">
                Part Barbier :{" "}
                {(Math.max(0, item.price - item.productCost) * 0.5).toFixed(0)}{" "}
                DA | Salon :{" "}
                {(
                  Number(item.productCost) +
                  (item.price - item.productCost) * 0.5
                ).toFixed(0)}{" "}
                DA
              </div>
            ) : (
              <div className="text-[10px] text-t-muted italic bg-main p-1.5 border border-subtle mt-1">
                Partage standard 50/50 (Barbier :{" "}
                {(item.price * 0.5).toFixed(0)} DA)
              </div>
            )}
          </div>
        ) : (
          <div className="bg-main p-2.5 border border-subtle flex justify-between items-center">
            <span className="text-xs font-bold text-t-muted uppercase">
              Prix Vente
            </span>
            <span className="text-xl font-mono font-bold text-green-500">
              {Number(item.salePrice).toFixed(2)} DA
            </span>
          </div>
        )}
      </div>

      <div className="flex border-t border-subtle pt-2 gap-2">
        <Button
          variant="secondary"
          fullWidth
          className="py-2 text-xs bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white"
          onClick={() =>
            handleOpenModal(isService ? "service" : "product", "edit", item)
          }
        >
          <Edit size={14} className="mr-1" /> Modifier
        </Button>
        <Button
          variant="danger"
          className="py-2 px-3 bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white"
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
      <div className="flex gap-2 p-1 bg-surface border border-subtle w-fit">
        <button
          onClick={() => setActiveTab("services")}
          className={`flex items-center gap-2 px-6 py-3 font-bold transition-colors ${
            activeTab === "services"
              ? "bg-brand text-white shadow-md"
              : "text-t-muted hover:bg-main hover:text-t-main"
          }`}
        >
          <Scissors className="w-5 h-5" /> Prestations Coiffure
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2 px-6 py-3 font-bold transition-colors ${
            activeTab === "products"
              ? "bg-brand text-white shadow-md"
              : "text-t-muted hover:bg-main hover:text-t-main"
          }`}
        >
          <Package className="w-5 h-5" /> Produits Salon
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 p-6 bg-surface border border-subtle shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-t-main">
            {activeTab === "services"
              ? "Menu des Prestations (Organisable)"
              : "Catalogue des Produits"}
          </h2>
          <p className="text-t-muted text-sm mt-1">
            {activeTab === "services"
              ? "Utilisez les flèches 🔼 / 🔽 pour placer les coupes les plus fréquentes tout en haut."
              : "Gérez les produits de revente du salon."}
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
          className="py-3 px-6 text-sm"
        >
          <Plus size={18} /> Ajouter{" "}
          {activeTab === "services" ? "une Coupe" : "un Produit"}
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-brand space-y-4">
          <RefreshCcw className="w-10 h-10 animate-spin" />
          <span className="font-bold text-lg">Chargement...</span>
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

      {/* MODAL */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-t-main mb-6 border-b border-subtle pb-3">
            {modalMode === "add" ? "Ajouter" : "Modifier"}{" "}
            {modalType === "service" ? "une Prestation" : "un Produit"}
          </h3>

          <div className="space-y-4">
            {modalType === "service" ? (
              <>
                <Input
                  label="Nom de la prestation *"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleFormChange}
                  placeholder="Ex: Dégradé Simple"
                  autoFocus
                />

                <Input
                  label="Tarif Facturé au Client (DZD) *"
                  name="price"
                  type="number"
                  value={formData.price || ""}
                  onChange={handleFormChange}
                  placeholder="Ex: 500"
                />

                {/* ── OPTION VIP UNIQUEMENT ── */}
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 shadow-inner mt-2">
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
                        Réservé aux Postes VIP
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Masque cette coupe aux barbiers travaillant sur un poste
                        standard.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="bg-main border border-subtle p-4 space-y-3 shadow-inner">
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
                        Prestation Technique avec Consommation Produit
                      </span>
                      <p className="text-[10px] text-t-muted">
                        Déduit le coût de la dose (Protéine, Kératine...) avant
                        le partage 50/50.
                      </p>
                    </div>
                  </label>

                  {formData.hasProductDeduction && (
                    <div className="pt-2 border-t border-subtle space-y-2">
                      <Input
                        label="Coût de la dose déduite (DZD) *"
                        name="productCost"
                        type="number"
                        step="0.01"
                        value={formData.productCost || ""}
                        onChange={handleFormChange}
                        placeholder="Ex: 500"
                      />

                      {Number(formData.price) > 0 && (
                        <div className="bg-surface p-2.5 border border-brand/30 text-xs font-mono space-y-1">
                          <div className="flex justify-between text-green-500">
                            <span>Part Barbier :</span>
                            <span className="font-bold">
                              {(
                                Math.max(
                                  0,
                                  Number(formData.price) -
                                    Number(formData.productCost || 0),
                                ) * 0.5
                              ).toFixed(0)}{" "}
                              DZD
                            </span>
                          </div>
                          <div className="flex justify-between text-brand">
                            <span>Part Salon :</span>
                            <span className="font-bold">
                              {(
                                Number(formData.productCost || 0) +
                                Math.max(
                                  0,
                                  Number(formData.price) -
                                    Number(formData.productCost || 0),
                                ) *
                                  0.5
                              ).toFixed(0)}{" "}
                              DZD
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Input
                  label="Nom du produit *"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleFormChange}
                  placeholder="Ex: Cire Matifiante"
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Prix d'Achat (DZD)"
                    name="purchasePrice"
                    type="number"
                    value={formData.purchasePrice || ""}
                    onChange={handleFormChange}
                  />
                  <Input
                    label="Prix de Vente (DZD) *"
                    name="salePrice"
                    type="number"
                    value={formData.salePrice || ""}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Stock en Rayon *"
                    name="stock"
                    type="number"
                    value={formData.stock !== undefined ? formData.stock : "0"}
                    onChange={handleFormChange}
                  />
                  <Input
                    label="Alerte Stock Faible"
                    name="minStock"
                    type="number"
                    value={
                      formData.minStock !== undefined ? formData.minStock : "3"
                    }
                    onChange={handleFormChange}
                  />
                </div>
              </>
            )}

            <div className="mt-6 pt-4 border-t border-subtle grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                className="py-3 font-bold"
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                variant="success"
                onClick={handleSave}
                className="py-3 font-bold"
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
