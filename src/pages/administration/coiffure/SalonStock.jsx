import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Minus,
  RefreshCcw,
  AlertTriangle,
  AlertOctagon,
  Coins,
  Layers,
  Sliders,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../../utils/api";

import Button from "../../../components/common/Button";
import DataTable from "../../../components/common/DataTable";
import Modal from "../../../components/common/Modal";
import Input from "../../../components/common/Input";
import ColorfulStatCard from "../../../components/common/ColorfulStatCard";

export default function SalonStock() {
  const [products, setProducts] = useState([]);
  const [stockStats, setStockStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal d'ajustement rapide (+ / -)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustType, setAdjustType] = useState("plus"); // 'plus' ou 'minus'
  const [adjustQuantity, setAdjustQuantity] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, statsRes] = await Promise.all([
        api.get("/products"),
        api.get("/products/stats"),
      ]);
      setProducts(prodRes.data);
      setStockStats(statsRes.data);
    } catch (err) {
      toast.error("Erreur de chargement des stocks coiffure.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdjustModal = (product) => {
    setSelectedProduct(product);
    setAdjustType("plus");
    setAdjustQuantity("");
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    const qty = parseInt(adjustQuantity, 10);
    if (isNaN(qty) || qty <= 0)
      return toast.error("Veuillez saisir une quantité supérieure à 0.");

    setIsSubmitting(true);
    try {
      // Si retrait, on envoie un montant négatif
      const finalQuantity = adjustType === "minus" ? -qty : qty;

      await api.post("/products/adjust", {
        productId: selectedProduct.id,
        quantity: finalQuantity,
      });

      toast.success("Stock mis à jour avec succès !");
      setIsAdjustModalOpen(false);
      loadData();
    } catch (err) {
      toast.error("Échec de l'ajustement de stock.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── STATS COLORÉES DU STOCK COIFFURE ── */}
      {stockStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ColorfulStatCard
            label="Valeur du Stock (Immobilisé)"
            value={`DZD ${stockStats.totalStockValue.toFixed(2)}`}
            icon={Coins}
            colorTheme="emerald"
          />
          <ColorfulStatCard
            label="Produits en Rupture"
            value={stockStats.outOfStockCount}
            icon={AlertOctagon}
            colorTheme="rose"
          />
          <ColorfulStatCard
            label="Stock Faible (Alerte)"
            value={stockStats.lowStockCount}
            icon={AlertTriangle}
            colorTheme="amber"
          />
          <ColorfulStatCard
            label="Total Références Salon"
            value={stockStats.totalProducts}
            icon={Package}
            colorTheme="blue"
          />
        </div>
      )}

      {/* ── EN-TÊTE ── */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-6 bg-surface border border-subtle shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-t-main flex items-center gap-2">
            <Package className="text-brand" size={24} /> Gestion du Stock
            Coiffure
          </h2>
          <p className="text-t-muted text-sm mt-1">
            Inventaire en temps réel des cires, gels, huiles et produits de
            revente.
          </p>
        </div>
      </div>

      {/* ── TABLEAU D'INVENTAIRE AVEC IMAGES ── */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-brand space-y-4">
          <RefreshCcw className="w-10 h-10 animate-spin" />
          <span className="font-bold text-lg">
            Synchronisation de l'inventaire...
          </span>
        </div>
      ) : products.length === 0 ? (
        <div className="py-12 text-center text-t-muted border border-subtle border-dashed bg-surface font-bold text-lg">
          Aucun produit configuré dans l'inventaire coiffure.
        </div>
      ) : (
        <DataTable
          headers={[
            { label: "Image", sortable: false },
            { label: "Désignation Produit" },
            { label: "Prix Achat (Grossiste)" },
            { label: "Prix Vente (Client)" },
            { label: "Stock Actuel" },
            { label: "Statut" },
            { label: "Actions", align: "right" },
          ]}
        >
          {products.map((p) => (
            <tr
              key={p.id}
              className="border-b border-subtle hover:bg-brand/5 transition-colors"
            >
              {/* Photo du produit */}
              <td className="px-6 py-3">
                <div className="w-12 h-12 bg-main border border-subtle flex justify-center items-center overflow-hidden">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package size={20} className="text-t-muted opacity-40" />
                  )}
                </div>
              </td>

              {/* Nom */}
              <td className="px-6 py-4 font-bold text-t-main text-sm">
                {p.name}
              </td>

              {/* Prix d'Achat */}
              <td className="px-6 py-4 font-mono font-bold text-xs text-t-muted">
                DZD {Number(p.purchasePrice || 0).toFixed(2)}
              </td>

              {/* Prix de Vente */}
              <td className="px-6 py-4 font-mono font-bold text-sm text-brand">
                DZD {Number(p.salePrice).toFixed(2)}
              </td>

              {/* Compteur de Stock */}
              <td className="px-6 py-4 font-mono font-bold text-base">
                <span
                  className={
                    p.stock <= 0
                      ? "text-red-500"
                      : p.stock <= p.minStock
                        ? "text-amber-500"
                        : "text-t-main"
                  }
                >
                  {p.stock} unité(s)
                </span>
              </td>

              {/* Badges de Statut */}
              <td className="px-6 py-4">
                {p.stock <= 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 font-bold text-xs shadow-sm">
                    <AlertTriangle size={12} /> Rupture
                  </span>
                ) : p.stock <= p.minStock ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold text-xs shadow-sm">
                    Faible (≤ {p.minStock})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 font-bold text-xs shadow-sm">
                    <CheckCircle size={12} /> Disponible
                  </span>
                )}
              </td>

              {/* Bouton d'Ajustement */}
              <td className="px-6 py-4 text-right">
                <Button
                  variant="secondary"
                  onClick={() => handleOpenAdjustModal(p)}
                  className="py-2 px-4 text-xs bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white transition-colors"
                >
                  <Sliders size={14} className="mr-1.5" /> Ajuster Stock
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {/* ── MODALE : AJUSTEMENT RAPIDE DE STOCK (+ / -) ── */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => !isSubmitting && setIsAdjustModalOpen(false)}
      >
        {selectedProduct && (
          <form onSubmit={handleSaveAdjustment} className="p-8 bg-surface">
            <h3 className="text-2xl font-bold text-t-main mb-6 border-b border-subtle pb-4 flex items-center gap-2">
              <Sliders className="text-brand" size={24} /> Ajuster le Stock
              Physique
            </h3>

            {/* Fiche récapitulative du produit */}
            <div className="bg-main border border-subtle p-4 mb-6 flex justify-between items-center shadow-inner">
              <div>
                <p className="text-[10px] uppercase font-bold text-t-muted tracking-widest">
                  Produit sélectionné
                </p>
                <p className="font-bold text-t-main uppercase text-sm mt-0.5">
                  {selectedProduct.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-t-muted tracking-widest">
                  Stock Actuel
                </p>
                <p className="font-mono font-bold text-xl text-brand">
                  {selectedProduct.stock} unités
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Type d'opération (+ ou -) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-t-muted mb-2">
                  Type d'opération
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={adjustType === "plus" ? "success" : "outline"}
                    onClick={() => setAdjustType("plus")}
                    className="py-4 font-bold text-xs"
                  >
                    <Plus size={16} className="mr-1" /> Entrée (Livraison /
                    Achat)
                  </Button>
                  <Button
                    type="button"
                    variant={adjustType === "minus" ? "danger" : "outline"}
                    onClick={() => setAdjustType("minus")}
                    className="py-4 font-bold text-xs"
                  >
                    <Minus size={16} className="mr-1" /> Sortie (Perte / Casse)
                  </Button>
                </div>
              </div>

              {/* Quantité */}
              <Input
                label="Nombre d'unités à ajouter ou retirer *"
                type="number"
                min="1"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(e.target.value)}
                required
                placeholder="Ex: 10"
                autoFocus
              />

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-subtle">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  disabled={isSubmitting}
                  className="py-4 font-bold"
                >
                  Annuler
                </Button>
                <Button
                  variant={adjustType === "plus" ? "success" : "danger"}
                  type="submit"
                  disabled={isSubmitting}
                  className="py-4 font-bold shadow-lg"
                >
                  {isSubmitting ? "Enregistrement..." : "Valider l'Ajustement"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
