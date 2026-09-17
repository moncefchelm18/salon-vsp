import React, { useState, useEffect, useMemo } from "react";
import {
  Coffee,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Wallet,
  Plus,
  Clock,
  Flame,
  ArrowRight,
  ArrowUpRight,
  Receipt,
  Layers,
  Sparkles,
  HelpCircle,
  RefreshCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import api from "../../../utils/api";

import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import Input from "../../../components/common/Input";

const formatMoney = (val) => {
  const num = Number(val);
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

// Tooltip sombre pour la courbe horaire
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950 border border-amber-500/40 p-2.5 shadow-2xl rounded-none">
        <p className="font-bold text-amber-400 uppercase tracking-widest text-[10px] mb-1">
          Heure : {label}
        </p>
        <p className="font-mono text-slate-100 font-bold text-xs">
          Ventes Café :{" "}
          <span className="text-[#00ff00]">
            DZD {formatMoney(payload[0].value)}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export default function CafeDashboard() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [reportsData, setReportsData] = useState(null);
  const [ceoData, setCeoData] = useState(null);
  const [currentTill, setCurrentTill] = useState(null);
  const [categories, setCategories] = useState([]);

  // Modale d'ajout rapide d'un article au menu
  const [isQuickProductModalOpen, setIsQuickProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductCategoryId, setNewProductCategoryId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [repRes, ceoRes, tillRes, catRes] = await Promise.all([
        api.get("/cafe/reports?period=today"),
        api.get("/reports/ceo?period=today"),
        api.get("/caisse/current"),
        api.get("/cafe/categories"),
      ]);

      setReportsData(repRes.data);
      setCeoData(ceoRes.data);
      setCurrentTill(tillRes.data);
      setCategories(catRes.data);

      if (catRes.data.length > 0 && !newProductCategoryId) {
        setNewProductCategoryId(catRes.data[0].id.toString());
      }
    } catch (error) {
      console.error("Erreur de synchronisation dashboard café:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 8000);
    return () => clearInterval(interval);
  }, []);

  // ── AJOUT RAPIDE D'UN PRODUIT DEPUIS LE DASHBOARD ──
  const handleQuickAddProduct = async (e) => {
    e.preventDefault();
    if (!newProductName.trim() || !newProductPrice || !newProductCategoryId) {
      return toast.error("Veuillez remplir tous les champs.");
    }

    setIsSubmitting(true);
    try {
      await api.post("/cafe/products", {
        name: newProductName.trim(),
        price: parseFloat(newProductPrice),
        categoryId: Number(newProductCategoryId),
      });
      toast.success(`${newProductName} ajouté au menu !`);
      setNewProductName("");
      setNewProductPrice("");
      setIsQuickProductModalOpen(false);
      loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur de création.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const s = reportsData?.summary;
  const c = ceoData?.caisse;
  const r = ceoData?.revenue;
  const topProducts = reportsData?.charts?.topProductsData || [];
  const timelineData = reportsData?.charts?.timelineData || [];
  const recentHistory = reportsData?.history || [];

  const cafeNetRevenue = s?.totalNetRevenue || r?.totalCafeRevenue || 0;
  const cafeOrdersCount = s?.totalOrders || r?.cafeOrdersCount || 0;
  const averageTicket =
    cafeOrdersCount > 0 ? cafeNetRevenue / cafeOrdersCount : 0;
  const sharedCaisseExpected =
    currentTill?.expectedCash || c?.expectedCaisse || 0;

  return (
    <div className="space-y-6 max-w-full select-none">
      {/* ══════════════════════════════════════════════════════════════
          1. EN-TÊTE & BARRE D'ACTIONS RAPIDES (QUICK ACTIONS)
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-center bg-surface border border-subtle p-5 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-t-main uppercase tracking-widest flex items-center gap-2">
            <Coffee className="text-amber-500" size={24} /> Tableau de Bord
            Espace Cafétéria
          </h2>
          <p className="text-xs font-bold text-t-muted uppercase tracking-wider mt-1">
            Activité commerciale du jour, ventes comptoir et trésorerie
          </p>
        </div>

        {/* RACCOURCIS D'ACTION 1-CLIC */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/administration/cafe/commandes")}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md rounded-none cursor-pointer transition-all active:scale-95"
          >
            <ShoppingCart size={16} /> Nouvelle Commande (Caisse Rapide)
          </button>

          <button
            type="button"
            onClick={() => setIsQuickProductModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-main hover:bg-subtle text-t-main border border-subtle font-bold text-xs uppercase tracking-wider rounded-none cursor-pointer transition-all"
          >
            <Plus size={15} className="text-amber-400" /> Ajouter Article
          </button>

          <button
            type="button"
            onClick={() => navigate("/administration/cafe/caisse")}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-main hover:bg-subtle text-t-main border border-subtle font-bold text-xs uppercase tracking-wider rounded-none cursor-pointer transition-all"
          >
            <Wallet size={15} className="text-green-400" /> Trésorerie
          </button>

          <button
            type="button"
            onClick={() => navigate("/administration/cafe/rapports")}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-main hover:bg-subtle text-t-main border border-subtle font-bold text-xs uppercase tracking-wider rounded-none cursor-pointer transition-all"
          >
            <Receipt size={15} /> Journal Ventes
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          2. LES 4 MAIN KPI CARDS
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1 : CA CAFÉ AUJOURD'HUI */}
        <div className="bg-surface border-l-4 border-l-amber-500 border border-subtle p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-t-muted block mb-1">
                Recette Café (Aujourd'hui)
              </span>
              <p className="text-3xl font-mono font-bold text-amber-400">
                DZD {formatMoney(cafeNetRevenue)}
              </p>
            </div>
            <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign size={20} />
            </div>
          </div>
          <span className="text-[9px] font-mono font-bold text-t-muted block mt-2">
            Comptoir + Boissons sur factures salon
          </span>
        </div>

        {/* CARD 2 : NOMBRE DE COMMANDES */}
        <div className="bg-surface border-l-4 border-l-brand border border-subtle p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-t-muted block mb-1">
                Commandes Encaissées
              </span>
              <p className="text-3xl font-mono font-bold text-t-main">
                {cafeOrdersCount}
              </p>
            </div>
            <div className="p-2 bg-brand/10 text-brand border border-brand/20">
              <ShoppingCart size={20} />
            </div>
          </div>
          <span className="text-[9px] text-t-muted uppercase font-bold block mt-2">
            Volume de passages enregistrés
          </span>
        </div>

        {/* CARD 3 : PANIER MOYEN BOISSON */}
        <div className="bg-surface border-l-4 border-l-green-500 border border-subtle p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-t-muted block mb-1">
                Panier Moyen Boisson
              </span>
              <p className="text-3xl font-mono font-bold text-green-400">
                DZD {formatMoney(averageTicket)}
              </p>
            </div>
            <div className="p-2 bg-green-500/10 text-green-400 border border-green-500/20">
              <TrendingUp size={20} />
            </div>
          </div>
          <span className="text-[9px] text-t-muted uppercase font-bold block mt-2">
            Moyenne dépensée par commande
          </span>
        </div>

        {/* CARD 4 : TIROIR-CAISSE PHYSIQUE PARTAGÉ */}
        <div className="bg-surface border-l-4 border-l-blue-500 border border-subtle p-5 shadow-sm bg-[#0a0a0a]">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                Tiroir-Caisse Partagé
              </span>
              <p className="text-3xl font-mono font-black text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.4)]">
                DZD {formatMoney(sharedCaisseExpected)}
              </p>
            </div>
            <div className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Wallet size={20} />
            </div>
          </div>
          <div className="flex justify-between items-center mt-2 border-t border-slate-800 pt-1 text-[9px]">
            <span className="text-slate-400 uppercase font-bold">
              Statut Tiroir :
            </span>
            <span className="font-mono font-bold text-green-400">
              {currentTill ? "Ouvert & Prêt" : "Fermé"}
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          3. COURBE DES VENTES HORAIRES & TOP PRODUITS DU JOUR
      ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COURBE DES VENTES PAR HEURE (8 Cols) */}
        <div className="lg:col-span-8 bg-surface border border-subtle p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-subtle pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2">
                <Clock size={16} /> Ventes du Jour par Heure (Rythme de
                Consommation)
              </h3>
              <p className="text-[10px] text-t-muted font-bold uppercase mt-0.5">
                Suivi des pics d'activité (Matin, pause déjeuner, après-midi)
              </p>
            </div>
          </div>

          <div className="w-full h-[280px]">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-amber-500 animate-pulse uppercase text-xs font-bold">
                Chargement des ventes horaires...
              </div>
            ) : timelineData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-t-muted font-bold text-xs uppercase border border-dashed border-subtle">
                Aucune vente enregistrée aujourd'hui
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timelineData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCafe" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--theme-subtle)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    tick={{ fontSize: 10, fill: "#ffffff" }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fontSize: 10, fill: "#ffffff" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="Entrées"
                    name="CA Ventes (DA)"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCafe)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* TOP PRODUITS AUJOURD'HUI (4 Cols) */}
        <div className="lg:col-span-4 bg-surface border border-subtle p-6 shadow-sm flex flex-col justify-between">
          <div className="border-b border-subtle pb-3 mb-4 flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
              <Flame size={16} /> Top Produits du Jour
            </h3>
            <span className="text-[9px] text-t-muted font-bold uppercase">
              Bestsellers
            </span>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[280px] pr-1">
            {topProducts.length === 0 ? (
              <div className="py-12 text-center text-t-muted text-xs uppercase font-bold border border-dashed border-subtle">
                Aucun article vendu aujourd'hui
              </div>
            ) : (
              topProducts.slice(0, 5).map((prod, idx) => (
                <div
                  key={idx}
                  className="bg-main border border-subtle p-3 flex justify-between items-center"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[9px] font-mono font-bold text-amber-500 block mb-0.5">
                      #{idx + 1}
                    </span>
                    <p className="font-bold text-t-main text-xs uppercase truncate">
                      {prod.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold">
                      {prod.Quantité} vendus
                    </span>
                    <span className="block text-[9px] font-mono text-t-muted mt-0.5">
                      {formatMoney(prod.Revenu || 0)} DA
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          4. DERNIÈRES COMMANDES LIVE & GESTION RAPIDE
      ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* DERNIÈRES COMMANDES LIVE (8 Cols) */}
        <div className="lg:col-span-8 bg-surface border border-subtle p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-subtle pb-3 mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2">
              <Receipt size={16} /> Dernières Ventes Comptoir (Live)
            </h3>
            <Button
              variant="ghost"
              onClick={() => navigate("/administration/cafe/commandes")}
              className="text-xs font-bold text-amber-400 hover:text-amber-300"
            >
              Caisse Tactile <ArrowRight size={14} className="ml-1" />
            </Button>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
            {recentHistory.length === 0 ? (
              <div className="py-12 text-center text-t-muted text-xs uppercase font-bold border border-dashed border-subtle">
                Aucune commande enregistrée aujourd'hui
              </div>
            ) : (
              recentHistory.slice(0, 5).map((o) => (
                <div
                  key={o.id}
                  className="bg-main border border-subtle p-3 flex justify-between items-center hover:border-amber-500/40 transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono font-bold text-[10px] text-amber-500">
                        #CMD-{o.id}
                      </span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 bg-green-500/10 text-green-400 border border-green-500/20">
                        Payé (Espèces)
                      </span>
                    </div>
                    <p className="text-[10px] text-t-muted uppercase font-bold">
                      {o.itemsCount || 1} article(s) •{" "}
                      <span className="text-slate-300 font-mono">
                        {new Date(o.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                  </div>

                  <span className="text-sm font-bold font-mono text-green-400">
                    DZD {formatMoney(o.total)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RÉCAPITULATIF CAISSE COMMUNE & CONTRIBUTION CAFÉ (4 Cols) */}
        <div className="lg:col-span-4 bg-surface border-2 border-amber-500/50 p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="border-b border-subtle pb-3 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2">
                <Wallet size={16} /> Récapitulatif Caisse Commune
              </h3>
              <p className="text-[10px] text-t-muted uppercase font-bold mt-0.5">
                Ventilation de la trésorerie partagée
              </p>
            </div>

            {/* BOX 1 : CONTRIBUTION CAFÉ */}
            <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 mb-3">
              <span className="text-[9px] uppercase font-bold text-amber-400 tracking-wider block mb-1">
                ☕ Votre Contribution Cafétéria :
              </span>
              <p className="text-2xl font-mono font-bold text-amber-400">
                DZD {formatMoney(cafeNetRevenue)}
              </p>
              <span className="text-[8px] text-slate-400 block mt-1">
                Total des ventes boissons injectées en caisse
              </span>
            </div>

            {/* BOX 2 : TIROIR PHYSIQUE PARTAGÉ */}
            <div className="bg-[#0a0a0a] border-2 border-slate-800 p-3.5 shadow-inner">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                🤝 Espèces Totales dans le Tiroir :
              </span>
              <p className="text-2xl font-mono font-black text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.4)]">
                DZD {formatMoney(sharedCaisseExpected)}
              </p>
              <span className="text-[8px] text-slate-500 block mt-1">
                Fond + Ventes Salon + Ventes Café - Retraits
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-subtle text-[9px] text-t-muted leading-relaxed mt-4">
            <span className="text-amber-500 font-bold uppercase">
              Note Associés :
            </span>{" "}
            Le tiroir métallique est partagé avec le salon de coiffure. Votre
            part nette réelle sera calculée lors du Bilan.
          </div>
        </div>
      </div>

      {/* ── MODALE CRÉATION ARTICLE RAPIDE (3 CHAMPS) ── */}
      <Modal
        isOpen={isQuickProductModalOpen}
        onClose={() => setIsQuickProductModalOpen(false)}
      >
        <form
          onSubmit={handleQuickAddProduct}
          className="p-8 bg-surface rounded-none"
        >
          <h3 className="text-lg font-serif font-bold text-amber-500 mb-6 uppercase tracking-wider text-center border-b border-subtle pb-4">
            Ajout Rapide d'un Article au Menu
          </h3>

          <div className="space-y-4">
            <Input
              label="Nom de l'Article *"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              placeholder="Ex: Café Noisette, Jus d'Orange, Cookie"
              autoFocus
              required
            />

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-t-muted mb-2">
                Catégorie *
              </label>
              <select
                value={newProductCategoryId}
                onChange={(e) => setNewProductCategoryId(e.target.value)}
                className="w-full bg-main border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand font-bold text-xs uppercase rounded-none cursor-pointer"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Prix de Vente Client (DZD) *"
              type="number"
              step="10"
              value={newProductPrice}
              onChange={(e) => setNewProductPrice(e.target.value)}
              placeholder="Ex: 200"
              required
            />

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-subtle mt-6">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsQuickProductModalOpen(false)}
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
                {isSubmitting ? "Enregistrement..." : "Ajouter au Menu"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
