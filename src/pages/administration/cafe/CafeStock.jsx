import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  Plus,
  FileCheck,
  Trash2,
  Eye,
  RefreshCcw,
  Box,
  AlertTriangle,
  Search,
  Coins,
  TrendingDown,
  AlertOctagon,
  Edit,
  Tag,
  Sliders,
  History,
  Minus,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../../utils/api";

import Button from "../../../components/common/Button";
import DataTable from "../../../components/common/DataTable";
import Modal from "../../../components/common/Modal";
import Input from "../../../components/common/Input";
import ColorfulStatCard from "../../../components/common/ColorfulStatCard";
import { useAuth } from "../../../context/AuthContext";

export default function CafeStock() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("inventory"); // 'inventory' or 'receptions'
  const [receptions, setReceptions] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  // Create/Edit Draft Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBRId, setEditingBRId] = useState(null); // NULL = creation, Number = modification
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [deliveryNoteRef, setDeliveryNoteRef] = useState(""); // N° Bon de Livraison
  const [orderItems, setOrderItems] = useState([]);
  // Discount States
  const [discountType, setDiscountType] = useState("amount"); // "amount" (DZD) ou "percent" (%)
  const [discountValue, setDiscountValue] = useState("");

  // View Details Modal States
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingBR, setViewingBR] = useState(null);

  const [stockStats, setStockStats] = useState(null);

  const [adjustments, setAdjustments] = useState([]);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [productToAdjust, setProductToAdjust] = useState(null);
  const [adjustData, setAdjustData] = useState({
    quantity: "",
    reason: "Périmé / Jeté",
    type: "minus",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [recRes, supRes, catRes, statsRes, adjRes] = await Promise.all([
        api.get("/cafe/stock"),
        api.get("/cafe/suppliers"),
        api.get("/cafe/products"),
        api.get("/cafe/stock/stats"),
        api.get("/cafe/stock/adjustments"), // <-- NOUVEL APPEL
      ]);
      setReceptions(recRes.data);
      setSuppliers(supRes.data);
      setCatalog(catRes.data);
      setStockStats(statsRes.data);
      setAdjustments(adjRes.data); // <-- SAUVEGARDE DE L'HISTORIQUE
    } catch (err) {
      toast.error("Erreur de synchronisation");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatStock = (totalQty, nuc, unitName = "Colis", isTracked) => {
    if (!isTracked) {
      return (
        <span className="text-t-muted text-xs font-bold uppercase italic">
          Non Suivi (Service)
        </span>
      );
    }

    if (nuc <= 1) return `${totalQty} Unité(s)`;
    const fullPackages = Math.floor(totalQty / nuc);
    const leftovers = totalQty % nuc;
    return (
      <div className="flex flex-col">
        <span className="text-t-main font-bold">{totalQty} Unités</span>
        <span className="text-[10px] text-t-muted uppercase font-bold tracking-tighter">
          ({fullPackages} {unitName || "Colis"} + {leftovers} psc)
        </span>
      </div>
    );
  };

  // --- ACTIONS DU PANIER (Brouillon) ---
  const addLine = () =>
    setOrderItems([
      ...orderItems,
      { productId: "", qtyColis: 0, qtyUnite: 0, unitCost: 0 },
    ]);

  const removeLine = (index) =>
    setOrderItems(orderItems.filter((_, i) => i !== index));

  const updateLine = (index, field, value) => {
    const newItems = [...orderItems];

    // Si l'utilisateur vient de choisir un nouveau Produit depuis la liste déroulante
    if (field === "productId") {
      newItems[index].productId = value;

      // Si un produit est bien sélectionné, on va chercher son "Prix d'Achat" dans le catalogue
      if (value) {
        const productFromCatalog = catalog.find((p) => p.id === Number(value));
        if (productFromCatalog) {
          // On injecte automatiquement le prix d'achat enregistré dans la base de données
          newItems[index].unitCost = productFromCatalog.purchasePrice || 0;
        }
      } else {
        // S'il remet sur "Sélectionner un produit...", on remet le prix à 0
        newItems[index].unitCost = 0;
      }
    } else {
      // Pour tous les autres champs (qtyColis, qtyUnite, ou une modification manuelle du unitCost)
      newItems[index][field] = value;
    }

    setOrderItems(newItems);
  };

  /* const calculateTotal = () => {
  //   return orderItems.reduce((sum, item) => {
  //     const prod = catalog.find((p) => p.id === Number(item.productId));
  //     const nuc = prod?.nuc || 1;
  //     const safeColis = Number(item.qtyColis) || 0;
  //     const safeUnite = Number(item.qtyUnite) || 0;
  //     const totalQty = safeColis * nuc + safeUnite;
  //     const cost = parseFloat(item.unitCost) || 0;
  //     return sum + totalQty * cost;
  //   }, 0);
  // }; */
  const getCalculatedTotals = () => {
    const subTotal = orderItems.reduce((sum, item) => {
      const prod = catalog.find((p) => p.id === Number(item.productId));
      const nuc = prod?.nuc || 1;
      const safeColis = Number(item.qtyColis) || 0;
      const safeUnite = Number(item.qtyUnite) || 0;
      const totalQty = safeColis * nuc + safeUnite;
      const cost = parseFloat(item.unitCost) || 0;
      return sum + totalQty * cost;
    }, 0);

    let discountAmount = 0;
    const val = parseFloat(discountValue) || 0;
    if (discountType === "percent") {
      discountAmount = subTotal * (val / 100);
    } else {
      discountAmount = val;
    }

    const grandTotal = Math.max(0, subTotal - discountAmount);

    return { subTotal, discountAmount, grandTotal };
  };
  // --- OUVRIR LA MODAL EN MODE ÉDITION (✏️) ---
  const handleOpenEditModal = (br) => {
    setEditingBRId(br.id);
    setSelectedSupplier(br.supplierId.toString());
    setDeliveryNoteRef(br.deliveryNoteRef || "");

    // RÉTRO-CALCUL : Transformer la quantité absolue en Colis + Unités
    const mappedItems = br.items.map((item) => {
      const product = catalog.find((p) => p.id === item.productId);
      const nuc = product?.nuc || 1;
      const qtyColis = Math.floor(item.quantity / nuc);
      const qtyUnite = item.quantity % nuc;

      return {
        productId: item.productId.toString(),
        qtyColis: qtyColis,
        qtyUnite: qtyUnite,
        unitCost: item.unitCost,
      };
    });

    setOrderItems(mappedItems);
    setIsModalOpen(true);
    setDiscountType("amount"); // On repasse en fixe pour l'édition
    setDiscountValue(br.discount > 0 ? br.discount.toString() : "");
  };

  const handleOpenCreateModal = () => {
    setEditingBRId(null);
    setSelectedSupplier("");
    setDeliveryNoteRef("");
    setOrderItems([{ productId: "", qtyColis: 0, qtyUnite: 0, unitCost: 0 }]);
    setIsModalOpen(true);
    setDiscountType("amount");
    setDiscountValue("");
  };

  // --- CRÉATION / MODIFICATION BROUILLON ---
  const handleSaveDraft = async () => {
    if (!selectedSupplier || orderItems.length === 0)
      return toast.error("Complétez le bon avant de sauvegarder.");

    if (orderItems.some((i) => !i.productId))
      return toast.error("Veuillez sélectionner un produit pour chaque ligne.");

    setIsSubmitting(true);
    try {
      const formattedItems = orderItems.map((item) => {
        const prod = catalog.find((p) => p.id === Number(item.productId));
        const nuc = prod?.nuc || 1;
        const safeColis = Number(item.qtyColis) || 0;
        const safeUnite = Number(item.qtyUnite) || 0;
        const absoluteTotalQuantity = safeColis * nuc + safeUnite;
        return {
          productId: Number(item.productId),
          quantity: absoluteTotalQuantity,
          unitCost: parseFloat(item.unitCost) || 0,
        };
      });

      if (formattedItems.some((i) => i.quantity <= 0)) {
        setIsSubmitting(false);
        return toast.error(
          "La quantité totale d'une ligne ne peut pas être 0.",
        );
      }
      const totals = getCalculatedTotals();

      const payload = {
        supplierId: Number(selectedSupplier),
        deliveryNoteRef: deliveryNoteRef.trim() || null,
        items: formattedItems,
        discount: totals.discountAmount,
      };

      if (editingBRId) {
        // Mode Modification
        await api.put(`/cafe/stock/${editingBRId}`, payload);
        toast.success("Brouillon mis à jour");
      } else {
        // Mode Création
        await api.post("/cafe/stock", payload);
        toast.success("Bon créé en brouillon");
      }

      setIsModalOpen(false);
      setOrderItems([]);
      loadData();
    } catch (e) {
      toast.error("Erreur de sauvegarde du bon.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- WORKFLOW ACTIONS ---
  const handleValidate = async (id) => {
    if (
      !window.confirm(
        "Valider ce bon ? Le stock sera injecté immédiatement dans l'inventaire.",
      )
    )
      return;
    try {
      await api.patch(`/cafe/stock/${id}/validate`);
      toast.success("Stock injecté avec succès !");
      loadData();
    } catch (e) {
      toast.error("Erreur de validation");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce brouillon définitivement ?")) return;
    try {
      await api.delete(`/cafe/stock/${id}`);
      toast.success("Brouillon supprimé.");
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.message || "Erreur de suppression");
    }
  };

  const handleReturn = async (id) => {
    if (
      !window.confirm(
        "Créer un Bon de Retour ? Cela va SOUSTRAIRE ces produits du stock actuel.",
      )
    )
      return;
    try {
      await api.patch(`/cafe/stock/${id}/return`);
      toast.success("Bon de Retour créé ! Le stock a été déduit.");
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.message || "Erreur de retour.");
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm("Archiver ce bon de retour ?")) return;
    try {
      await api.patch(`/cafe/stock/${id}/archive`);
      toast.success("Bon archivé.");
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.message || "Erreur d'archivage.");
    }
  };

  const handleViewDetails = (reception) => {
    // On trouve les produits du catalogue pour lier les détails avant d'ouvrir
    const enrichedItems = reception.items.map((item) => {
      const prod = catalog.find((p) => p.id === item.productId);
      return { ...item, productName: prod?.name || "Produit Inconnu" };
    });
    setViewingBR({ ...reception, items: enrichedItems });
    setIsViewModalOpen(true);
  };
  // --- ENREGISTRER UN AJUSTEMENT DE STOCK (PERTES / CORRECTION) ---
  const handleSubmitAdjustment = async (e) => {
    e.preventDefault();
    const qty = parseInt(adjustData.quantity, 10);
    if (isNaN(qty) || qty <= 0)
      return toast.error("Veuillez saisir une quantité supérieure à 0.");
    if (!adjustData.reason.trim())
      return toast.error("Le motif d'ajustement est obligatoire.");

    setIsSubmitting(true);
    try {
      // Si c'est un retrait (minus), on envoie une quantité négative au serveur !
      const calculatedQty = adjustData.type === "minus" ? -qty : qty;

      await api.post("/cafe/stock/adjust", {
        productId: productToAdjust.id,
        quantity: calculatedQty,
        reason: adjustData.reason,
        username: user?.username || "System", // Nom du caissier connecté
      });

      toast.success("Ajustement de stock enregistré avec succès !");
      setIsAdjustModalOpen(false);
      setProductToAdjust(null);
      setAdjustData({ quantity: "", reason: "Périmé / Jeté", type: "minus" }); // Reset
      loadData(); // Rafraîchir les tableaux et les stats réelles !
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur d'ajustement.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* NAVIGATION TABS (Boutons solides comme dans SalonManager) */}
      <div className="flex border-b border-subtle bg-surface/50 -mt-8 -mx-8 px-8 mb-6">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex items-center gap-2 px-6 py-4 text-xs font-bold tracking-widest uppercase transition-all ${
            activeTab === "inventory"
              ? "border-b-2 border-brand text-brand bg-brand/5"
              : "text-t-muted hover:text-t-main"
          }`}
        >
          <Box size={16} /> État des Stocks
        </button>
        <button
          onClick={() => setActiveTab("receptions")}
          className={`flex items-center gap-2 px-6 py-4 text-xs font-bold tracking-widest uppercase transition-all ${
            activeTab === "receptions"
              ? "border-b-2 border-brand text-brand bg-brand/5"
              : "text-t-muted hover:text-t-main"
          }`}
        >
          <ClipboardList size={16} /> Bons de Réception
        </button>

        {/* --- NOUVEL ONGLET : HISTORIQUE DES PERTES --- */}
        <button
          onClick={() => setActiveTab("adjustments")}
          className={`flex items-center gap-2 px-6 py-4 text-xs font-bold tracking-widest uppercase transition-all ${
            activeTab === "adjustments"
              ? "border-b-2 border-brand text-brand bg-brand/5"
              : "text-t-muted hover:text-t-main"
          }`}
        >
          <History size={16} /> Historique des Pertes
        </button>
      </div>
      {/* STATS ROW */}
      {stockStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ColorfulStatCard
            label="Valeur du Stock"
            value={`DZD ${stockStats.totalInventoryValue.toFixed(2)}`}
            icon={Coins}
            colorTheme="emerald"
          />
          <ColorfulStatCard
            label="Dépenses d'Achat (Mois)"
            value={`DZD ${stockStats.monthlySpend.toFixed(2)}`}
            icon={TrendingDown}
            colorTheme="indigo"
          />
          <ColorfulStatCard
            label="Articles en Rupture"
            value={stockStats.outOfStockCount}
            icon={AlertOctagon}
            colorTheme="rose"
          />
          <ColorfulStatCard
            label="Articles Faibles"
            value={stockStats.lowStockCount}
            icon={AlertTriangle}
            colorTheme="amber"
          />
        </div>
      )}

      {/* HEADER ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-6 bg-surface border border-subtle shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-t-main flex items-center gap-2">
            {activeTab === "inventory"
              ? "Inventaire Réel"
              : "Gestion Documentaire"}
          </h2>
          <p className="text-t-muted text-sm mt-1">
            {activeTab === "inventory"
              ? "État actuel des marchandises en magasin."
              : "Créez et gérez vos bons d'achats fournisseurs."}
          </p>
        </div>

        {activeTab === "receptions" && (
          <Button
            variant="success"
            onClick={handleOpenCreateModal}
            className="py-3 px-6 text-sm"
          >
            <Plus size={18} /> Nouveau Bon de Réception
          </Button>
        )}

        {activeTab === "inventory" && (
          <div className="relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-t-muted"
            />
            <input
              placeholder="Chercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-main border border-subtle text-t-main px-4 py-3 pl-10 text-sm font-bold w-64 focus:outline-none focus:border-brand shadow-inner"
            />
          </div>
        )}
      </div>

      {/* INVENTORY OR RECEPTIONS TABLE */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-brand space-y-4">
          <RefreshCcw className="w-10 h-10 animate-spin" />
          <span className="font-bold text-lg">
            Chargement de la base de données...
          </span>
        </div>
      ) : activeTab === "inventory" ? (
        <DataTable
          headers={[
            { label: "Référence" },
            { label: "Produit" },
            { label: "Catégorie" },
            { label: "NUC" },
            { label: "Stock Disponible" },
            { label: "Status" },
            { label: "Actions", align: "right" },
          ]}
        >
          {catalog
            .filter((p) =>
              p.name.toLowerCase().includes(searchTerm.toLowerCase()),
            )
            .map((p) => (
              <tr
                key={p.id}
                className="border-b border-subtle hover:bg-brand/5 transition-colors"
              >
                <td className="px-6 py-4 font-mono font-bold text-sm text-t-muted">
                  {p.reference || "--"}
                </td>
                <td className="px-6 py-4 font-bold text-t-main text-sm">
                  {p.name}
                </td>
                <td className="px-6 py-4">
                  <span className="bg-main border border-subtle px-2 py-1 text-xs font-bold text-t-muted uppercase">
                    {p.category?.name}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-sm font-bold text-t-muted">
                  x{p.nuc}
                </td>
                <td className="px-6 py-4">
                  {formatStock(
                    p.stock,
                    p.nuc,
                    p.packagingUnit?.name,
                    p.isTracked,
                  )}
                </td>
                <td className="px-6 py-4">
                  {!p.isTracked ? (
                    <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-600 border border-blue-500/20 font-bold text-xs shadow-sm">
                      Service
                    </span>
                  ) : p.stock <= 0 ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/10 text-red-600 border border-red-500/20 font-bold text-xs shadow-sm">
                      <AlertTriangle size={12} /> Rupture
                    </span>
                  ) : p.stock < p.nuc * 2 ? (
                    <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold text-xs shadow-sm">
                      Stock Faible
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 bg-green-500/10 text-green-600 border border-green-500/20 font-bold text-xs shadow-sm">
                      Disponible
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setProductToAdjust(p);
                      setIsAdjustModalOpen(true);
                    }}
                    className="py-1 px-3 text-xs bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white transition-colors"
                    title="Ajuster manuellement le stock de ce produit (Perte, Casse, Inventaire)"
                  >
                    <Sliders size={14} className="mr-1" /> Ajuster
                  </Button>
                </td>
              </tr>
            ))}
        </DataTable>
      ) : activeTab === "inventory" ? (
        <DataTable
          headers={[
            { label: "Date" },
            { label: "Réf Picasso" },
            { label: "N° Facture/BL" },
            { label: "Fournisseur" },
            { label: "Total Net" },
            { label: "Statut" },
            { label: "Actions", align: "right" },
          ]}
        >
          {receptions.length === 0 ? (
            <tr>
              <td
                colSpan="7"
                className="text-center py-12 text-t-muted font-bold text-lg border border-subtle border-dashed bg-surface"
              >
                Aucun Bon de Réception.
              </td>
            </tr>
          ) : (
            receptions.map((r) => (
              <tr
                key={r.id}
                className="border-b border-subtle hover:bg-brand/5 transition-colors"
              >
                <td className="px-6 py-4 text-xs font-mono font-bold text-t-muted">
                  {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-6 py-4 font-mono font-bold text-sm text-t-main">
                  {r.refNumber}
                </td>
                <td className="px-6 py-4 font-mono font-bold text-sm text-t-muted">
                  {r.deliveryNoteRef || "--"}
                </td>
                <td className="px-6 py-4 font-bold text-t-main text-sm uppercase">
                  {r.supplier?.name}
                </td>
                <td className="px-6 py-4 font-mono font-bold text-lg text-brand">
                  DZD {r.totalCost.toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-3 py-1 font-bold text-xs shadow-sm border ${
                      r.status === "validated"
                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                        : r.status === "returned"
                          ? "bg-red-500/10 text-red-600 border-red-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    }`}
                  >
                    {r.status === "validated"
                      ? "Validé"
                      : r.status === "returned"
                        ? "Retourné"
                        : "Brouillon"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleViewDetails(r)}
                    className="py-1 px-3 text-xs bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white transition-colors"
                  >
                    <Eye size={16} /> Voir
                  </Button>

                  {r.status === "draft" && (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => handleOpenEditModal(r)}
                        className="py-1 px-3 text-xs bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500 hover:text-white transition-colors"
                      >
                        <Edit size={16} /> Éditer
                      </Button>
                      <Button
                        variant="success"
                        onClick={() => handleValidate(r.id)}
                        className="py-1 px-3 text-xs shadow-md"
                        title="Valider et injecter le stock"
                      >
                        <FileCheck size={16} /> Valider
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDelete(r.id)}
                        className="py-1 px-3 text-xs bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </>
                  )}

                  {r.status === "validated" && (
                    <Button
                      variant="danger"
                      onClick={() => handleReturn(r.id)}
                      className="py-1 px-3 text-xs bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <RefreshCcw size={14} className="mr-1" /> Retour
                      Fournisseur
                    </Button>
                  )}
                  {r.status === "returned" && (
                    <Button
                      variant="secondary"
                      onClick={() => handleArchive(r.id)}
                      className="py-1 px-3 text-xs bg-slate-500/10 text-slate-500 border-slate-500/30 hover:bg-slate-500 hover:text-white transition-colors"
                      title="Archiver"
                    >
                      <Trash2 size={16} /> Archiver
                    </Button>
                  )}
                </td>
              </tr>
            ))
          )}
        </DataTable>
      ) : (
        // --- NOUVEAU TABLEAU : JOURNAL DES PERTES / AJUSTEMENTS ---
        <DataTable
          headers={[
            { label: "Date de l'opération" },
            { label: "Produit" },
            { label: "Ajustement (Qté)" },
            { label: "Motif / Raison" },
            { label: "Opérateur" },
          ]}
        >
          {adjustments.length === 0 ? (
            <tr>
              <td
                colSpan="5"
                className="text-center py-12 text-t-muted border border-subtle border-dashed bg-surface font-bold text-lg"
              >
                Aucun ajustement enregistré.
              </td>
            </tr>
          ) : (
            adjustments.map((adj) => (
              <tr
                key={adj.id}
                className="border-b border-subtle hover:bg-brand/5 transition-colors"
              >
                <td className="px-6 py-4 text-xs font-mono font-bold text-t-muted">
                  {new Date(adj.createdAt).toLocaleDateString("fr-FR")} à{" "}
                  {new Date(adj.createdAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-6 py-4 font-bold text-t-main text-sm uppercase">
                  {adj.product?.name}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-3 py-1 font-mono font-bold text-xs border rounded-none shadow-sm ${
                      adj.quantity < 0
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-green-500/10 text-green-500 border-green-500/20"
                    }`}
                  >
                    {adj.quantity > 0 ? "+" : ""}
                    {adj.quantity} unités
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-t-muted font-bold uppercase">
                  {adj.reason}
                </td>
                <td className="px-6 py-4 text-xs font-bold text-t-main uppercase">
                  {adj.adjustedBy}
                </td>
              </tr>
            ))
          )}
        </DataTable>
      )}

      {/* --- MODAL 1: VIEW DETAILS --- */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)}>
        {viewingBR && (
          <div className="p-8">
            <div className="flex justify-between items-start border-b border-subtle pb-4 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-t-main uppercase tracking-widest">
                  {viewingBR.refNumber}
                </h3>
                <p className="text-sm text-t-muted font-bold mt-1">
                  Fournisseur :{" "}
                  <span className="text-t-main">
                    {viewingBR.supplier?.name}
                  </span>
                </p>
                {viewingBR.deliveryNoteRef && (
                  <p className="text-sm text-brand font-mono font-bold mt-1">
                    N° BL : {viewingBR.deliveryNoteRef}
                  </p>
                )}
              </div>
              <span
                className={`px-4 py-2 font-bold uppercase border shadow-sm ${
                  viewingBR.status === "validated"
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : viewingBR.status === "returned"
                      ? "bg-red-500/10 text-red-600 border-red-500/20"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                }`}
              >
                {viewingBR.status === "validated"
                  ? "Validé"
                  : viewingBR.status === "returned"
                    ? "Retourné"
                    : "Brouillon"}
              </span>
            </div>

            <div className="max-h-[50vh] overflow-y-auto space-y-2 mb-6 pr-2">
              {viewingBR.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-main border border-subtle p-3 shadow-sm"
                >
                  <div>
                    <p className="font-bold text-t-main uppercase text-sm">
                      {item.productName}
                    </p>
                    <p className="text-xs text-t-muted font-mono font-bold mt-1">
                      {item.quantity} unités x DZD {item.unitCost.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-mono font-bold text-lg text-t-main">
                    DZD {(item.quantity * item.unitCost).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {viewingBR.discount > 0 && (
              <div className="flex justify-between items-center p-3 mb-2 text-amber-500 border border-amber-500/30 bg-amber-500/10">
                <span className="font-bold uppercase tracking-widest text-xs">
                  Remise Fournisseur Appliquée
                </span>
                <span className="font-mono font-bold text-lg">
                  - DZD {viewingBR.discount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center bg-surface p-4 border border-brand shadow-inner">
              <span className="font-bold text-t-muted uppercase text-sm tracking-widest">
                Total Net Facturé
              </span>
              <span className="text-3xl font-mono font-bold text-brand">
                DZD {viewingBR.totalCost.toFixed(2)}
              </span>
            </div>

            <div className="mt-8">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setIsViewModalOpen(false)}
                className="font-bold py-4"
              >
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* --- MODAL 2: CREATE / EDIT DRAFT --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
      >
        <div className="p-8 max-h-[90vh] overflow-y-auto">
          <h3 className="text-2xl font-bold text-t-main mb-6 border-b border-subtle pb-4">
            {editingBRId ? "Modifier le Brouillon" : "Nouveau Bon de Réception"}
          </h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface p-4 border border-subtle shadow-sm">
              <div>
                <label className="block text-xs font-bold text-t-muted mb-2">
                  Fournisseur *
                </label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full bg-main border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand font-bold"
                >
                  <option value="">-- Choisir --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Input
                  label="N° Facture Papier (BL)"
                  value={deliveryNoteRef}
                  onChange={(e) => setDeliveryNoteRef(e.target.value)}
                  placeholder="ex: BL-4092"
                />
              </div>
            </div>

            <div className="space-y-3 bg-surface border border-subtle p-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-subtle pb-3 mb-3">
                <span className="text-sm font-bold text-t-main uppercase">
                  Détails des Articles
                </span>
                <Button
                  variant="success"
                  onClick={addLine}
                  disabled={orderItems.length >= catalog.length}
                  className="text-xs py-2 px-4 shadow-md"
                  title={
                    orderItems.length >= catalog.length
                      ? "Catalogue entier ajouté"
                      : "Ajouter ligne"
                  }
                >
                  <Plus size={14} className="mr-1" /> Ajouter Ligne
                </Button>
              </div>

              {orderItems.map((item, index) => {
                const selectedProduct = catalog.find(
                  (p) => p.id === Number(item.productId),
                );
                const colisName =
                  selectedProduct?.packagingUnit?.name || "Colis";
                const nuc = selectedProduct?.nuc || 1;
                const safeColis = Number(item.qtyColis) || 0;
                const safeUnite = Number(item.qtyUnite) || 0;
                const totalQty = safeColis * nuc + safeUnite;

                return (
                  <div
                    key={index}
                    className="flex flex-col gap-2 border-b border-subtle pb-4 mb-2"
                  >
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold uppercase text-t-muted mb-1">
                          Produit
                        </label>
                        <select
                          value={item.productId}
                          onChange={(e) =>
                            updateLine(index, "productId", e.target.value)
                          }
                          className="w-full bg-main border border-subtle text-t-main px-3 py-2 text-xs font-bold focus:outline-none focus:border-brand"
                        >
                          <option value="">Sélectionner un produit...</option>
                          {catalog.map((p) => {
                            const isAlreadySelected = orderItems.some(
                              (otherItem, otherIndex) =>
                                otherIndex !== index &&
                                otherItem.productId === p.id.toString(),
                            );
                            if (isAlreadySelected) return null;
                            return (
                              <option key={p.id} value={p.id}>
                                {p.reference ? `[${p.reference}] ` : ""}
                                {p.name}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <Button
                        variant="danger"
                        onClick={() => removeLine(index)}
                        className="p-2 bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>

                    {selectedProduct && (
                      <div className="flex items-end gap-2 bg-main p-3 border border-subtle shadow-inner">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-brand uppercase mb-1">
                            Qté {colisName}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.qtyColis}
                            onChange={(e) =>
                              updateLine(index, "qtyColis", e.target.value)
                            }
                            className="w-full bg-surface border border-subtle text-t-main px-3 py-2 font-bold font-mono text-sm focus:outline-none focus:border-brand"
                          />
                        </div>
                        <div className="pb-3 text-t-muted font-bold text-sm">
                          × {nuc} +
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-brand uppercase mb-1">
                            Qté Unité(s)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.qtyUnite}
                            onChange={(e) =>
                              updateLine(index, "qtyUnite", e.target.value)
                            }
                            className="w-full bg-surface border border-subtle text-t-main px-3 py-2 font-bold font-mono text-sm focus:outline-none focus:border-brand"
                          />
                        </div>
                        <div className="pb-3 text-t-muted font-bold text-sm">
                          =
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-t-muted uppercase mb-1">
                            Total Absolu
                          </label>
                          <div className="w-full bg-surface border border-subtle text-t-muted px-3 py-2 text-sm font-mono font-bold text-center">
                            {totalQty}
                          </div>
                        </div>
                        <div className="flex-1 ml-2 border-l border-subtle pl-2">
                          <label className="block text-[10px] font-bold text-brand uppercase mb-1">
                            Coût Unitaire
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) =>
                              updateLine(index, "unitCost", e.target.value)
                            }
                            className="w-full bg-surface border border-brand/50 text-t-main px-3 py-2 font-bold font-mono text-sm focus:outline-none focus:border-brand"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-subtle space-y-4">
              {/* --- SECTION REMISE --- */}
              <div className="flex justify-between items-center bg-brand/10 p-3 border border-brand/30 shadow-inner">
                <span className="text-sm font-bold text-brand flex items-center gap-2">
                  <Tag size={16} /> Remise Fournisseur
                </span>
                <div className="flex gap-2">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="bg-surface border border-subtle text-t-main text-xs font-bold uppercase focus:outline-none px-2"
                  >
                    <option value="amount">DZD</option>
                    <option value="percent">%</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-24 bg-surface border border-subtle text-t-main text-right font-mono font-bold text-sm focus:outline-none px-2"
                  />
                </div>
              </div>

              {/* --- TOTAUX --- */}
              <div className="flex justify-between items-end bg-surface p-4 border border-subtle">
                <div>
                  <div className="flex gap-4 text-xs font-bold text-t-muted mb-1">
                    <span>
                      Sous-total: {getCalculatedTotals().subTotal.toFixed(2)}
                    </span>
                    {getCalculatedTotals().discountAmount > 0 && (
                      <span className="text-amber-500">
                        - Remise:{" "}
                        {getCalculatedTotals().discountAmount.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-mono font-bold text-brand leading-none mt-2">
                    Total: DZD {getCalculatedTotals().grandTotal.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="py-4 font-bold"
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleSaveDraft}
                    disabled={isSubmitting}
                    className="py-4 font-bold shadow-lg"
                  >
                    {isSubmitting
                      ? "Enregistrement..."
                      : editingBRId
                        ? "Mettre à jour"
                        : "Sauvegarder Brouillon"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
      {/* --- MODAL 3 : ENREGISTRER UN AJUSTEMENT DE STOCK --- */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => !isSubmitting && setIsAdjustModalOpen(false)}
      >
        {productToAdjust && (
          <form onSubmit={handleSubmitAdjustment} className="p-8">
            <h3 className="text-xl font-serif font-bold text-brand uppercase border-b border-subtle pb-4 mb-6">
              Ajustement Manuel d'Inventaire
            </h3>

            <div className="bg-main border border-subtle p-4 mb-6 flex justify-between items-center shadow-inner">
              <div>
                <p className="text-[10px] uppercase font-bold text-t-muted">
                  Produit à ajuster
                </p>
                <p className="font-bold text-t-main uppercase text-sm">
                  {productToAdjust.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-t-muted">
                  Stock Actuel
                </p>
                <p className="font-mono font-bold text-lg text-brand">
                  {productToAdjust.stock} unités
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Type d'opération (Boutons solides + haptiques tactiles) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-t-muted mb-2">
                  Type d'ajustement
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={adjustData.type === "minus" ? "danger" : "outline"}
                    onClick={() =>
                      setAdjustData({ ...adjustData, type: "minus" })
                    }
                    className="flex-1 py-3"
                  >
                    <Minus size={14} className="mr-1" /> Retrait (Perte / Casse
                    / Usage)
                  </Button>
                  <Button
                    type="button"
                    variant={adjustData.type === "plus" ? "success" : "outline"}
                    onClick={() =>
                      setAdjustData({ ...adjustData, type: "plus" })
                    }
                    className="flex-1 py-3"
                  >
                    <Plus size={14} className="mr-1" /> Ajout (Inventaire
                    correction)
                  </Button>
                </div>
              </div>

              {/* Quantité d'unités */}
              <Input
                label="Nombre d'unités réelles à ajuster *"
                type="number"
                min="1"
                value={adjustData.quantity}
                onChange={(e) =>
                  setAdjustData({ ...adjustData, quantity: e.target.value })
                }
                required
                placeholder="Ex: 5"
                autoFocus
              />

              {/* Motif de l'ajustement */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-t-muted mb-2">
                  Motif de l'ajustement *
                </label>
                <select
                  value={adjustData.reason}
                  onChange={(e) =>
                    setAdjustData({ ...adjustData, reason: e.target.value })
                  }
                  className="w-full bg-main border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand font-bold text-xs uppercase"
                  required
                >
                  <option value="Périmé / Jeté">
                    Périmé / Jeté (DLC courte)
                  </option>
                  <option value="Casse / Verre brisé">
                    Casse / Bouteille brisée
                  </option>
                  <option value="Consommation interne (Staff)">
                    Consommation interne (Barista / Staff)
                  </option>
                  <option value="Consommation interne (Bar/Service)">
                    Consommation Bar (Gobelets, Sucres, Pailles)
                  </option>
                  <option value="Correction d'inventaire physique">
                    Correction de comptage d'inventaire
                  </option>
                </select>
              </div>

              {/* Pied de la modale */}
              <div className="grid grid-cols-2 gap-4 pt-6 mt-6 border-t border-subtle">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  variant={adjustData.type === "minus" ? "danger" : "success"}
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Enregistrement..."
                    : "Confirmer l'Ajustement"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
