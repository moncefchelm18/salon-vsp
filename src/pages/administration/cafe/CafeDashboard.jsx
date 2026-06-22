import React, { useState, useEffect } from "react";
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
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
import api from "../../../utils/api";

// Common UI Imports
import StatCard from "../../../components/common/StatCard";
import Button from "../../../components/common/Button";
import DataTable from "../../../components/common/DataTable";

// Custom Tooltip pour Recharts (adapté au thème)
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-main border border-brand/30 p-3 shadow-xl">
        <p className="font-bold text-t-main uppercase tracking-widest text-[10px] mb-1">
          {label}
        </p>
        <p className="font-mono text-brand font-bold text-xs">
          Ventes : {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function CafeDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // States (Initialisés proprement à 0 pour éviter tout plantage au premier chargement)
  const [todayStats, setTodayStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [topProductsChart, setTopProductsChart] = useState([]);

  const loadDashboardData = async () => {
    try {
      const [reportsRes, productsRes] = await Promise.all([
        api.get("/cafe/reports?period=today"),
        api.get("/cafe/products"),
      ]);

      // CORRECTION DU NOM : On récupère 'totalNetRevenue' ou 'totalRevenue' par rétro-compatibilité
      const apiRevenue =
        reportsRes.data.summary.totalNetRevenue !== undefined
          ? reportsRes.data.summary.totalNetRevenue
          : reportsRes.data.summary.totalRevenue || 0;

      setTodayStats({
        totalRevenue: apiRevenue,
        totalOrders: reportsRes.data.summary.totalOrders || 0,
      });

      setRecentOrders(reportsRes.data.history?.slice(0, 5) || []);
      setTopProductsChart(reportsRes.data.charts?.topProductsData || []);

      // Calcul des alertes stock
      const alerts = productsRes.data.filter((p) => p.stock <= p.nuc * 2);
      setLowStockProducts(alerts);
    } catch (error) {
      console.error(error);
      toast.error("Erreur de synchronisation du tableau de bord.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 p-6 bg-surface border border-subtle shadow-sm">
        <div>
          <h2 className="text-xl font-serif font-bold text-t-main uppercase tracking-widest">
            Accueil Cafétéria
          </h2>
          <p className="text-t-muted text-[10px] font-bold uppercase mt-1 italic tracking-widest">
            Activité commerciale et alertes opérationnelles du jour
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate("/administration/cafe/commandes")}
          className="py-3 px-6 shadow-lg shadow-brand/20"
        >
          Ouvrir la Caisse (POS) <ArrowUpRight size={16} className="ml-2" />
        </Button>
      </div>

      {/* --- STAT CARDS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={DollarSign}
          label="Chiffre d'Affaires (Aujourd'hui)"
          // SÉCURISÉ : Remplacement de toFixed direct par une valeur par défaut sûre
          value={`DZD ${(todayStats?.totalRevenue || 0).toFixed(2)}`}
          highlight={true}
        />
        <StatCard
          icon={ShoppingCart}
          label="Ventes Validées (Aujourd'hui)"
          value={`${todayStats?.totalOrders || 0} Commandes`}
          colorClass="text-t-main"
        />
        <StatCard
          icon={AlertTriangle}
          label="Alertes Inventaire"
          value={`${lowStockProducts?.length || 0} Articles en danger`}
          colorClass="text-red-500"
          highlight={(lowStockProducts?.length || 0) > 0}
        />
      </div>

      {/* --- MAIN DASHBOARD WIDGETS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* WIDGET 1 : GRAPHICS (2 Cols) */}
        <div className="lg:col-span-2 bg-surface border border-subtle flex flex-col">
          <div className="p-6 border-b border-subtle flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold tracking-widest text-brand uppercase">
                Performances du Jour
              </h3>
              <p className="text-t-muted text-[9px] uppercase font-bold tracking-tighter mt-1">
                Top 5 Articles les plus vendus
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate("/administration/cafe/rapports")}
              className="text-xs font-bold text-brand"
            >
              Détails <ArrowRight size={14} className="ml-2" />
            </Button>
          </div>
          <div className="flex-1 p-6">
            {topProductsChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-t-muted font-bold uppercase tracking-widest text-xs">
                Aucune donnée de vente aujourd'hui
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={topProductsChart}
                  margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--theme-subtle)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--theme-text-muted)"
                    fontSize={9}
                    fontWeight="bold"
                    tickMargin={10}
                  />
                  <YAxis
                    stroke="var(--theme-text-muted)"
                    fontSize={10}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "var(--theme-brand)", opacity: 0.1 }}
                  />
                  <Bar
                    dataKey="Quantité"
                    fill="var(--theme-brand)"
                    radius={[0, 0, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* WIDGET 2: RECENT SALES (1 Col) */}
        <div className="lg:col-span-1 bg-surface border border-subtle flex flex-col justify-between">
          <div className="p-6 border-b border-subtle">
            <h3 className="text-sm font-bold tracking-widest text-brand uppercase">
              Flux Live
            </h3>
            <p className="text-t-muted text-[9px] uppercase font-bold tracking-tighter mt-1">
              5 dernières commandes
            </p>
          </div>

          <div className="flex-1 p-4 space-y-3 bg-main/30 overflow-y-auto max-h-[340px]">
            {isLoading ? (
              <p className="text-center py-10 animate-pulse text-brand font-bold text-xs uppercase">
                Calcul...
              </p>
            ) : recentOrders.length === 0 ? (
              <p className="text-center py-12 text-t-muted font-bold uppercase text-[10px] tracking-widest">
                Caisse au repos
              </p>
            ) : (
              recentOrders.map((o) => (
                <div
                  key={o.id}
                  className="bg-surface border border-subtle p-4 flex justify-between items-center transition-colors hover:border-brand/40 shadow-sm"
                >
                  <div>
                    <p className="font-mono font-bold text-[10px] text-t-main uppercase">
                      #CMD-{o.id}
                    </p>
                    <p className="text-[9px] font-bold text-t-muted uppercase tracking-widest mt-1">
                      {new Date(o.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      • {o.itemsCount} art.
                    </p>
                  </div>
                  <p className="font-mono font-bold text-brand">
                    {/* SÉCURISÉ : Remplacement de toFixed direct par une valeur par défaut */}
                    DZD {(o?.total || 0).toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- WIDGET 3: ALERTS TABLE (Full Width) --- */}
      <div className="bg-surface border border-subtle">
        <div className="p-6 border-b border-subtle flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold tracking-widest text-red-500 uppercase">
              Alertes Réapprovisionnement
            </h3>
            <p className="text-t-muted text-[9px] uppercase font-bold tracking-tighter mt-1">
              Articles en rupture ou niveau critique
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/administration/cafe/stock")}
            className="text-xs font-bold text-red-500 hover:bg-red-50"
          >
            Gérer le Stock <ArrowRight size={14} className="ml-2" />
          </Button>
        </div>

        <DataTable
          headers={[
            { label: "Article" },
            { label: "Catégorie" },
            { label: "Stock Actuel" },
            { label: "Statut" },
          ]}
        >
          {isLoading ? (
            <tr>
              <td
                colSpan="4"
                className="py-8 text-center animate-pulse text-brand font-bold uppercase text-[10px] tracking-widest"
              >
                Vérification des rayons...
              </td>
            </tr>
          ) : lowStockProducts.length === 0 ? (
            <tr>
              <td
                colSpan="4"
                className="py-12 text-center text-t-muted font-bold uppercase tracking-widest text-[10px]"
              >
                Aucune alerte, le stock est sain !
              </td>
            </tr>
          ) : (
            lowStockProducts.slice(0, 5).map((p) => (
              <tr
                key={p.id}
                className="border-b border-subtle/50 hover:bg-brand/5"
              >
                <td className="px-6 py-3 text-xs font-bold text-t-main uppercase">
                  {p.name}
                </td>
                <td className="px-6 py-3 text-[10px] text-t-muted uppercase font-bold tracking-widest">
                  {p.category?.name}
                </td>
                <td className="px-6 py-3 font-mono font-bold text-xs text-t-main">
                  {p.stock} unités
                </td>
                <td className="px-6 py-3">
                  {p.stock <= 0 ? (
                    <span className="px-2 py-0.5 border border-red-200 bg-red-50 text-red-600 text-[8px] font-bold uppercase tracking-widest">
                      Rupture
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 border border-amber-200 bg-amber-50 text-amber-600 text-[8px] font-bold uppercase tracking-widest">
                      Faible
                    </span>
                  )}
                </td>
              </tr>
            ))
          )}
        </DataTable>
      </div>
    </div>
  );
}
