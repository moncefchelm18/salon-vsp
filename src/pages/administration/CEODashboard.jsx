import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  TrendingUp,
  RefreshCcw,
  Scissors,
  Coffee,
  Coins,
  Receipt,
  User,
  TrendingDown,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

import StatCard from "../../components/common/StatCard";
import Button from "../../components/common/Button";

// Couleurs financières (Bleu = Revenus, Rouge = Charges)
const COLOR_REVENUE = "#2563eb";
const COLOR_EXPENSES = "#ef4444";

export default function CEODashboard() {
  const [filterPeriod, setFilterPeriod] = useState("month");
  const [isLoading, setIsLoading] = useState(true);

  const [ceoData, setCeoData] = useState({
    summary: {
      totalSalonRevenue: 0,
      totalCafeRevenue: 0,
      grossRevenue: 0,
      totalCogs: 0,
      grossProfit: 0,
      totalOpex: 0,
      netProfit: 0,
      marginPercentage: 0,
    },
    charts: { timelineData: [] },
  });

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/reports/ceo?period=${filterPeriod}`);
      setCeoData(res.data);
    } catch (error) {
      toast.error("Erreur de chargement du bilan décisionnel.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filterPeriod]);

  const s = ceoData.summary;

  return (
    <div className="space-y-6">
      {/* FILTER HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-surface border border-subtle p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-t-main flex items-center gap-2">
            <User className="text-brand" size={24} /> Espace Propriétaire (CEO)
          </h2>
          <p className="text-t-muted text-sm mt-1">
            Bilan financier consolidé du complexe Sallon Picasso (Coiffure +
            Cafétéria)
          </p>
        </div>

        <div className="flex bg-main border border-subtle p-1 mt-4 md:mt-0">
          {["today", "week", "month", "year"].map((p) => (
            <Button
              key={p}
              variant={filterPeriod === p ? "primary" : "ghost"}
              onClick={() => setFilterPeriod(p)}
              className="text-[10px] py-2 px-6"
            >
              {p === "today"
                ? "AUJOURD'HUI"
                : p === "week"
                  ? "SEMAINE"
                  : p === "month"
                    ? "CE MOIS"
                    : "ANNÉE"}
            </Button>
          ))}
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Coins}
          label="Chiffre d'Affaires Global"
          value={`DZD ${s.grossRevenue.toFixed(2)}`}
          highlight={true}
        />
        <StatCard
          icon={TrendingDown}
          label="Charges Fixes (OPEX)"
          value={`DZD ${s.totalOpex.toFixed(2)}`}
          colorClass="text-red-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Marge Brute Salon + Café"
          value={`DZD ${s.grossProfit.toFixed(2)}`}
          colorClass="text-brand"
        />
        <StatCard
          icon={(Percent) => <TrendingUp className="text-emerald-500" />}
          label="Rentabilité d'Exploitation"
          value={`${s.marginPercentage.toFixed(1)}%`}
        />
      </div>

      {/* DOUBLE AREA CHART : REVENUS VS CHARGES */}
      <div className="bg-surface border border-subtle p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-t-muted border-b border-subtle pb-4 mb-6">
          Évolution Chronologique : Revenus vs Charges Fixes
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart
            data={ceoData.charts.timelineData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLOR_REVENUE} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLOR_REVENUE} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={COLOR_EXPENSES}
                  stopOpacity={0.2}
                />
                <stop offset="95%" stopColor={COLOR_EXPENSES} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e7e5e4"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              stroke="#78716c"
              fontSize={10}
              fontWeight="bold"
            />
            <YAxis stroke="#78716c" fontSize={10} />
            <Tooltip />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Area
              name="Revenus Totaux (Salon + Café)"
              type="monotone"
              dataKey="Revenu"
              stroke={COLOR_REVENUE}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
            <Area
              name="Charges Fixes Enregistrées"
              type="monotone"
              dataKey="Charges"
              stroke={COLOR_EXPENSES}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorExpenses)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* COMPTE DE RÉSULTAT CONSOLIDÉ EN CASCADE */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LE COMPTE DE RÉSULTAT (P&L STATEMENT) */}
        <div className="lg:col-span-3 bg-surface border border-subtle p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-t-muted border-b border-subtle pb-3 flex items-center gap-2">
            <Receipt size={16} className="text-brand" /> Compte de Résultat
            Consolidé (P&L)
          </h3>

          <div className="space-y-3 font-mono text-sm pt-2">
            {/* Chiffre d'Affaires Coiffure */}
            <div className="flex justify-between items-center text-t-muted">
              <span className="flex items-center gap-2">
                <Scissors size={14} /> Chiffre d'Affaires Coiffure (Salon) :
              </span>
              <span className="font-bold text-t-main">
                DZD {s.totalSalonRevenue.toFixed(2)}
              </span>
            </div>

            {/* Chiffre d'Affaires Café */}
            <div className="flex justify-between items-center text-t-muted">
              <span className="flex items-center gap-2">
                <Coffee size={14} /> Chiffre d'Affaires Cafétéria :
              </span>
              <span className="font-bold text-t-main">
                DZD {s.totalCafeRevenue.toFixed(2)}
              </span>
            </div>

            {/* Somme CA Brut */}
            <div className="flex justify-between items-center border-t border-subtle/50 pt-2 font-bold text-t-main text-base">
              <span>Chiffre d'Affaires Brut Global (CA) :</span>
              <span>DZD {s.grossRevenue.toFixed(2)}</span>
            </div>

            {/* Déduction COGS Café */}
            <div className="flex justify-between items-center text-red-500 pt-2 border-b border-subtle/50 pb-2 border-dashed">
              <span>Coût d'Achat Ingrédients Café (COGS) (-) :</span>
              <span>- DZD {s.totalCogs.toFixed(2)}</span>
            </div>

            {/* Marge Brute */}
            <div className="flex justify-between items-center font-bold text-brand">
              <span>Marge Brute d'Exploitation (=) :</span>
              <span>DZD {s.grossProfit.toFixed(2)}</span>
            </div>

            {/* Déduction Charges Fixes (OPEX) */}
            <div className="flex justify-between items-center text-red-500 pt-2 border-b border-subtle pb-2 border-dashed">
              <span>Charges de Fonctionnement (Loyer, Factures) (-) :</span>
              <span>- DZD {s.totalOpex.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* CADRAN DU BÉNÉFICE NET NET (ÉCRAN LED POS GÉANT) */}
        <div className="lg:col-span-2 bg-surface border border-subtle p-6 flex flex-col justify-between items-center text-center">
          <div className="w-full">
            <h4 className="text-xs font-bold text-t-muted uppercase tracking-widest border-b border-subtle pb-3 mb-6">
              Bénéfice Net Net (Dans la poche)
            </h4>
          </div>

          {/* ÉCRAN LED COMPTABLE */}
          <div className="bg-[#0a0a0a] p-6 border-4 border-slate-800 rounded-sm w-full flex flex-col justify-center items-center shadow-inner gap-2">
            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              Trésorerie Nette Réelle ({filterPeriod.toUpperCase()})
            </span>
            <span
              className={`text-3xl font-mono font-black tracking-wider ${s.netProfit >= 0 ? "text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.4)]" : "text-red-500"}`}
            >
              {s.netProfit >= 0 ? "+" : "-"} DZD{" "}
              {Math.abs(s.netProfit).toFixed(2)}
            </span>
          </div>

          <div className="p-4 mt-6">
            <p className="text-xs text-t-muted italic max-w-[280px]">
              Ce montant représente le bénéfice net final à la fin de la
              période, une fois que la marchandise ET les charges fixes
              (Sonelgaz, loyers, salaires) ont été payées.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
