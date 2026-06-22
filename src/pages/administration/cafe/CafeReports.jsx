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
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Percent,
  RefreshCcw,
  Tag,
  Truck,
  TrendingDown,
  Layers,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../../utils/api";

import StatCard from "../../../components/common/StatCard";
import Button from "../../../components/common/Button";
import DataTable from "../../../components/common/DataTable";

export default function CafeReports() {
  const [filterPeriod, setFilterPeriod] = useState("today");
  const [isLoading, setIsLoading] = useState(true);

  const [reportData, setReportData] = useState({
    summary: {
      totalGrossRevenue: 0,
      totalDiscountsGiven: 0,
      totalNetRevenue: 0,
      totalCostOfGoodsSold: 0,
      grossProfit: 0,
      marginPercentage: 0,
      totalOrders: 0,
      totalPurchasesValue: 0,
      totalSupplierDiscounts: 0,
      totalActualPaidToSuppliers: 0,
      totalSupplierDebt: 0,
    },
    charts: { topProductsData: [], timelineData: [] },
    history: [],
  });

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/cafe/reports?period=${filterPeriod}`);
      setReportData(res.data);
    } catch (error) {
      toast.error("Erreur de chargement des statistiques.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filterPeriod]);

  // Calcul du flux net de trésorerie (Entrées réelles - Décaissements réels)
  const cashFlowNet =
    reportData.summary.totalNetRevenue -
    reportData.summary.totalActualPaidToSuppliers;

  return (
    <div className="space-y-6">
      {/* FILTER HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-surface border border-subtle p-6">
        <div>
          <h2 className="text-xl font-serif font-bold text-t-main uppercase tracking-widest">
            Analyse de Trésorerie
          </h2>
          <p className="text-[10px] uppercase font-bold text-t-muted tracking-wider mt-1">
            Suivi des flux d'argent réels (Entrées Caisse vs Décaissements
            Fournisseurs)
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
          icon={DollarSign}
          label="Entrées Caisse (CA Net)"
          value={`DZD ${reportData.summary.totalNetRevenue.toFixed(2)}`}
          highlight={true}
        />
        <StatCard
          icon={TrendingDown}
          label="Décaissements Fournisseurs"
          value={`DZD ${reportData.summary.totalActualPaidToSuppliers.toFixed(2)}`}
          colorClass="text-red-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Marge Brute (Ventes)"
          value={`DZD ${reportData.summary.grossProfit.toFixed(2)}`}
          colorClass="text-brand"
        />
        <StatCard
          icon={Percent}
          label="Taux de Marge"
          value={`${reportData.summary.marginPercentage.toFixed(1)}%`}
          colorClass="text-t-main"
        />
      </div>

      {/* DOUBLE TIMELINE AREA CHART (VENTES VS ACHATS) */}
      <div className="bg-surface border border-subtle p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-t-muted border-b border-subtle pb-4 mb-6">
          Évolution des Flux Financiers (Trésorerie)
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart
            data={reportData.charts.timelineData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorEntrees" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSorties" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
              name="Entrées (Ventes)"
              type="monotone"
              dataKey="Entrées"
              stroke="#2563eb"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorEntrees)"
            />
            <Area
              name="Sorties (Paiements Fournisseurs)"
              type="monotone"
              dataKey="Décaissements"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorSorties)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* COMPTE DE RÉSULTAT ET BILAN DE TRÉSORERIE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* COMPTE DE RÉSULTAT */}
        <div className="bg-surface border border-subtle p-6 space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-t-muted border-b border-subtle pb-2 flex items-center gap-2">
            <Tag size={12} className="text-brand" /> Compte d'Exploitation
            (Ventes)
          </h4>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span>Ventes Brutes (Comptoir) :</span>
              <span className="font-bold">
                DZD {reportData.summary.totalGrossRevenue.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-red-500">
              <span>Remises Clients (-) :</span>
              <span>
                - DZD {reportData.summary.totalDiscountsGiven.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between border-t border-subtle/50 pt-2 font-bold text-brand">
              <span>Ventes Nettes (CA Réel) :</span>
              <span>DZD {reportData.summary.totalNetRevenue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* FACTURES ET DETTES SUPPLÉMENTAIRES */}
        <div className="bg-surface border border-subtle p-6 space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-t-muted border-b border-subtle pb-2 flex items-center gap-2">
            <Truck size={12} className="text-red-500" /> Flux
            d'Approvisionnement
          </h4>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span>Valeur d'Achat Brute :</span>
              <span className="font-bold">
                DZD{" "}
                {(
                  reportData.summary.totalPurchasesValue +
                  reportData.summary.totalSupplierDiscounts
                ).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-green-500">
              <span>Remises Fournisseurs (+) :</span>
              <span>
                + DZD {reportData.summary.totalSupplierDiscounts.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between border-t border-subtle/50 pt-2 font-bold text-red-500">
              <span>Dette Fournisseur Active (Global) :</span>
              <span>DZD {reportData.summary.totalSupplierDebt.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* FLUX NET DE TRÉSORERIE */}
        <div className="bg-surface border border-subtle p-6 flex flex-col justify-between">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-t-muted border-b border-subtle pb-2 flex items-center gap-2">
            <Layers size={12} className="text-brand" /> Bilan de Trésorerie
          </h4>
          <div className="text-center py-2">
            <p className="text-[10px] uppercase font-bold text-t-muted tracking-widest mb-1">
              Trésorerie Nette Disponible (Période)
            </p>
            <p
              className={`text-2xl font-mono font-bold ${cashFlowNet >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              DZD {cashFlowNet.toFixed(2)}
            </p>
          </div>
          <p className="text-[9px] text-t-muted text-center italic leading-relaxed">
            Trésorerie Nette = CA Net (Argent reçu des clients) - Décaissements
            réels (Argent versé aux fournisseurs).
          </p>
        </div>
      </div>

      {/* LISTE DES COMMANDES */}
      <div className="bg-surface border border-subtle">
        <div className="p-6 border-b border-subtle">
          <h3 className="text-lg font-serif font-bold text-brand uppercase tracking-widest">
            Journal des Ventes
          </h3>
        </div>
        {isLoading ? (
          <p className="p-12 text-center text-brand animate-pulse uppercase tracking-widest text-xs">
            Calcul...
          </p>
        ) : (
          <DataTable
            headers={[
              { label: "Réf Commande" },
              { label: "Articles" },
              { label: "Date" },
              { label: "Montant", align: "right" },
            ]}
          >
            {reportData.history.map((order) => (
              <tr
                key={order.id}
                className="border-b border-subtle hover:bg-brand/5"
              >
                <td className="px-6 py-4 font-mono font-bold text-t-muted text-xs">
                  #CMD-{order.id}
                </td>
                <td className="px-6 py-4 font-bold text-t-main uppercase text-xs">
                  {order.itemsCount} Articles
                </td>
                <td className="px-6 py-4 text-t-muted font-mono text-xs">
                  {new Date(order.date).toLocaleDateString("fr-FR")}{" "}
                  {new Date(order.date).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-6 py-4 text-right text-brand font-mono font-bold">
                  DZD {order.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  );
}
