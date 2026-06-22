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
} from "recharts";
import {
  DollarSign,
  Ticket,
  Users,
  FileDown,
  FileText,
  Ban,
} from "lucide-react";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";
import api from "../../utils/api";

// Common UI Imports
import StatCard from "../common/StatCard";
import Button from "../common/Button";
import DataTable from "../common/DataTable";

const COLORS = ["#d4af37", "#f59e0b", "#fbbf24", "#fcd34d", "#fef08a"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950 border border-amber-500/30 p-4 text-xs shadow-2xl">
        <p className="font-bold text-amber-500 uppercase tracking-widest mb-2 border-b border-slate-800 pb-2">
          {label}
        </p>
        {payload.map((pld, index) => (
          <div
            key={index}
            className="flex justify-between gap-4 mt-2 font-mono"
          >
            <span className="text-slate-400">{pld.name}:</span>
            <span className="font-bold text-amber-400">
              {pld.name.includes("Revenue") ? "$" : ""}
              {Number(pld.value).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsView() {
  const [filterPeriod, setFilterPeriod] = useState("today"); // Changed default to 'today' for better initial load speed
  const [isLoading, setIsLoading] = useState(true);

  const [reportData, setReportData] = useState({
    summary: {
      totalRevenue: 0,
      totalServicesSold: 0,
      avgTransaction: 0,
      lostClientsCount: 0,
      potentialLossAmount: 0,
    },
    charts: { barberRevenueData: [], serviceDistributionData: [] },
    history: [],
    canceledHistory: [], // New state array
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

  // --- EXPORTS ---
  const handleExportCSV = () => {
    if (reportData.history.length === 0)
      return toast.error("Aucune donnée à exporter");

    const headers = "TicketID,Client,Barber,Service,Price,Date,Status\n";

    const validRows = reportData.history
      .map(
        (t) =>
          `${t.id},"${t.clientName}","${t.barber}","${t.service}",${t.price},"${new Date(t.date).toLocaleDateString()}","Payé"`,
      )
      .join("\n");

    const canceledRows = reportData.canceledHistory
      .map(
        (t) =>
          `${t.id},"${t.clientName}","${t.barber}","${t.service}",${t.price},"${new Date(t.date).toLocaleDateString()}","Annulé"`,
      )
      .join("\n");

    const blob = new Blob([headers + validRows + "\n" + canceledRows], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      "download",
      `Picasso_Rapport_${filterPeriod.toUpperCase()}.csv`,
    );
    link.click();
  };

  const handleExportPDF = () => {
    if (reportData.history.length === 0)
      return toast.error("Aucune donnée à exporter");

    const doc = new jsPDF();
    doc.text(
      `Sallon Picasso - Rapport (${filterPeriod.toUpperCase()})`,
      14,
      22,
    );
    doc.setFontSize(10);
    doc.text(`Généré le: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableRows = reportData.history.map((t) => [
      t.id,
      t.clientName,
      t.barber,
      t.service,
      `DZD ${Number(t.price).toFixed(2)}`,
    ]);

    doc.autoTable({
      head: [["ID", "Client", "Barber", "Service", "Prix (DZD )"]],
      body: tableRows,
      startY: 40,
      headStyles: {
        fillColor: [20, 20, 20],
        textColor: [212, 175, 55],
        lineWidth: 0.1,
      },
      styles: { font: "helvetica", fontSize: 9 },
    });

    const finalY = doc.lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.text(
      `Chiffre d'affaires: DZD ${reportData.summary.totalRevenue.toFixed(2)}`,
      14,
      finalY + 10,
    );
    doc.save(`Picasso_Rapport_${filterPeriod.toUpperCase()}.pdf`);
  };

  return (
    <div className="space-y-8">
      {/* --- EN-TÊTE FILTRES --- */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-slate-900 border border-slate-800 p-6 relative overflow-hidden">
        <div>
          <h2 className="text-xl font-serif font-bold text-slate-100 tracking-widest uppercase">
            Ventes & Statistiques
          </h2>
          <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mt-1">
            Analyse des performances du salon
          </p>
        </div>

        <div className="flex bg-slate-950 border border-slate-800 p-1 mt-4 md:mt-0">
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
                    ? "MOIS"
                    : "ANNÉE"}
            </Button>
          ))}
        </div>
      </div>

      {/* --- STAT CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={DollarSign}
          label="Chiffre d'Affaires"
          value={`$${reportData.summary.totalRevenue.toFixed(2)}`}
          colorClass="text-green-500"
          highlight={true}
        />
        <StatCard
          icon={Ticket}
          label="Prestations"
          value={reportData.summary.totalServicesSold}
          colorClass="text-slate-100"
        />
        <StatCard
          icon={Users}
          label="Panier Moyen"
          value={`$${reportData.summary.avgTransaction.toFixed(2)}`}
          colorClass="text-amber-500"
        />
        <StatCard
          icon={Ban}
          label="Pertes (Annulations)"
          value={`$${(reportData.summary.potentialLossAmount || 0).toFixed(2)}`}
          colorClass="text-red-500"
          highlight={false}
        />
      </div>

      {/* --- GRAPHIQUES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 p-6">
          <h2 className="text-sm font-bold tracking-widest text-amber-500 uppercase mb-8 border-b border-slate-800 pb-4">
            Revenu par Barbier
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={reportData.charts.barberRevenueData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={10}
                fontWeight="bold"
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickFormatter={(value) => `DZD ${value}`}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(212, 175, 55, 0.05)" }}
              />
              <Bar
                dataKey="Revenue (DZD )"
                fill="#d4af37"
                radius={[0, 0, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 flex flex-col items-center">
          <h2 className="text-sm font-bold tracking-widest text-amber-500 uppercase mb-4 w-full text-left border-b border-slate-800 pb-4">
            Popularité des Services
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData.charts.serviceDistributionData}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                stroke="none"
                fill="#d4af37"
                labelLine={false}
              >
                {reportData.charts.serviceDistributionData.map(
                  (entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ),
                )}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- TABLE: REVENUS --- */}
      <div className="bg-slate-900 border border-slate-800">
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-serif font-bold text-green-500 uppercase tracking-widest">
              Factures Encaissées
            </h2>
            <p className="text-slate-400 text-[10px] tracking-widest font-bold uppercase mt-1">
              Transactions validées
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="csv"
              onClick={handleExportCSV}
              className="text-xs py-2 px-4"
            >
              <FileText
                size={14}
                className="mr-2 bg-green500/10  hover:bg-green500/20 text-green-400 hover:text-green-300"
              />{" "}
              EXPORT CSV
            </Button>
            <Button
              variant="pdf"
              onClick={handleExportPDF}
              className="text-xs py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300"
            >
              <FileDown size={14} className="mr-2" /> EXPORT PDF
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-amber-500 animate-pulse uppercase tracking-widest text-sm font-bold">
            Traitement...
          </div>
        ) : (
          <DataTable
            headers={[
              { label: "Réf" },
              { label: "Client" },
              { label: "Barbier" },
              { label: "Service" },
              { label: "Payé", align: "right" },
            ]}
          >
            {reportData.history.length > 0 ? (
              reportData.history.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-6 py-4 font-mono font-bold text-slate-500 text-xs">
                    #{ticket.id}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-200 uppercase text-xs">
                    {ticket.clientName}
                  </td>
                  <td className="px-6 py-4 text-slate-400 uppercase tracking-widest text-[10px] font-bold">
                    {ticket.barber}
                  </td>
                  <td className="px-6 py-4 text-slate-300 italic text-xs">
                    {ticket.service || "-"}
                  </td>
                  <td className="px-6 py-4 text-right text-green-400 font-mono font-bold">
                    DZD {Number(ticket.price).toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-8 text-slate-600 font-bold uppercase tracking-widest text-xs"
                >
                  Aucune transaction
                </td>
              </tr>
            )}
          </DataTable>
        )}
      </div>

      {/* --- TABLE: PERTES / ANNULATIONS --- */}
      <div className="bg-slate-900 border border-slate-800 mt-8">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-lg font-serif font-bold text-red-500 uppercase tracking-widest">
            Journal des Pertes (Annulations & Absents)
          </h2>
          <p className="text-slate-400 text-[10px] tracking-widest font-bold uppercase mt-1">
            Total de {reportData.summary.lostClientsCount} clients perdus
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-amber-500 animate-pulse uppercase tracking-widest text-sm font-bold">
            Traitement...
          </div>
        ) : (
          <DataTable
            headers={[
              { label: "Réf" },
              { label: "Client" },
              { label: "Barbier Assigné" },
              { label: "Heure" },
              { label: "Perte Estimée", align: "right" },
            ]}
          >
            {reportData.canceledHistory?.length > 0 ? (
              reportData.canceledHistory.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b border-slate-800/50 hover:bg-red-900/10 transition-colors"
                >
                  <td className="px-6 py-4 font-mono font-bold text-slate-500 text-xs">
                    #{ticket.id}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-200 uppercase text-xs">
                    {ticket.clientName}
                  </td>
                  <td className="px-6 py-4 text-slate-400 uppercase tracking-widest text-[10px] font-bold">
                    {ticket.barber}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                    {new Date(ticket.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right text-red-500 font-mono font-bold">
                    DZD {Number(ticket.price).toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-8 text-slate-600 font-bold uppercase tracking-widest text-xs"
                >
                  Aucune perte enregistrée
                </td>
              </tr>
            )}
          </DataTable>
        )}
      </div>
    </div>
  );
}
