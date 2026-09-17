import React, { useState, useEffect, useMemo } from "react";
import {
  Scissors,
  Users,
  Clock,
  DollarSign,
  Plus,
  RefreshCcw,
  TrendingUp,
  Wallet,
  Coffee,
  Crown,
  Award,
  Flame,
  ArrowUpRight,
  ArrowRight,
  Receipt,
  ShoppingCart,
  CheckCircle,
  Trophy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import api from "../../utils/api";

import Button from "../common/Button";
import Modal from "../common/Modal";
import Input from "../common/Input";

const formatMoney = (val) => {
  const num = Number(val);
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

// Tooltip sombre pour le graphique d'affluence
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950 border border-brand/40 p-2.5 shadow-2xl rounded-none">
        <p className="font-bold text-brand uppercase tracking-widest text-[10px] mb-1">
          {label}
        </p>
        <p className="font-mono text-slate-100 font-bold text-xs">
          Coupes réalisées :{" "}
          <span className="text-blue-400">{payload[0].value}</span>
        </p>
        {payload[1] && (
          <p className="font-mono text-slate-100 font-bold text-xs">
            CA Heure :{" "}
            <span className="text-green-400">
              {formatMoney(payload[1].value)} DA
            </span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function ReceptionistDashboard() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [barbers, setBarbers] = useState([]);
  const [liveTickets, setLiveTickets] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [ceoData, setCeoData] = useState(null);
  const [currentTill, setCurrentTill] = useState(null);

  // Modale Ticket Rapide
  const [isQuickTicketModalOpen, setIsQuickTicketModalOpen] = useState(false);
  const [quickClientName, setQuickClientName] = useState("");
  const [quickBarberId, setQuickBarberId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAllData = async () => {
    try {
      const [dashRes, ceoRes, tillRes, barbersRes, liveRes] = await Promise.all(
        [
          api.get("/reports/dashboard?period=today"),
          api.get("/reports/ceo?period=today"),
          api.get("/caisse/current"),
          api.get("/barbers"),
          api.get("/tickets/live"),
        ],
      );

      setDashboardData(dashRes.data);
      setCeoData(ceoRes.data);
      setCurrentTill(tillRes.data);
      setBarbers(barbersRes.data);
      setLiveTickets(liveRes.data);
    } catch (error) {
      console.error("Erreur de synchronisation dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 8000);
    return () => clearInterval(interval);
  }, []);

  // ── CRÉATION RAPIDE D'UN TICKET DEPUIS LE DASHBOARD ──
  const handleQuickCreateTicket = async (e) => {
    e.preventDefault();
    if (!quickBarberId)
      return toast.error("Veuillez sélectionner un coiffeur.");

    setIsSubmitting(true);
    try {
      await api.post("/tickets", {
        clientName: quickClientName.trim() || "Client Standard",
        barberId: Number(quickBarberId),
      });
      toast.success("Ticket imprimé et ajouté à la file !");
      setQuickClientName("");
      setQuickBarberId("");
      setIsQuickTicketModalOpen(false);
      loadAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur de création.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── MATRICE D'AFFLUENCE PAR HEURE (09h à 23h) ──
  const { hourlyData, busiestHourLabel, maxCutsInHour } = useMemo(() => {
    const hours = Array.from({ length: 15 }, (_, i) => {
      const h = i + 9; // 09h à 23h
      return {
        hour: `${h < 10 ? "0" + h : h}h`,
        rawHour: h,
        cuts: 0,
        revenue: 0,
      };
    });

    const paid = dashboardData?.history || [];
    paid.forEach((t) => {
      const d = new Date(t.date);
      const h = d.getHours();
      const match = hours.find((item) => item.rawHour === h);
      if (match) {
        match.cuts += 1;
        match.revenue += Number(t.price || 0);
      }
    });

    const sorted = [...hours].sort((a, b) => b.cuts - a.cuts);
    const busiest = sorted[0];

    return {
      hourlyData: hours,
      busiestHourLabel: busiest && busiest.cuts > 0 ? busiest.hour : "--",
      maxCutsInHour: busiest ? busiest.cuts : 0,
    };
  }, [dashboardData]);

  // Barbiers actuellement en fauteuil
  const activeInChairCount = liveTickets.filter(
    (t) => t.status === "in-progress",
  ).length;
  const waitingCount = liveTickets.filter((t) => t.status === "waiting").length;

  const s = dashboardData?.summary;
  const c = ceoData?.caisse;
  const r = ceoData?.revenue;

  return (
    <div className="space-y-6 max-w-full select-none">
      {/* ══════════════════════════════════════════════════════════════
          1. BARRE D'ACTIONS RAPIDES & EN-TÊTE
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-center bg-surface border border-subtle p-5 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-t-main uppercase tracking-widest flex items-center gap-2">
            <Scissors className="text-brand" size={24} /> Tableau de Bord
            Coiffure
          </h2>
          <p className="text-xs font-bold text-t-muted uppercase tracking-wider mt-1">
            Activité en direct, affluence au fauteuil et gestion de la caisse
          </p>
        </div>

        {/* RACCOURCIS D'ACTION 1-CLIC */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsQuickTicketModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand hover:bg-brand/90 text-white font-bold text-xs uppercase tracking-wider shadow-md rounded-none cursor-pointer transition-all active:scale-95"
          >
            <Plus size={16} /> Nouveau Ticket
          </button>

          <button
            type="button"
            onClick={() => navigate("/administration/coiffure/caisse-rapide")}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-main hover:bg-subtle text-t-main border border-subtle font-bold text-xs uppercase tracking-wider rounded-none cursor-pointer transition-all"
          >
            <ShoppingCart size={15} className="text-brand" /> Caisse Rapide
          </button>

          <button
            type="button"
            onClick={() => navigate("/administration/coiffure/clients")}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-main hover:bg-subtle text-t-main border border-subtle font-bold text-xs uppercase tracking-wider rounded-none cursor-pointer transition-all relative"
          >
            <Users size={15} /> Salle d'Attente
            {waitingCount > 0 && (
              <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 text-[9px] font-black rounded-none">
                {waitingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate("/administration/coiffure/caisse")}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-main hover:bg-subtle text-t-main border border-subtle font-bold text-xs uppercase tracking-wider rounded-none cursor-pointer transition-all"
          >
            <Wallet size={15} className="text-green-400" /> Trésorerie
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          2. LES 4 MAIN KPI CARDS (AVEC CAISSE COMMUNE & BARBIERS)
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1 : CA SALON AUJOURD'HUI */}
        <div className="bg-surface border-l-4 border-l-blue-500 border border-subtle p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-t-muted block mb-1">
                Recette Coiffure (Aujourd'hui)
              </span>
              <p className="text-3xl font-mono font-bold text-blue-400">
                DZD {formatMoney(s?.totalNetRevenue || 0)}
              </p>
            </div>
            <div className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <DollarSign size={20} />
            </div>
          </div>
          <span className="text-[9px] font-mono font-bold text-t-muted block mt-2">
            Brut : {formatMoney(s?.totalGrossRevenue || 0)} DA | Remises : -
            {formatMoney(s?.totalDiscounts || 0)} DA
          </span>
        </div>

        {/* CARD 2 : NOMBRE DE CLIENTS COIFFÉS */}
        <div className="bg-surface border-l-4 border-l-brand border border-subtle p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-t-muted block mb-1">
                Clients Coiffés
              </span>
              <p className="text-3xl font-mono font-bold text-t-main">
                {s?.totalServicesSold || 0}
              </p>
            </div>
            <div className="p-2 bg-brand/10 text-brand border border-brand/20">
              <Scissors size={20} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[9px] uppercase font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 border border-amber-500/20">
              {waitingCount} en attente
            </span>
            <span className="text-[9px] uppercase font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 border border-green-500/20">
              {activeInChairCount} en fauteuil
            </span>
          </div>
        </div>

        {/* CARD 3 : PANIER MOYEN COUPE */}
        <div className="bg-surface border-l-4 border-l-green-500 border border-subtle p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-t-muted block mb-1">
                Panier Moyen Coupe
              </span>
              <p className="text-3xl font-mono font-bold text-green-400">
                DZD {formatMoney(s?.avgTransaction || 0)}
              </p>
            </div>
            <div className="p-2 bg-green-500/10 text-green-400 border border-green-500/20">
              <TrendingUp size={20} />
            </div>
          </div>
          <span className="text-[9px] text-t-muted uppercase font-bold block mt-2">
            Moyenne facturée par passage client
          </span>
        </div>

        {/* CARD 4 : SOLDE DU TIROIR-CAISSE PARTAGÉ */}
        <div className="bg-surface border-l-4 border-l-amber-500 border border-subtle p-5 shadow-sm bg-[#0a0a0a]">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                Tiroir-Caisse Partagé
              </span>
              <p className="text-3xl font-mono font-black text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.4)]">
                DZD{" "}
                {formatMoney(
                  currentTill?.expectedCash || c?.expectedCaisse || 0,
                )}
              </p>
            </div>
            <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Wallet size={20} />
            </div>
          </div>
          <div className="flex justify-between items-center mt-2 border-t border-slate-800 pt-1 text-[9px]">
            <span className="text-slate-400 uppercase font-bold">
              Barbiers actifs :
            </span>
            <span className="font-mono font-bold text-brand">
              {activeInChairCount +
                (barbers.filter((b) => b.isActive).length > 0 ? 1 : 0)}{" "}
              / {barbers.length} au poste
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          3. GRAPHIQUE D'AFFLUENCE PAR HEURE & TOP PRESTATIONS DU JOUR
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GRAPHIQUE DES SERVICES PAR HEURE (8 Cols) */}
        <div className="lg:col-span-8 bg-surface border border-subtle p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-subtle pb-3 mb-4 gap-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-brand flex items-center gap-2">
                <Clock size={16} /> Affluence &amp; Services Aujourd'hui (Par
                Heure)
              </h3>
              <p className="text-[10px] text-t-muted font-bold uppercase mt-0.5">
                Distribution horaire des prestations réalisées
              </p>
            </div>

            {busiestHourLabel !== "--" && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase">
                <Flame size={13} /> Pic d'affluence : {busiestHourLabel} (
                {maxCutsInHour} coupes)
              </span>
            )}
          </div>

          <div className="w-full h-[280px]">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-brand animate-pulse uppercase text-xs font-bold">
                Chargement de l'affluence...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={hourlyData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--theme-subtle)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="hour"
                    stroke="#94a3b8"
                    tick={{ fontSize: 10, fill: "#ffffff" }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fontSize: 10, fill: "#ffffff" }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="cuts"
                    name="Coupes"
                    fill="#3b82f6"
                    radius={[0, 0, 0, 0]}
                    barSize={26}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* TOP SERVICES DU JOUR (4 Cols) */}
        <div className="lg:col-span-4 bg-surface border border-subtle p-6 shadow-sm flex flex-col justify-between">
          <div className="border-b border-subtle pb-3 mb-4 flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-widest text-brand flex items-center gap-1.5">
              <Flame size={16} /> Top Prestations
            </h3>
            <span className="text-[9px] text-t-muted font-bold uppercase">
              Aujourd'hui
            </span>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[280px] pr-1">
            {!dashboardData?.charts?.serviceDistributionData ||
            dashboardData.charts.serviceDistributionData.length === 0 ? (
              <div className="py-12 text-center text-t-muted text-xs uppercase font-bold border border-dashed border-subtle">
                Aucune prestation enregistrée
              </div>
            ) : (
              dashboardData.charts.serviceDistributionData
                .slice(0, 5)
                .map((srv, idx) => (
                  <div
                    key={idx}
                    className="bg-main border border-subtle p-3 flex justify-between items-center"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-[9px] font-mono font-bold text-brand block mb-0.5">
                        #{idx + 1}
                      </span>
                      <p className="font-bold text-t-main text-xs uppercase truncate">
                        {srv.name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-mono font-bold">
                        {srv.value}x
                      </span>
                      <span className="block text-[9px] font-mono text-t-muted mt-0.5">
                        {formatMoney(srv.revenue || 0)} DA
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          4. PERFORMANCE DES COIFFEURS & DERNIÈRES PRESTATIONS LIVE
      ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CLASSEMENT BARBIERS AUJOURD'HUI (6 Cols) */}
        <div className="lg:col-span-6 bg-surface border border-subtle p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-subtle pb-3 mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-brand flex items-center gap-2">
              <Trophy size={16} /> Performance de l'Équipe (Aujourd'hui)
            </h3>
            <span className="text-[10px] text-t-muted font-bold uppercase">
              {barbers.length} coiffeurs
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[320px] pr-1">
            {!dashboardData?.topBarbers ||
            dashboardData.topBarbers.length === 0 ? (
              <div className="py-12 text-center text-t-muted text-xs uppercase font-bold border border-dashed border-subtle">
                Aucune coupe enregistrée aujourd'hui
              </div>
            ) : (
              dashboardData.topBarbers.map((b, idx) => (
                <div
                  key={idx}
                  className={`p-3 border flex justify-between items-center transition-all ${
                    idx === 0
                      ? "bg-amber-500/5 border-amber-500/40"
                      : "bg-main border-subtle"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm w-6 text-center">
                      {idx === 0 ? (
                        <Crown size={18} className="text-amber-400 mx-auto" />
                      ) : idx === 1 ? (
                        <Award size={16} className="text-slate-300 mx-auto" />
                      ) : (
                        `#${idx + 1}`
                      )}
                    </span>
                    <div>
                      <p className="font-bold text-t-main text-xs uppercase flex items-center gap-1.5">
                        {b.name}
                        {b.poste && (
                          <span className="text-[9px] font-mono text-t-muted font-normal">
                            (Poste {b.poste})
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-t-muted font-bold">
                        {b.clientsCount} coupe(s) réalisée(s)
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-sm font-bold text-green-400 block">
                      DZD {formatMoney(b.revenu)}
                    </span>
                    {b.tips > 0 && (
                      <span className="text-[9px] text-emerald-400">
                        +{formatMoney(b.tips)} Tips
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* FLUX DES DERNIÈRES PRESTATIONS VALIDÉES (6 Cols) */}
        <div className="lg:col-span-6 bg-surface border border-subtle p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-subtle pb-3 mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-brand flex items-center gap-2">
              <Receipt size={16} /> Dernières Prestations Validées (Live)
            </h3>
            <Button
              variant="ghost"
              onClick={() => navigate("/administration/coiffure/paiements")}
              className="text-xs font-bold text-brand hover:text-brand/80"
            >
              Historique complet <ArrowRight size={14} className="ml-1" />
            </Button>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[320px] pr-1">
            {!dashboardData?.history || dashboardData.history.length === 0 ? (
              <div className="py-12 text-center text-t-muted text-xs uppercase font-bold border border-dashed border-subtle">
                Aucune coupe validée en caisse aujourd'hui
              </div>
            ) : (
              dashboardData.history.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  className="bg-main border border-subtle p-3 flex justify-between items-center hover:border-brand/40 transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono font-bold text-[10px] text-brand">
                        #{t.queueNumber || t.id}
                      </span>
                      <p className="font-bold text-t-main text-xs uppercase truncate">
                        {t.clientName}
                      </p>
                    </div>
                    <p className="text-[10px] text-t-muted uppercase font-bold">
                      {t.service} •{" "}
                      <span className="text-slate-300">{t.barber}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0 font-mono">
                    <span className="text-sm font-bold text-green-400 block">
                      DZD {formatMoney(t.price)}
                    </span>
                    <span className="text-[9px] text-t-muted">
                      {new Date(t.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          5. RÉCAPITULATIF CAISSE COMMUNE (SHARED CAISSE SUMMARY)
      ══════════════════════════════════════════════════════════ */}
      <div className="bg-surface border-2 border-brand/40 p-6 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-subtle pb-3 mb-4 gap-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-brand flex items-center gap-2">
              <Wallet size={18} /> Réconciliation Caisse Commune (Tiroir
              Métallique Partagé)
            </h3>
            <p className="text-[10px] text-t-muted uppercase font-bold mt-0.5">
              Le tiroir physique est unique : voici la ventilation exacte des
              espèces
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-green-500/10 text-green-400 border border-green-500/30 px-2 py-1">
            STATUT : {currentTill ? "CAISSE OUVERTE" : "CAISSE FERMÉE"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-mono text-xs">
          <div className="bg-main p-3 border border-subtle">
            <span className="text-[9px] uppercase font-bold text-t-muted block mb-1">
              Fond de Départ
            </span>
            <p className="font-bold text-slate-200 text-base">
              DZD{" "}
              {formatMoney(currentTill?.startingCash || c?.openingCaisse || 0)}
            </p>
          </div>

          <div className="bg-main p-3 border border-blue-500/30">
            <span className="text-[9px] uppercase font-bold text-blue-400 block mb-1">
              (+) Ventes Coiffure
            </span>
            <p className="font-bold text-blue-400 text-base">
              + DZD {formatMoney(s?.totalNetRevenue || r?.salonNetRevenue || 0)}
            </p>
          </div>

          <div className="bg-main p-3 border border-amber-500/30">
            <span className="text-[9px] uppercase font-bold text-amber-400 block mb-1">
              (+) Ventes Cafétéria
            </span>
            <p className="font-bold text-amber-400 text-base">
              + DZD {formatMoney(r?.totalCafeRevenue || 0)}
            </p>
          </div>

          <div className="bg-main p-3 border border-red-500/30">
            <span className="text-[9px] uppercase font-bold text-red-400 block mb-1">
              (-) Décaissements / Sorties
            </span>
            <p className="font-bold text-red-400 text-base">
              - DZD {formatMoney(c?.totalCashOut || 0)}
            </p>
          </div>

          <div className="bg-[#0a0a0a] p-3 border-2 border-slate-800 shadow-inner">
            <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">
              (=) Espèces en Tiroir
            </span>
            <p className="font-black text-[#00ff00] text-lg drop-shadow-[0_0_8px_rgba(0,255,0,0.4)]">
              DZD{" "}
              {formatMoney(currentTill?.expectedCash || c?.expectedCaisse || 0)}
            </p>
          </div>
        </div>

        {/* Ligne de mise en valeur de la contribution Salon */}
        <div className="mt-4 pt-3 border-t border-subtle flex justify-between items-center text-xs">
          <span className="text-t-muted uppercase font-bold">
            Contribution nette du Salon à la caisse aujourd'hui :
          </span>
          <span className="font-mono font-bold text-brand text-sm">
            DZD {formatMoney(s?.totalNetRevenue || r?.salonNetRevenue || 0)}
          </span>
        </div>
      </div>

      {/* ── MODALE CRÉATION TICKET RAPIDE ── */}
      <Modal
        isOpen={isQuickTicketModalOpen}
        onClose={() => setIsQuickTicketModalOpen(false)}
      >
        <form
          onSubmit={handleQuickCreateTicket}
          className="p-8 bg-surface rounded-none"
        >
          <h3 className="text-lg font-serif font-bold text-brand mb-6 uppercase tracking-wider text-center border-b border-subtle pb-4">
            Création Rapide de Ticket
          </h3>

          <div className="space-y-4">
            <Input
              label="Nom du Client"
              value={quickClientName}
              onChange={(e) => setQuickClientName(e.target.value)}
              placeholder="Ex: Amine (Optionnel)"
              autoFocus
            />

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-t-muted mb-2">
                Coiffeur Assigné *
              </label>
              <select
                value={quickBarberId}
                onChange={(e) => setQuickBarberId(e.target.value)}
                className="w-full bg-main border border-subtle text-t-main px-4 py-3 focus:outline-none focus:border-brand font-bold text-xs uppercase rounded-none cursor-pointer"
                required
              >
                <option value="">-- Sélectionner un Coiffeur --</option>
                {barbers
                  .filter((b) => b.isPresent !== false)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.poste ? `(Poste ${b.poste})` : ""}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-subtle mt-6">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsQuickTicketModalOpen(false)}
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
                {isSubmitting ? "Génération..." : "Imprimer & File"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
