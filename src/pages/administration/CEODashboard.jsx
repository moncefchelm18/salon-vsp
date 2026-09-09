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
  Scissors,
  Coffee,
  Coins,
  Receipt,
  User,
  TrendingDown,
  Wallet,
  Building2,
  Sparkles,
  FileDown,
  FileText,
  BookOpen,
} from "lucide-react";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";
import api from "../../utils/api";

import StatCard from "../../components/common/StatCard";
import Button from "../../components/common/Button";
import DataTable from "../../components/common/DataTable";

const formatMoney = (val) => {
  const num = Number(val);
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

export default function CEODashboard() {
  const [filterPeriod, setFilterPeriod] = useState("today");
  const [isLoading, setIsLoading] = useState(true);

  const [ceoData, setCeoData] = useState({
    summary: {
      totalSalonRevenue: 0,
      totalCafeRevenue: 0,
      grossRevenue: 0,
      totalBarberCommissions: 0,
      totalOpex: 0,
      netProfit: 0,
      marginPercentage: 0,
    },
    charts: { timelineData: [] },
    ledger: [],
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

  // --- EXPORTS OFFICIELS (PDF & CSV) ---
  const handleExportCSV = () => {
    if (!ceoData.ledger || ceoData.ledger.length === 0) {
      return toast.error("Aucune donnée à exporter.");
    }

    const headers =
      "Date,Pole,Reference,Designation,CA_Brut_DZD,Part_Coiffeur_DZD,Depense_OPEX_DZD,Gain_Net_Salon_DZD\n";
    const rows = ceoData.ledger
      .map(
        (item) =>
          `"${new Date(item.date).toLocaleString("fr-FR")}","${item.pole}","${item.ref}","${item.label}",${item.gross},${item.barberCut},${item.expense},${item.net}`,
      )
      .join("\n");

    const blob = new Blob([headers + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      "download",
      `Bilan_CEO_Salon_VSP_${filterPeriod.toUpperCase()}.csv`,
    );
    link.click();
  };

  const handleExportPDF = () => {
    if (!ceoData.ledger || ceoData.ledger.length === 0) {
      return toast.error("Aucune donnée à exporter.");
    }

    const doc = new jsPDF();
    doc.text(
      `Salon VSP - Bilan Financier Propriétaire (${filterPeriod.toUpperCase()})`,
      14,
      20,
    );
    doc.setFontSize(9);
    doc.text(`Date d'audit : ${new Date().toLocaleString("fr-FR")}`, 14, 28);
    doc.text(
      `Bénéfice Net Réel : DZD ${formatMoney(ceoData.summary.netProfit)}`,
      14,
      34,
    );

    const tableRows = ceoData.ledger.map((row) => [
      new Date(row.date).toLocaleDateString("fr-FR"),
      row.pole,
      row.ref,
      row.label,
      `DZD ${formatMoney(row.gross)}`,
      `- DZD ${formatMoney(row.barberCut)}`,
      `- DZD ${formatMoney(row.expense)}`,
      `DZD ${formatMoney(row.net)}`,
    ]);

    doc.autoTable({
      head: [
        [
          "Date",
          "Pôle",
          "Réf",
          "Désignation",
          "CA Brut",
          "Part Coiffeur",
          "Charge",
          "Net Salon",
        ],
      ],
      body: tableRows,
      startY: 40,
      headStyles: { fillColor: [15, 23, 42], textColor: [212, 175, 55] },
      styles: { fontSize: 7 },
    });

    doc.save(`Bilan_CEO_Salon_VSP_${filterPeriod.toUpperCase()}.pdf`);
  };

  const s = ceoData?.summary || {};

  return (
    <div className="space-y-6">
      {/* ── 1. EN-TÊTE ET FILTRE DE PÉRIODE ── */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-surface border border-subtle p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-serif font-bold text-t-main flex items-center gap-2 uppercase tracking-widest">
            <User className="text-brand" size={24} /> Bilan Financier
            Propriétaire (CEO)
          </h2>
          <p className="text-xs font-bold text-t-muted uppercase tracking-wider mt-1">
            Revenus consolidés déduits des commissions coiffeurs et des charges
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
                    ? "Ce Mois"
                    : "Année"}
            </Button>
          ))}
        </div>
      </div>

      {/* ── 2. LES 4 PILIERS DU PATRON ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Coins}
          label="Chiffre d'Affaires Global (CA)"
          value={`DZD ${formatMoney(s.grossRevenue)}`}
          highlight={true}
        />
        <StatCard
          icon={Scissors}
          label="Rémunération Coiffeurs (50%)"
          value={`- DZD ${formatMoney(s.totalBarberCommissions)}`}
          colorClass="text-blue-400"
        />
        <StatCard
          icon={TrendingDown}
          label="Charges Fixes & Achats (OPEX)"
          value={`- DZD ${formatMoney(s.totalOpex)}`}
          colorClass="text-red-500"
        />
        <StatCard
          icon={Sparkles}
          label="Rentabilité d'Exploitation"
          value={`${Number(s.marginPercentage || 0).toFixed(1)}%`}
          colorClass="text-emerald-400"
        />
      </div>

      {/* ── 3. GRAPHIQUE ÉVOLUTIF (REVENUS VS CHARGES) ── */}
      <div className="bg-surface border border-subtle p-6 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-widest text-t-muted border-b border-subtle pb-3 mb-6">
          Évolution des Flux : Revenus Totaux vs Dépenses Globales
        </h3>
        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={ceoData.charts?.timelineData || []}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                tick={{ fill: "#ffffff", fontSize: 10, fontWeight: "bold" }}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: "#ffffff", fontSize: 10, fontWeight: "bold" }}
              />
              <Tooltip />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                formatter={(val) => (
                  <span className="text-white text-xs font-bold uppercase tracking-wider">
                    {val}
                  </span>
                )}
              />
              <Area
                name="Revenus Totaux (Salon + Café)"
                type="monotone"
                dataKey="Revenu"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRev)"
              />
              <Area
                name="Charges Fixes Enregistrées"
                type="monotone"
                dataKey="Charges"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorExp)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 4. COMPTE DE RÉSULTAT ET ÉCRAN LED DU BÉNÉFICE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
        <div className="lg:col-span-3 bg-surface border border-subtle p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest text-brand border-b border-subtle pb-3 flex items-center gap-2">
            <Receipt size={18} /> Compte de Résultat Consolidé (P&amp;L)
          </h3>

          <div className="space-y-3 font-mono text-xs pt-1">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-2">
                <Scissors size={14} className="text-brand" /> Chiffre d'Affaires
                Coiffure (Salon) :
              </span>
              <span className="font-bold">
                DZD {formatMoney(s.totalSalonRevenue)}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-2">
                <Coffee size={14} className="text-amber-500" /> Chiffre
                d'Affaires Cafétéria :
              </span>
              <span className="font-bold">
                DZD {formatMoney(s.totalCafeRevenue)}
              </span>
            </div>

            <div className="flex justify-between items-center border-t border-slate-800 pt-2 font-bold text-t-main text-sm">
              <span>(=) Total Chiffre d'Affaires Encaissé :</span>
              <span className="text-brand">
                DZD {formatMoney(s.grossRevenue)}
              </span>
            </div>

            <div className="flex justify-between items-center text-blue-400 pt-1 font-bold border-b border-slate-800/80 pb-2 border-dashed">
              <span className="flex items-center gap-1.5">
                <Scissors size={13} /> (-) Part des Coiffeurs (Commissions 50%
                MO) :
              </span>
              <span>- DZD {formatMoney(s.totalBarberCommissions)}</span>
            </div>

            <div className="flex justify-between items-center text-red-500 pt-1">
              <span className="flex items-center gap-1.5">
                <Building2 size={13} /> (-) Charges Fixes &amp; Achats Stock
                (OPEX) :
              </span>
              <span>- DZD {formatMoney(s.totalOpex)}</span>
            </div>
          </div>
        </div>

        {/* CADRAN DU BÉNÉFICE NET NET (ÉCRAN LED POS GÉANT) */}
        <div className="lg:col-span-2 bg-surface border border-subtle p-6 flex flex-col justify-between items-center text-center shadow-sm">
          <div className="w-full border-b border-subtle pb-3">
            <h4 className="text-xs font-bold text-t-muted uppercase tracking-widest flex items-center justify-center gap-2">
              <Wallet size={16} className="text-green-400" /> Bénéfice Net Réel
              Propriétaire
            </h4>
          </div>

          <div className="bg-[#0a0a0a] p-6 border-4 border-slate-800 rounded-sm w-full flex flex-col justify-center items-center shadow-inner my-auto">
            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">
              Dans la poche du patron ({filterPeriod.toUpperCase()})
            </span>
            <span
              className={`text-4xl font-mono font-black tracking-wider ${
                s.netProfit >= 0
                  ? "text-[#00ff00] drop-shadow-[0_0_10px_rgba(0,255,0,0.4)]"
                  : "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]"
              }`}
            >
              {s.netProfit >= 0 ? "+" : "-"} DZD{" "}
              {formatMoney(Math.abs(s.netProfit))}
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2">
              Après déduction barbiers &amp; charges
            </span>
          </div>

          <p className="text-[11px] text-t-muted italic max-w-[280px] leading-relaxed">
            Ce montant reflète la{" "}
            <strong>véritable rentabilité financière</strong> du propriétaire
            une fois les coiffeurs (50%) et toutes les charges payées.
          </p>
        </div>
      </div>

      {/* ── 5. LE GRAND LIVRE D'AUDIT DU PATRON (TABLEAU EXPORTABLE CSV & PDF) ── */}
      <div className="bg-surface border border-subtle shadow-sm overflow-hidden">
        <div className="p-4 border-b border-subtle flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-main/40">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-brand flex items-center gap-2">
              <BookOpen size={16} /> Grand Livre Journal Consolidé (Audit
              Financier)
            </h3>
            <p className="text-[10px] text-t-muted uppercase font-bold mt-0.5">
              Historique chronologique de chaque dinar encaissé et décaissé
            </p>
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

        <DataTable
          headers={[
            { label: "Date & Heure" },
            { label: "Pôle" },
            { label: "Réf" },
            { label: "Désignation" },
            { label: "Entrée (CA)", align: "right" },
            { label: "Part Barbier (-)", align: "right" },
            { label: "Charge (-)", align: "right" },
            { label: "Gain Net Salon (=)", align: "right" },
          ]}
        >
          {!ceoData.ledger || ceoData.ledger.length === 0 ? (
            <tr>
              <td
                colSpan="8"
                className="text-center py-10 text-t-muted font-bold text-xs uppercase"
              >
                Aucune écriture comptable pour cette période.
              </td>
            </tr>
          ) : (
            ceoData.ledger.map((row) => (
              <tr
                key={row.id}
                className="border-b border-subtle hover:bg-brand/5 transition-colors"
              >
                <td className="px-6 py-4 text-xs font-mono text-t-muted">
                  {new Date(row.date).toLocaleDateString("fr-FR")}{" "}
                  {new Date(row.date).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>

                {/* BADGE DE PÔLE */}
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-2.5 py-1 text-[9px] font-bold uppercase border ${
                      row.pole === "COIFFURE"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : row.pole === "CAFÉ"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                  >
                    {row.pole}
                  </span>
                </td>

                <td className="px-6 py-4 font-mono font-bold text-brand text-xs">
                  {row.ref}
                </td>

                <td className="px-6 py-4 font-bold text-t-main text-xs uppercase max-w-[250px] truncate">
                  {row.label}
                </td>

                {/* ENTRÉE */}
                <td className="px-6 py-4 text-right font-mono font-bold text-xs text-green-400">
                  {row.gross > 0 ? `+ DZD ${formatMoney(row.gross)}` : "—"}
                </td>

                {/* PART BARBIER */}
                <td className="px-6 py-4 text-right font-mono font-bold text-xs text-blue-400">
                  {row.barberCut > 0
                    ? `- DZD ${formatMoney(row.barberCut)}`
                    : "—"}
                </td>

                {/* CHARGE FIXE / OPEX */}
                <td className="px-6 py-4 text-right font-mono font-bold text-xs text-red-400">
                  {row.expense > 0 ? `- DZD ${formatMoney(row.expense)}` : "—"}
                </td>

                {/* GAIN NET SALON */}
                <td className="px-6 py-4 text-right font-mono font-black text-xs">
                  <span
                    className={row.net >= 0 ? "text-[#00ff00]" : "text-red-500"}
                  >
                    {row.net >= 0 ? "+" : "-"} DZD{" "}
                    {formatMoney(Math.abs(row.net))}
                  </span>
                </td>
              </tr>
            ))
          )}
        </DataTable>
      </div>
    </div>
  );
}
