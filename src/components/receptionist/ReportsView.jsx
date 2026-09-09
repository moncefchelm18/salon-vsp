import { useState, useEffect } from "react";
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
} from "recharts";
import {
  DollarSign,
  Ticket,
  Users,
  FileDown,
  FileText,
  Ban,
  CheckCircle,
  Gift,
  Tag,
  TrendingUp,
  Trophy,
  Award,
  Crown,
} from "lucide-react";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";
import api from "../../utils/api";

// Common UI Imports
import StatCard from "../common/StatCard";
import Button from "../common/Button";
import DataTable from "../common/DataTable";

const PIE_COLORS = [
  "#d4af37",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
];

// Helper infaillible pour formater l'argent sans jamais crasher
const safeNumber = (val) => {
  const num = Number(val);
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

// Tooltip personnalisé pour les graphiques
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950 border-2 border-slate-800 p-3 shadow-2xl space-y-1">
        <p className="font-bold text-amber-400 uppercase tracking-widest text-[11px] border-b border-slate-800 pb-1 mb-1.5">
          {label || payload[0].name}
        </p>
        {payload.map((p, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center gap-4 text-xs font-mono"
          >
            <span className="text-slate-400">{p.name} :</span>
            <span className="font-bold" style={{ color: p.color || "#fff" }}>
              {p.dataKey === "value"
                ? `${p.value} coupes`
                : `DZD ${Number(p.value).toFixed(2)}`}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsView() {
  const [filterPeriod, setFilterPeriod] = useState("today");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTableTab, setActiveTableTab] = useState("paid"); // 'paid' ou 'canceled'

  const [reportData, setReportData] = useState({
    summary: {
      totalRevenue: 0,
      totalTips: 0,
      totalDiscounts: 0,
      totalServicesSold: 0,
      avgTransaction: 0,
      lostClientsCount: 0,
      potentialLossAmount: 0,
    },
    charts: { barberRevenueData: [], serviceDistributionData: [] },
    topBarbers: [],
    history: [],
    canceledHistory: [],
  });

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/reports/dashboard?period=${filterPeriod}`);
      setReportData(res.data);
    } catch (error) {
      toast.error("Échec du chargement des statistiques.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [filterPeriod]);

  // --- EXPORTS CSV / PDF ---
  const handleExportCSV = () => {
    const dataToExport =
      activeTableTab === "paid"
        ? reportData.history
        : reportData.canceledHistory;
    if (dataToExport.length === 0)
      return toast.error("Aucune donnée à exporter.");

    const headers = "ID,Numero,Client,Barbier,Prestation,Prix_DZD,Date\n";
    const rows = dataToExport
      .map(
        (t) =>
          `${t.id},"${t.queueNumber || t.id}","${t.clientName}","${t.barber}","${t.service}",${t.price},"${new Date(t.date).toLocaleDateString()}"`,
      )
      .join("\n");

    const blob = new Blob([headers + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `VSP_${activeTableTab}_${filterPeriod}.csv`);
    link.click();
  };

  const handleExportPDF = () => {
    const dataToExport =
      activeTableTab === "paid"
        ? reportData.history
        : reportData.canceledHistory;
    if (dataToExport.length === 0)
      return toast.error("Aucune donnée à exporter.");

    const doc = new jsPDF();
    doc.text(
      `Salon VSP - ${activeTableTab === "paid" ? "Factures Encaissées" : "Pertes & Annulations"} (${filterPeriod.toUpperCase()})`,
      14,
      20,
    );
    doc.setFontSize(9);
    doc.text(`Date d'export : ${new Date().toLocaleString("fr-FR")}`, 14, 28);

    const tableRows = dataToExport.map((t) => [
      `#${t.queueNumber || t.id}`,
      t.clientName,
      t.barber,
      t.service,
      `DZD ${Number(t.price).toFixed(2)}`,
      new Date(t.date).toLocaleDateString("fr-FR"),
    ]);

    doc.autoTable({
      head: [
        ["N° Ticket", "Client", "Barbier", "Prestation", "Montant", "Date"],
      ],
      body: tableRows,
      startY: 35,
      headStyles: { fillColor: [15, 23, 42], textColor: [212, 175, 55] },
      styles: { fontSize: 8 },
    });

    doc.save(`VSP_Rapport_${activeTableTab}_${filterPeriod}.pdf`);
  };

  const s = reportData?.summary || {};

  return (
    <div className="space-y-6">
      {/* ── 1. EN-TÊTE ET FILTRE DE PÉRIODE ── */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-surface border border-subtle p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-serif font-bold text-t-main tracking-widest uppercase flex items-center gap-2">
            <TrendingUp size={22} className="text-brand" /> Rapports d'Activité
            & Ventes
          </h2>
          <p className="text-xs uppercase font-bold text-t-muted tracking-wider mt-1">
            Statistiques consolidées de l'espace coiffure
          </p>
        </div>

        <div className="flex bg-main border border-subtle p-1 mt-4 md:mt-0">
          {["today", "week", "month", "year"].map((p) => (
            <Button
              key={p}
              variant={filterPeriod === p ? "primary" : "ghost"}
              onClick={() => setFilterPeriod(p)}
              className="text-[10px] py-2 px-5 font-bold uppercase"
            >
              {p === "today"
                ? "Aujourd'hui"
                : p === "week"
                  ? "Semaine"
                  : p === "month"
                    ? "Mois"
                    : "Année"}
            </Button>
          ))}
        </div>
      </div>

      {/* ── 2. CARTES DE STATISTIQUES (SÉCURISÉES CONTRE LES CRASHS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          icon={DollarSign}
          label="Chiffre d'Affaires Net"
          value={`DZD ${safeNumber(s.totalRevenue)}`}
          colorClass="text-green-500"
          highlight={true}
        />
        <StatCard
          icon={Gift}
          label="Pourboires Reçus"
          value={`+ DZD ${safeNumber(s.totalTips)}`}
          colorClass="text-emerald-400"
        />
        <StatCard
          icon={Tag}
          label="Remises Accordées"
          value={`- DZD ${safeNumber(s.totalDiscounts)}`}
          colorClass="text-red-400"
        />
        <StatCard
          icon={Ticket}
          label="Prestations Réalisées"
          value={`${s.totalServicesSold || 0} coupes`}
          colorClass="text-slate-100"
        />
        <StatCard
          icon={Ban}
          label="Pertes (Clients Perdus)"
          value={`DZD ${safeNumber(s.potentialLossAmount)}`}
          colorClass="text-red-500"
        />
      </div>

      {/* ── 3. LES DEUX GRAPHIQUES (CA/TIPS & PRESTATIONS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
        {/* GRAPHIQUE 1 : REVENUS & POURBOIRES PAR BARBIER (7 colonnes) */}
        <div className="lg:col-span-7 bg-surface border border-subtle p-6 shadow-sm flex flex-col justify-between min-w-0">
          <div className="border-b border-subtle pb-3 mb-4 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold tracking-widest text-brand uppercase">
                Performances des Barbiers (CA & Tips)
              </h3>
              <p className="text-[10px] text-t-muted uppercase font-bold">
                Chiffre d'affaires en or • Pourboires en vert
              </p>
            </div>
          </div>

          <div className="w-full h-[280px]">
            {!reportData.charts.barberRevenueData ||
            reportData.charts.barberRevenueData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-t-muted font-bold text-xs uppercase border border-dashed border-subtle">
                Aucune vente enregistrée pour cette période
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportData.charts.barberRevenueData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                    vertical={false}
                  />
                  {/* TEXTE BLANC NET SUR LES AXES X ET Y */}
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    tick={{ fill: "#ffffff", fontSize: 11, fontWeight: "bold" }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: "#ffffff", fontSize: 11, fontWeight: "bold" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {/* LÉGENDE EN BLANC ÉCLATANT */}
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-white text-xs font-bold uppercase tracking-wider">
                        {value}
                      </span>
                    )}
                  />
                  <Bar
                    dataKey="revenu"
                    name="Chiffre d'Affaires"
                    fill="var(--theme-brand)"
                    radius={[0, 0, 0, 0]}
                    barSize={26}
                  />
                  <Bar
                    dataKey="tips"
                    name="Pourboires"
                    fill="#10b981"
                    radius={[0, 0, 0, 0]}
                    barSize={26}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* GRAPHIQUE 2 : TOP COIFFURES (5 colonnes) */}
        <div className="lg:col-span-5 bg-surface border border-subtle p-6 shadow-sm flex flex-col justify-between min-w-0">
          <div className="border-b border-subtle pb-3 mb-4">
            <h3 className="text-xs font-bold tracking-widest text-brand uppercase">
              Top Prestations (Répartition)
            </h3>
            <p className="text-[10px] text-t-muted uppercase font-bold">
              Services les plus demandés au salon
            </p>
          </div>

          <div className="w-full h-[280px] flex items-center justify-center">
            {!reportData.charts.serviceDistributionData ||
            reportData.charts.serviceDistributionData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-t-muted font-bold text-xs uppercase border border-dashed border-subtle">
                Aucun service réalisé
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.charts.serviceDistributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    stroke="#0f172a"
                    strokeWidth={2}
                  >
                    {reportData.charts.serviceDistributionData.map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ),
                    )}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  {/* LÉGENDE EN BLANC ÉCLATANT (FINI LE NOIR ILLISIBLE) */}
                  <Legend
                    verticalAlign="bottom"
                    height={40}
                    iconType="circle"
                    formatter={(val) => (
                      <span className="text-white text-xs font-bold uppercase tracking-wider">
                        {val}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. NOUVEAU WIDGET : CLASSEMENT DES MEILLEURS COIFFEURS (TOP BARBERS) ── */}
      <div className="bg-surface border border-subtle shadow-sm overflow-hidden">
        <div className="p-4 border-b border-subtle bg-main/40 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-brand flex items-center gap-2">
              <Trophy className="text-amber-400" size={18} /> Classement de
              l'Équipe (Top Coiffeurs)
            </h3>
            <p className="text-[10px] text-t-muted uppercase font-bold mt-0.5">
              Détail des pourboires, chiffre d'affaires et commissions par
              barbier
            </p>
          </div>
        </div>

        <DataTable
          headers={[
            { label: "Rang" },
            { label: "Coiffeur" },
            { label: "Poste" },
            { label: "Coupes Réalisées" },
            { label: "Pourboires (Tips)", align: "right" },
            { label: "CA Généré", align: "right" },
            { label: "Part Barbier (50% + Tips)", align: "right" },
          ]}
        >
          {!reportData.topBarbers || reportData.topBarbers.length === 0 ? (
            <tr>
              <td
                colSpan="7"
                className="text-center py-10 text-t-muted font-bold text-xs uppercase"
              >
                Aucune coupe enregistrée pour cette période.
              </td>
            </tr>
          ) : (
            reportData.topBarbers.map((barber, index) => (
              <tr
                key={barber.name}
                className="border-b border-subtle hover:bg-brand/5 transition-colors"
              >
                {/* RANG DU COIFFEUR */}
                <td className="px-6 py-4 font-mono font-bold text-sm">
                  {index === 0 ? (
                    <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                      <Crown size={16} /> 1er
                    </span>
                  ) : index === 1 ? (
                    <span className="inline-flex items-center gap-1 text-slate-300 font-bold">
                      <Award size={16} /> 2e
                    </span>
                  ) : index === 2 ? (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                      <Award size={16} /> 3e
                    </span>
                  ) : (
                    <span className="text-t-muted">#{index + 1}</span>
                  )}
                </td>

                <td className="px-6 py-4 font-bold text-t-main uppercase text-xs">
                  {barber.name}
                </td>

                <td className="px-6 py-4 font-mono text-xs font-bold text-t-muted">
                  Poste {barber.poste}
                </td>

                <td className="px-6 py-4 font-mono font-bold text-xs text-t-main">
                  {barber.clientsCount} clients
                </td>

                {/* POURBOIRES DU COIFFEUR */}
                <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400 text-xs">
                  {barber.tips > 0 ? `+ DZD ${barber.tips.toFixed(2)}` : "—"}
                </td>

                {/* CA TOTAL */}
                <td className="px-6 py-4 text-right font-mono font-bold text-brand text-sm">
                  DZD {barber.revenu.toFixed(2)}
                </td>

                {/* COMMISSION REÇUE PAR LE COIFFEUR */}
                <td className="px-6 py-4 text-right font-mono font-bold text-[#00ff00] text-sm">
                  DZD {barber.commission.toFixed(2)}
                </td>
              </tr>
            ))
          )}
        </DataTable>
      </div>

      {/* ── 5. NAVIGATION PAR ONGLETS POUR LES FACTURES & PERTES ── */}
      <div className="bg-surface border border-subtle shadow-sm overflow-hidden">
        <div className="p-4 border-b border-subtle flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-main/30">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTableTab("paid")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border ${
                activeTableTab === "paid"
                  ? "bg-green-600 text-white border-green-600 shadow-md"
                  : "bg-surface text-t-muted border-subtle hover:text-t-main"
              }`}
            >
              <CheckCircle size={15} /> Factures Encaissées (
              {reportData.history.length})
            </button>

            <button
              onClick={() => setActiveTableTab("canceled")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border ${
                activeTableTab === "canceled"
                  ? "bg-red-600 text-white border-red-600 shadow-md"
                  : "bg-surface text-t-muted border-subtle hover:text-t-main"
              }`}
            >
              <Ban size={15} /> Pertes & Annulations (
              {reportData.canceledHistory.length})
            </button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="text-xs py-2 px-4 border-subtle"
            >
              <FileText size={14} className="mr-1 text-green-500" /> Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              className="text-xs py-2 px-4 border-subtle"
            >
              <FileDown size={14} className="mr-1 text-red-500" /> Export PDF
            </Button>
          </div>
        </div>

        {/* ── TABLEAU ACTIF AVEC PAGINATION ── */}
        {activeTableTab === "paid" ? (
          <DataTable
            headers={[
              { label: "N° Ticket" },
              { label: "Date & Heure" },
              { label: "Client" },
              { label: "Barbier" },
              { label: "Prestation" },
              { label: "Pourboire", align: "right" },
              { label: "Montant Net", align: "right" },
            ]}
          >
            {reportData.history.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="text-center py-12 text-t-muted font-bold text-xs uppercase"
                >
                  Aucune facture enregistrée pour cette période
                </td>
              </tr>
            ) : (
              reportData.history.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b border-subtle hover:bg-brand/5 transition-colors"
                >
                  <td className="px-6 py-4 font-mono font-bold text-brand text-xs">
                    #{ticket.queueNumber || ticket.id}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-t-muted">
                    {new Date(ticket.date).toLocaleDateString("fr-FR")}{" "}
                    {new Date(ticket.date).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 font-bold text-t-main uppercase text-xs">
                    {ticket.clientName}
                  </td>
                  <td className="px-6 py-4 text-t-muted uppercase text-xs font-bold">
                    {ticket.barber}
                  </td>
                  <td className="px-6 py-4 text-t-main italic text-xs">
                    {ticket.service}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-xs text-green-400">
                    {ticket.tip > 0
                      ? `+ DZD ${Number(ticket.tip).toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {ticket.discountAmount > 0 ? (
                      <div className="flex flex-col items-end">
                        <span className="text-slate-500 line-through text-[9px] font-mono">
                          DZD {ticket.originalPrice?.toFixed(2)}
                        </span>
                        <span className="font-mono font-bold text-green-500 text-sm">
                          DZD {Number(ticket.price).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono font-bold text-green-500 text-sm">
                        DZD {Number(ticket.price).toFixed(2)}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </DataTable>
        ) : (
          <DataTable
            headers={[
              { label: "N° Ticket" },
              { label: "Date & Heure" },
              { label: "Client" },
              { label: "Barbier Assigné" },
              { label: "Prestation Annulée" },
              { label: "Perte Estimée", align: "right" },
            ]}
          >
            {reportData.canceledHistory.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-12 text-t-muted font-bold text-xs uppercase"
                >
                  Aucun client perdu ni ticket annulé !
                </td>
              </tr>
            ) : (
              reportData.canceledHistory.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b border-subtle hover:bg-red-500/5 transition-colors"
                >
                  <td className="px-6 py-4 font-mono font-bold text-red-500 text-xs">
                    #{ticket.queueNumber || ticket.id}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-t-muted">
                    {new Date(ticket.date).toLocaleDateString("fr-FR")}{" "}
                    {new Date(ticket.date).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 font-bold text-t-main uppercase text-xs">
                    {ticket.clientName}
                  </td>
                  <td className="px-6 py-4 text-t-muted uppercase text-xs font-bold">
                    {ticket.barber}
                  </td>
                  <td className="px-6 py-4 text-slate-400 italic text-xs">
                    {ticket.service}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-red-500 text-sm">
                    - DZD {Number(ticket.price).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </DataTable>
        )}
      </div>
    </div>
  );
}
