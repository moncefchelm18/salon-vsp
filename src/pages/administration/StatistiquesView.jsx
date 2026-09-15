import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  PieChart as PieChartIcon,
  TrendingUp,
  Scissors,
  Coffee,
  Trophy,
  Crown,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Calendar,
  Sparkles,
  Zap,
  Target,
  AlertCircle,
  BarChart3,
  Flame,
  Snowflake,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

import Button from "../../components/common/Button";
import DataTable from "../../components/common/DataTable";

const PIE_COLORS = [
  "#9ca149", // Olive Brand
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
];

const formatMoney = (val) => {
  const num = Number(val);
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

// Tooltip sombre et précis pour les graphiques
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950 border-2 border-slate-800 p-3 shadow-2xl rounded-none">
        <p className="font-bold text-brand uppercase tracking-widest text-[11px] border-b border-slate-800 pb-1 mb-1.5">
          {label}
        </p>
        {payload.map((p, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center gap-4 text-xs font-mono"
          >
            <span className="text-slate-400">{p.name} :</span>
            <span className="font-bold" style={{ color: p.color || "#fff" }}>
              {p.dataKey.includes("Rev")
                ? `DZD ${formatMoney(p.value)}`
                : `${p.value} passage(s)`}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Badge de progression comparative (+X% / -X%)
const DeltaBadge = ({ delta, label = "vs période précédente" }) => {
  const isPositive = delta >= 0;
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <span
        className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-black border rounded-none ${
          isPositive
            ? "bg-green-500/10 text-green-400 border-green-500/30"
            : "bg-red-500/10 text-red-400 border-red-500/30"
        }`}
      >
        {isPositive ? (
          <ArrowUpRight size={11} className="mr-0.5" />
        ) : (
          <ArrowDownRight size={11} className="mr-0.5" />
        )}
        {isPositive ? `+${delta}%` : `${delta}%`}
      </span>
      <span className="text-[9px] uppercase font-bold text-t-muted tracking-tight">
        {label}
      </span>
    </div>
  );
};

export default function StatistiquesView() {
  const [filterPeriod, setFilterPeriod] = useState("week"); // 'today', 'week', 'month', 'custom'
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Onglet sélectionné : 'global' | 'barber' | 'cafe'
  const [portalMode, setPortalMode] = useState("global");

  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      let url = `/reports/analytics?period=${filterPeriod}`;
      if (filterPeriod === "custom" && startDate && endDate) {
        url = `/reports/analytics?startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await api.get(url);
      setAnalytics(res.data);
    } catch (error) {
      toast.error("Erreur de chargement des analyses décisionnelles.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (filterPeriod !== "custom" || (startDate && endDate)) {
      fetchAnalytics();
    }
  }, [filterPeriod, startDate, endDate]);

  const g = analytics?.global;
  const s = analytics?.salon;
  const c = analytics?.cafe;

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* ══════════════════════════════════════════════════════════════
          1. EN-TÊTE & SÉLECTEUR DE PÉRIODES COMPARATIVES
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-center bg-surface border border-subtle p-5 shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-t-main flex items-center gap-2 uppercase tracking-widest">
            <BarChart3 className="text-brand" size={26} /> Statistiques &amp;
            Analyses Décisionnelles
          </h2>
          <p className="text-xs font-bold text-t-muted uppercase tracking-wider mt-1">
            Indicateurs clés, comparaison périodique ($N$ vs $N-1$) et affluence
          </p>
        </div>

        {/* Boutons périodes dynamiques */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-main border border-subtle p-1">
            {[
              { key: "today", label: "Aujourd'hui (vs Hier)" },
              { key: "week", label: "7 Jours (vs 7j préc.)" },
              { key: "month", label: "Ce Mois (vs Mois préc.)" },
            ].map((p) => (
              <Button
                key={p.key}
                variant={filterPeriod === p.key ? "primary" : "ghost"}
                onClick={() => {
                  setFilterPeriod(p.key);
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-[10px] py-1.5 px-3 font-bold uppercase rounded-none"
              >
                {p.label}
              </Button>
            ))}
          </div>

          <div className="flex bg-main border border-subtle p-1.5 gap-2 items-center text-xs">
            <span className="text-[10px] uppercase font-bold text-t-muted pl-1">
              Du :
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setFilterPeriod("custom");
              }}
              className="bg-transparent border-0 text-t-main text-xs font-bold font-mono focus:outline-none cursor-pointer"
            />
            <span className="text-[10px] uppercase font-bold text-t-muted">
              Au :
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setFilterPeriod("custom");
              }}
              className="bg-transparent border-0 text-t-main text-xs font-bold font-mono focus:outline-none cursor-pointer"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setFilterPeriod("week");
                }}
                className="text-red-500 hover:text-red-400 p-1 border-l border-subtle ml-1"
                title="Réinitialiser"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          2. PORTAILS DE NAVIGATION : GLOBAL VS COIFFURE VS CAFÉTÉRIA
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex gap-2 p-1 bg-surface border border-subtle w-fit">
        <button
          type="button"
          onClick={() => setPortalMode("global")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-wider transition-all rounded-none ${
            portalMode === "global"
              ? "bg-brand text-white shadow-md"
              : "text-t-muted hover:bg-main hover:text-t-main"
          }`}
        >
          <ShieldCheck size={16} /> Synthèse Globale &amp; Insights
        </button>

        <button
          type="button"
          onClick={() => setPortalMode("barber")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-wider transition-all rounded-none ${
            portalMode === "barber"
              ? "bg-blue-600 text-white shadow-md"
              : "text-t-muted hover:bg-main hover:text-blue-400"
          }`}
        >
          <Scissors size={16} /> Portail Salon de Coiffure
        </button>

        <button
          type="button"
          onClick={() => setPortalMode("cafe")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-wider transition-all rounded-none ${
            portalMode === "cafe"
              ? "bg-amber-500 text-white shadow-md"
              : "text-t-muted hover:bg-main hover:text-amber-400"
          }`}
        >
          <Coffee size={16} /> Portail Espace Cafétéria
        </button>
      </div>

      {isLoading || !analytics ? (
        <div className="p-20 text-center animate-pulse text-brand uppercase tracking-widest text-xs font-bold bg-surface border border-subtle">
          Analyse statistique approfondie en cours...
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════════
              INSIGHTS DÉCISIONNELS (ACTIONABLE INSIGHTS DU PATRON)
          ══════════════════════════════════════════════════════════ */}
          {analytics.insights && analytics.insights.length > 0 && (
            <div className="bg-surface border-2 border-brand p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center gap-2 text-brand mb-3 border-b border-subtle pb-2.5">
                <Sparkles size={18} />
                <h3 className="text-xs font-bold uppercase tracking-widest">
                  Analyses Automatisées &amp; Conseils Stratégiques
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analytics.insights.map((ins, i) => (
                  <div
                    key={i}
                    className="bg-main border border-subtle p-3.5 space-y-1.5"
                  >
                    <span className="inline-block px-2 py-0.5 text-[8px] font-bold uppercase bg-brand/10 text-brand border border-brand/30">
                      {ins.tag}
                    </span>
                    <p className="text-xs text-t-main leading-relaxed font-semibold">
                      {ins.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VUE 1 : SYNTHÈSE GLOBALE ADMIN & ÉVOLUTION CROISÉE
          ══════════════════════════════════════════════════════════ */}
          {portalMode === "global" && (
            <div className="space-y-6">
              {/* Macro Cartes avec deltas comparatifs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface border border-subtle p-5 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-t-muted block">
                    Chiffre d'Affaires Global
                  </span>
                  <p className="text-3xl font-mono font-bold text-t-main mt-1">
                    DZD {formatMoney(g.currentRevenue)}
                  </p>
                  <DeltaBadge delta={g.revenueDelta} />
                </div>

                <div className="bg-surface border border-subtle p-5 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-t-muted block">
                    Passages Totaux (Tickets &amp; Café)
                  </span>
                  <p className="text-3xl font-mono font-bold text-brand mt-1">
                    {g.totalTransactions}
                  </p>
                  <span className="text-[9px] uppercase font-bold text-t-muted block mt-2">
                    Volume global d'encaissement
                  </span>
                </div>

                <div className="bg-surface border border-subtle p-5 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-t-muted block">
                    Panier Moyen Global
                  </span>
                  <p className="text-3xl font-mono font-bold text-green-400 mt-1">
                    DZD {formatMoney(g.globalAverageTicket)}
                  </p>
                  <span className="text-[9px] uppercase font-bold text-t-muted block mt-2">
                    Dépense moyenne par client
                  </span>
                </div>

                <div className="bg-surface border border-subtle p-5 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-t-muted block">
                    Meilleur Jour d'Activité
                  </span>
                  <p className="text-2xl font-bold uppercase text-amber-400 mt-1">
                    {g.bestDay}
                  </p>
                  <span className="text-[9px] uppercase font-bold text-t-muted block mt-2">
                    Journée de plus fort chiffre
                  </span>
                </div>
              </div>

              {/* Graphique 1 : Répartition des Heures de Pointe (Affluence) */}
              <div className="bg-surface border border-subtle p-6 shadow-sm">
                <div className="flex justify-between items-center border-b border-subtle pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-brand flex items-center gap-2">
                      <Clock size={16} /> Courbe d'Affluence &amp; Heures de
                      Forte Activité
                    </h3>
                    <p className="text-[10px] text-t-muted font-bold uppercase mt-0.5">
                      Fréquentation croisée par heure (Salon en bleu, Cafétéria
                      en ambre)
                    </p>
                  </div>
                </div>

                <div className="w-full h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.charts.hourlyDistribution}
                      margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--theme-subtle)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="hour"
                        stroke="#94a3b8"
                        tick={{ fontSize: 10, fill: "#fff" }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        tick={{ fontSize: 10, fill: "#fff" }}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="top" height={36} />
                      <Bar
                        dataKey="salonCount"
                        name="Passages Salon (Coupes)"
                        fill="#3b82f6"
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="cafeCount"
                        name="Commandes Cafétéria"
                        fill="#f59e0b"
                        radius={[0, 0, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Graphique 2 : Part Coiffure vs Part Cafétéria */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface border border-subtle p-6 shadow-sm flex flex-col justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-brand border-b border-subtle pb-3 mb-4">
                    Répartition des Revenus par Pôle
                  </h3>

                  <div className="flex-1 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Coiffure", value: s.revenue },
                            { name: "Cafétéria", value: c.revenue },
                          ]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={4}
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#f59e0b" />
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-subtle">
                    <div className="bg-main p-3 text-center border-l-2 border-l-blue-500">
                      <span className="text-[9px] uppercase font-bold text-t-muted block">
                        Part Coiffure
                      </span>
                      <span className="text-lg font-mono font-bold text-blue-400">
                        {g.salonSharePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-main p-3 text-center border-l-2 border-l-amber-500">
                      <span className="text-[9px] uppercase font-bold text-t-muted block">
                        Part Cafétéria
                      </span>
                      <span className="text-lg font-mono font-bold text-amber-400">
                        {g.cafeSharePercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Répartition des Jours de la Semaine */}
                <div className="bg-surface border border-subtle p-6 shadow-sm flex flex-col justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-brand border-b border-subtle pb-3 mb-4">
                    Performance par Jour de Semaine
                  </h3>

                  <div className="w-full h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.charts.weeklyDaysDistribution}
                        margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--theme-subtle)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          stroke="#94a3b8"
                          tick={{ fontSize: 9, fill: "#fff" }}
                        />
                        <YAxis
                          stroke="#94a3b8"
                          tick={{ fontSize: 10, fill: "#fff" }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey="salonRev"
                          name="CA Salon"
                          fill="#3b82f6"
                          stackId="a"
                        />
                        <Bar
                          dataKey="cafeRev"
                          name="CA Café"
                          fill="#f59e0b"
                          stackId="a"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <p className="text-[10px] text-t-muted text-center uppercase font-bold tracking-widest pt-2">
                    Journée historique la plus rentable :{" "}
                    <span className="text-brand">{g.bestDay}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VUE 2 : PORTAIL BARBIER & SALON DE COIFFURE
          ══════════════════════════════════════════════════════════ */}
          {portalMode === "barber" && (
            <div className="space-y-6">
              {/* KPIs Salon avec comparaison périodique */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface border-l-4 border-l-blue-500 border border-subtle p-5 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-t-muted block">
                    CA Salon Réalisé
                  </span>
                  <p className="text-3xl font-mono font-bold text-blue-400 mt-1">
                    DZD {formatMoney(s.revenue)}
                  </p>
                  <DeltaBadge delta={s.revenueDelta} />
                </div>

                <div className="bg-surface border-l-4 border-l-blue-500 border border-subtle p-5 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-t-muted block">
                    Clients Coiffés
                  </span>
                  <p className="text-3xl font-mono font-bold text-t-main mt-1">
                    {s.clientsCount}
                  </p>
                  <DeltaBadge delta={s.clientsDelta} />
                </div>

                <div className="bg-surface border-l-4 border-l-blue-500 border border-subtle p-5 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-t-muted block">
                    Valeur Moyenne par Coupe
                  </span>
                  <p className="text-3xl font-mono font-bold text-green-400 mt-1">
                    DZD {formatMoney(s.averageService)}
                  </p>
                  <DeltaBadge delta={s.averageServiceDelta} />
                </div>

                <div className="bg-surface border-l-4 border-l-blue-500 border border-subtle p-5 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-t-muted block">
                    Heure de Pointe Salon
                  </span>
                  <p className="text-2xl font-mono font-bold text-amber-400 mt-1">
                    {s.busiestHour}
                  </p>
                  <span className="text-[9px] uppercase font-bold text-t-muted block mt-2">
                    Concentration maximale de coupes
                  </span>
                </div>
              </div>

              {/* Cartes Spéciales : Prestation Star & Flop + Meilleur Barbier */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface border border-subtle p-5 flex items-center gap-4">
                  <div className="p-3.5 bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <Flame size={24} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500 block">
                      Prestation Star (La + Demandée)
                    </span>
                    <p className="text-base font-bold text-t-main uppercase truncate mt-0.5">
                      {s.mostRequestedService.name}
                    </p>
                    <p className="text-xs font-mono text-t-muted font-bold mt-0.5">
                      {s.mostRequestedService.count} coupes (DZD{" "}
                      {formatMoney(s.mostRequestedService.revenue)})
                    </p>
                  </div>
                </div>

                <div className="bg-surface border border-subtle p-5 flex items-center gap-4">
                  <div className="p-3.5 bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    <Snowflake size={24} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400 block">
                      Prestation Moins Fréquente
                    </span>
                    <p className="text-base font-bold text-t-main uppercase truncate mt-0.5">
                      {s.leastRequestedService.name}
                    </p>
                    <p className="text-xs font-mono text-t-muted font-bold mt-0.5">
                      {s.leastRequestedService.count} réalisation(s)
                    </p>
                  </div>
                </div>

                <div className="bg-surface border border-subtle p-5 flex items-center gap-4">
                  <div className="p-3.5 bg-green-500/10 text-green-400 border border-green-500/30">
                    <Trophy size={24} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-green-400 block">
                      Meilleur Barbier (Chiffre)
                    </span>
                    <p className="text-base font-bold text-t-main uppercase truncate mt-0.5">
                      {s.bestBarber.name}
                    </p>
                    <p className="text-xs font-mono text-t-muted font-bold mt-0.5">
                      DZD {formatMoney(s.bestBarber.revenue)} (
                      {s.bestBarber.clientsCount} clients)
                    </p>
                  </div>
                </div>
              </div>

              {/* Classement des Collaborateurs & Évolution */}
              <div className="bg-surface border border-subtle shadow-sm overflow-hidden">
                <div className="p-4 border-b border-subtle bg-main/40 flex justify-between items-center">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-brand flex items-center gap-2">
                    <Trophy size={16} /> Classement &amp; Rentabilité par
                    Barbier
                  </h3>
                </div>

                <DataTable
                  headers={[
                    { label: "Rang" },
                    { label: "Collaborateur" },
                    { label: "Poste" },
                    { label: "Coupes Réalisées", align: "center" },
                    { label: "Pourboires", align: "right" },
                    { label: "Panier Moyen", align: "right" },
                    { label: "CA Généré Total", align: "right" },
                  ]}
                >
                  {s.leaderboard.map((b, idx) => (
                    <tr
                      key={b.id}
                      className="border-b border-subtle hover:bg-brand/5 transition-colors"
                    >
                      <td className="px-5 py-3 font-mono font-bold text-base">
                        {idx === 0 ? (
                          <span className="text-amber-400 flex items-center gap-1">
                            <Crown size={18} /> 1er
                          </span>
                        ) : idx === 1 ? (
                          <span className="text-slate-300 flex items-center gap-1">
                            <Award size={16} /> 2e
                          </span>
                        ) : idx === 2 ? (
                          <span className="text-amber-600 flex items-center gap-1">
                            <Award size={16} /> 3e
                          </span>
                        ) : (
                          <span className="text-t-muted">#{idx + 1}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-bold text-t-main uppercase text-xs">
                        {b.name}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs font-bold text-t-muted">
                        Poste {b.poste}
                      </td>
                      <td className="px-5 py-3 text-center font-mono font-bold text-sm text-t-main">
                        {b.clientsCount}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-emerald-400 text-xs">
                        {b.tips > 0 ? `+ DZD ${formatMoney(b.tips)}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-xs text-slate-300">
                        DZD {formatMoney(b.avgTicket)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-black text-sm text-green-400">
                        DZD {formatMoney(b.revenue)}
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VUE 3 : PORTAIL ESPACE CAFÉTÉRIA
          ══════════════════════════════════════════════════════════ */}
          {portalMode === "cafe" && (
            <div className="space-y-6">
              {/* KPIs Café avec comparaison périodique */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface border-l-4 border-l-amber-500 border border-subtle p-5 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-t-muted block">
                    CA Cafétéria
                  </span>
                  <p className="text-3xl font-mono font-bold text-amber-400 mt-1">
                    DZD {formatMoney(c.revenue)}
                  </p>
                  <DeltaBadge delta={c.revenueDelta} />
                </div>

                <div className="bg-surface border-l-4 border-l-amber-500 border border-subtle p-5 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-t-muted block">
                    Nombre de Commandes
                  </span>
                  <p className="text-3xl font-mono font-bold text-t-main mt-1">
                    {c.ordersCount}
                  </p>
                  <DeltaBadge delta={c.ordersDelta} />
                </div>

                <div className="bg-surface border-l-4 border-l-amber-500 border border-subtle p-5 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-t-muted block">
                    Panier Moyen Boisson
                  </span>
                  <p className="text-3xl font-mono font-bold text-green-400 mt-1">
                    DZD {formatMoney(c.averageTicket)}
                  </p>
                  <DeltaBadge delta={c.averageTicketDelta} />
                </div>

                <div className="bg-surface border-l-4 border-l-amber-500 border border-subtle p-5 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-t-muted block">
                    Heure Forte Cafétéria
                  </span>
                  <p className="text-2xl font-mono font-bold text-brand mt-1">
                    {c.busiestHour}
                  </p>
                  <span className="text-[9px] uppercase font-bold text-t-muted block mt-2">
                    Pic de consommation au bar
                  </span>
                </div>
              </div>

              {/* Cartes Spéciales : Star & Flop du Café */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface border border-subtle p-5 flex items-center gap-4">
                  <div className="p-3.5 bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <Flame size={24} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500 block">
                      Article le Plus Vendu (Best-Seller)
                    </span>
                    <p className="text-lg font-bold text-t-main uppercase truncate mt-0.5">
                      {c.bestSellingProduct.name}
                    </p>
                    <p className="text-xs font-mono text-t-muted font-bold mt-0.5">
                      {c.bestSellingProduct.quantity} vendus (DZD{" "}
                      {formatMoney(c.bestSellingProduct.revenue)})
                    </p>
                  </div>
                </div>

                <div className="bg-surface border border-subtle p-5 flex items-center gap-4">
                  <div className="p-3.5 bg-slate-500/10 text-slate-400 border border-slate-500/30">
                    <Snowflake size={24} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block">
                      Article le Moins Vendu (À Réévaluer)
                    </span>
                    <p className="text-lg font-bold text-t-main uppercase truncate mt-0.5">
                      {c.leastSellingProduct.name}
                    </p>
                    <p className="text-xs font-mono text-t-muted font-bold mt-0.5">
                      {c.leastSellingProduct.quantity} unité(s) vendue(s)
                    </p>
                  </div>
                </div>
              </div>

              {/* Tableau du Mix Produits Café */}
              <div className="bg-surface border border-subtle shadow-sm overflow-hidden">
                <div className="p-4 border-b border-subtle bg-main/40">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-brand">
                    Top Produits de la Cafétéria
                  </h3>
                </div>

                <DataTable
                  headers={[
                    { label: "Produit" },
                    { label: "Unités Vendues", align: "center" },
                    { label: "Chiffre d'Affaires", align: "right" },
                  ]}
                >
                  {c.productMix.map((prod, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-subtle hover:bg-brand/5 transition-colors"
                    >
                      <td className="px-5 py-3 font-bold text-t-main uppercase text-xs">
                        {prod.name}
                      </td>
                      <td className="px-5 py-3 text-center font-mono font-bold text-sm text-t-main">
                        {prod.quantity}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-amber-400 text-sm">
                        DZD {formatMoney(prod.revenue)}
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
