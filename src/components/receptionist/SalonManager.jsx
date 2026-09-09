import { useState, useEffect } from "react";
import {
  Scissors,
  Package,
  Plus,
  Edit,
  Trash2,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

import Button from "../common/Button";
import Modal from "../common/Modal";
import Input from "../common/Input";
import ImageUpload from "../common/ImageUpload";

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
              duration: "",
              image: "",
              hasProductDeduction: false,
              productCost: "",
            }
          : {
              name: "",
              salePrice: "",
              purchasePrice: "",
              stock: "0",
              minStock: "3",
              costPerUse: "",
              image: "",
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
    if (!formData.name) return toast.error("Le nom est obligatoire.");

    setIsSubmitting(true);
    const endpoint = modalType === "service" ? "/services" : "/products";

    try {
      if (modalMode === "add") {
        await api.post(endpoint, formData);
        toast.success(`${formData.name} ajouté avec succès !`);
      } else {
        await api.put(`${endpoint}/${currentItem.id}`, formData);
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
    if (!window.confirm(`Voulez-vous vraiment supprimer "${name}" ?`)) return;

    const endpoint = type === "service" ? "/services" : "/products";
    try {
      await api.delete(`${endpoint}/${id}`);
      toast.success("Élément supprimé.");
      fetchData();
    } catch (error) {
      toast.error("Échec de la suppression.");
    }
  };

  // --- CARTE D'AFFICHAGE (ITEM CARD) ---
  const ItemCard = ({ item, isService }) => (
    <div className="bg-surface border border-subtle shadow-md hover:shadow-lg transition-all flex flex-col justify-between group">
      <div>
        <div
          className={`h-1.5 w-full ${isService ? "bg-blue-500" : "bg-purple-500"}`}
        />
        <div className="bg-main border-b border-subtle relative h-40">
          <img
            src={
              item.image ||
              "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=600&auto=format&fit=crop"
            }
            alt={item.name}
            className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          />
          <span
            className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold text-white shadow-sm ${
              isService ? "bg-blue-600" : "bg-purple-600"
            }`}
          >
            {isService ? "SERVICE" : "PRODUIT"}
          </span>

          {/* Badge Prestation Technique si activé */}
          {isService && item.hasProductDeduction && (
            <span className="absolute top-2 left-2 bg-amber-500 text-slate-950 font-bold text-[9px] uppercase px-2 py-1 shadow-sm flex items-center gap-1">
              <Sparkles size={10} /> Technique (Dose: {item.productCost} DA)
            </span>
          )}
        </div>

        <div className="p-4 space-y-3">
          <h3 className="font-bold text-t-main text-lg leading-tight line-clamp-2">
            {item.name}
          </h3>

          {isService ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-main p-2 border border-subtle">
                <div className="flex flex-col">
                  <span className="text-xs text-t-muted font-bold">Durée</span>
                  <span className="text-sm font-bold text-t-main">
                    {item.duration} Min
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-t-muted font-bold">
                    Tarif Client
                  </span>
                  <span className="text-lg font-mono font-bold text-green-500">
                    {Number(item.price).toFixed(2)} DA
                  </span>
                </div>
              </div>

              {/* Aperçu répartition sur la carte */}
              {item.hasProductDeduction ? (
                <div className="text-[10px] text-t-muted italic bg-amber-500/5 p-2 border border-amber-500/20">
                  Part Barbier :{" "}
                  {(Math.max(0, item.price - item.productCost) * 0.5).toFixed(
                    0,
                  )}{" "}
                  DA | Salon :{" "}
                  {(
                    item.productCost +
                    (item.price - item.productCost) * 0.5
                  ).toFixed(0)}{" "}
                  DA
                </div>
              ) : (
                <div className="text-[10px] text-t-muted italic bg-main p-1.5 border border-subtle">
                  Répartition standard 50/50 (Barbier:{" "}
                  {(item.price * 0.5).toFixed(0)} DA)
                </div>
              )}
            </div>
          ) : (
            <div className="bg-main p-2 border border-subtle space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-t-muted">
                  Prix de vente
                </span>
                <span className="text-lg font-mono font-bold text-green-500">
                  {Number(item.salePrice).toFixed(2)} DA
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex border-t border-subtle bg-surface p-2 gap-2">
        <Button
          variant="secondary"
          fullWidth
          className="py-2 text-sm bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white"
          onClick={() =>
            handleOpenModal(isService ? "service" : "product", "edit", item)
          }
        >
          <Edit size={16} /> Modifier
        </Button>
        <Button
          variant="danger"
          className="py-2 px-3 bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white"
          onClick={() =>
            handleDelete(isService ? "service" : "product", item.id, item.name)
          }
        >
          <Trash2 size={16} />
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
          <Package className="w-5 h-5" /> Produits Vente/Salon
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 p-6 bg-surface border border-subtle shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-t-main">
            {activeTab === "services"
              ? "Menu des Prestations"
              : "Inventaire des Produits"}
          </h2>
          <p className="text-t-muted text-sm mt-1">
            Gérez les tarifs, durées et les règles de calcul des commissions.
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
          {activeTab === "services" ? "une Prestation" : "un Produit"}
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-brand space-y-4">
          <RefreshCcw className="w-10 h-10 animate-spin" />
          <span className="font-bold text-lg">
            Chargement de l'inventaire...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {activeTab === "services" &&
            services.map((s) => (
              <ItemCard key={s.id} item={s} isService={true} />
            ))}
          {activeTab === "products" &&
            products.map((p) => (
              <ItemCard key={p.id} item={p} isService={false} />
            ))}
        </div>
      )}

      {/* --- MODAL AJOUT / ÉDITION --- */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <div className="p-8 max-h-[90vh] overflow-y-auto">
          <h3 className="text-2xl font-bold text-t-main mb-6 border-b border-subtle pb-4">
            {modalMode === "add" ? "Ajouter" : "Modifier"}{" "}
            {modalType === "service" ? "une Prestation" : "un Produit"}
          </h3>

          <div className="space-y-6">
            <ImageUpload
              label="Image de présentation"
              value={formData.image || ""}
              onChange={handleFormChange}
            />

            {modalType === "service" ? (
              <>
                <Input
                  label="Nom de la prestation *"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleFormChange}
                  placeholder="Ex: Soin Protéine"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Tarif Facturé au Client (DZD) *"
                    name="price"
                    type="number"
                    value={formData.price || ""}
                    onChange={handleFormChange}
                    placeholder="Ex: 5000"
                  />
                  <Input
                    label="Durée estimée (Minutes)"
                    name="duration"
                    type="number"
                    value={formData.duration || ""}
                    onChange={handleFormChange}
                    placeholder="Ex: 45"
                  />
                </div>

                {/* ── OPTIONS PRESTATION TECHNIQUE (PROTÉINE, KÉRATINE...) ── */}
                <div className="bg-main border border-subtle p-4 space-y-4 shadow-inner">
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
                        Déduit le coût de la dose (ex: 500 DA) avant le partage
                        50/50 de la main d'œuvre.
                      </p>
                    </div>
                  </label>

                  {formData.hasProductDeduction && (
                    <div className="pt-3 border-t border-subtle space-y-3">
                      <Input
                        label="Coût de la dose / portion consommée (DZD) *"
                        name="productCost"
                        type="number"
                        step="0.01"
                        value={formData.productCost || ""}
                        onChange={handleFormChange}
                        placeholder="Ex: 500"
                      />

                      {/* SIMULATEUR EN DIRECT */}
                      {Number(formData.price) > 0 && (
                        <div className="bg-surface p-3 border border-brand/30 text-xs font-mono space-y-1">
                          <p className="text-[10px] uppercase font-bold text-brand">
                            Simulation de répartition :
                          </p>
                          <div className="flex justify-between text-t-muted">
                            <span>Main d'œuvre nette à partager :</span>
                            <span className="font-bold text-t-main">
                              {Math.max(
                                0,
                                Number(formData.price) -
                                  Number(formData.productCost || 0),
                              )}{" "}
                              DZD
                            </span>
                          </div>
                          <div className="flex justify-between text-green-500">
                            <span>Part Barbier (50% MO) :</span>
                            <span className="font-bold">
                              {(
                                Math.max(
                                  0,
                                  Number(formData.price) -
                                    Number(formData.productCost || 0),
                                ) * 0.5
                              ).toFixed(2)}{" "}
                              DZD
                            </span>
                          </div>
                          <div className="flex justify-between text-brand">
                            <span>Part Salon (Dose + 50% MO) :</span>
                            <span className="font-bold">
                              {(
                                Number(formData.productCost || 0) +
                                Math.max(
                                  0,
                                  Number(formData.price) -
                                    Number(formData.productCost || 0),
                                ) *
                                  0.5
                              ).toFixed(2)}{" "}
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
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Prix d'Achat Grossiste (DZD) *"
                    name="purchasePrice"
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice || ""}
                    onChange={handleFormChange}
                    required
                  />
                  <Input
                    label="Prix de Vente Client (DZD) *"
                    name="salePrice"
                    type="number"
                    step="0.01"
                    value={formData.salePrice || ""}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Stock Initial en Rayon *"
                    name="stock"
                    type="number"
                    value={formData.stock !== undefined ? formData.stock : "0"}
                    onChange={handleFormChange}
                    required
                  />
                  <Input
                    label="Seuil d'Alerte (Stock Faible)"
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
                onClick={handleSave}
                className="py-4 font-bold"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sauvegarde..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
