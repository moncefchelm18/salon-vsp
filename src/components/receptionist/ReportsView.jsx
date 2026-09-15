import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Receipt,
  Wallet,
  Users,
  Calendar,
  X,
  FileDown,
  FileText,
  CheckCircle,
  Ban,
  Scissors,
  Coffee,
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  Tag,
  Gift,
  HelpCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";
import api from "../../utils/api";

import Button from "../common/Button";
import DataTable from "../common/DataTable";

const formatMoney = (val) => {
  const num = Number(val);
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

export default function ReportsView() {
  const [filterPeriod, setFilterPeriod] = useState("today"); // 'today', 'yesterday', 'week', 'month', 'custom'
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Sub-tabs for reports
  const [activeReportTab, setActiveReportTab] = useState("sales"); // 'sales', 'cash', 'employees', 'tickets'
  const [ticketsSubTab, setTicketsSubTab] = useState("paid"); // 'paid' or 'canceled'

  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      let url = `/reports/financial-summary?period=${filterPeriod}`;
      if (filterPeriod === "custom" && startDate && endDate) {
        url = `/reports/financial-summary?startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await api.get(url);
      setReportData(res.data);
    } catch (error) {
      toast.error("Échec de chargement des rapports financiers.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (filterPeriod !== "custom" || (startDate && endDate)) {
      fetchReports();
    }
  }, [filterPeriod, startDate, endDate]);

  // ── EXPORT CSV UNIFIÉ DU RAPPORT ──
  const handleExportCSV = () => {
    if (!reportData) return toast.error("Aucune donnée disponible.");

    let csvContent = "";
    if (activeReportTab === "sales") {
      csvContent = "Prestation_ou_Produit,Pole,Quantite_Vendue,CA_Genere_DZD\n";
      reportData.sales.byProductService.forEach((item) => {
        csvContent += `"${item.name}","${item.category}",${item.quantity},${item.revenue}\n`;
      });
    } else if (activeReportTab === "employees") {
      csvContent =
        "Collaborateur,Poste,Coupes_Realisees,CA_Brut_DZD,Remises_DZD,CA_Net_DZD,Pourboires_DZD,Part_Coiffeur_DZD,Panier_Moyen_DZD\n";
      reportData.employees.forEach((emp) => {
        csvContent += `"${emp.name}","${emp.poste}",${emp.clientsCount},${emp.grossGenerated},${emp.discountsGiven},${emp.netGenerated},${emp.tipsCollected},${emp.commissionEarned},${emp.avgTicket}\n`;
      });
    } else if (activeReportTab === "cash") {
      const c = reportData.cash;
      csvContent =
        "Indicateur,Montant_DZD\n" +
        `"Fond de depart (Ouverture)",${c.openingBalance}\n` +
        `"Ventes encaissees (Especes)",${c.cashSales}\n` +
        `"Apports et reglements caisse",${c.cashEntries}\n` +
        `"Decaissements et retraits",${c.cashWithdrawals}\n` +
        `"Solde attendu (Theorique)",${c.expectedClosingBalance}\n` +
        `"Solde reel compte",${c.actualClosingBalance}\n` +
        `"Ecart de caisse",${c.difference}\n`;
    } else {
      const list =
        ticketsSubTab === "paid"
          ? reportData.history.paidTickets
          : reportData.history.canceledTickets;
      csvContent = "ID,Date,Client,Barbier,Prestation,Prix_DZD,Pourboire_DZD\n";
      list.forEach((t) => {
        csvContent += `"${t.queueNumber || t.id}","${new Date(t.date).toLocaleString("fr-FR")}","${t.clientName}","${t.barber}","${t.service}",${t.price},${t.tip || 0}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      "download",
      `Rapport_VSP_${activeReportTab.toUpperCase()}_${filterPeriod.toUpperCase()}.csv`,
    );
    link.click();
    toast.success("Rapport CSV téléchargé !");
  };

  // ── EXPORT PDF GLOBAL FORMAT A4 ──
  const handleExportPDF = () => {
    if (!reportData) return toast.error("Aucune donnée disponible.");

    const doc = new jsPDF({ orientation: "portrait" });
    const s = reportData.sales;
    const c = reportData.cash;

    doc.setFontSize(18);
    doc.setTextColor(156, 161, 73);
    doc.text("SALON VSP - RAPPORT FINANCIER STRUCTURÉ", 14, 20);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Période : ${filterPeriod.toUpperCase()} | Du : ${new Date(reportData.dateRange.start).toLocaleDateString("fr-FR")} Au : ${new Date(reportData.dateRange.end).toLocaleDateString("fr-FR")}`,
      14,
      27,
    );

    // Section Ventes
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("1. SYNTHÈSE DES VENTES & ENCAISSEMENTS", 14, 38);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `- Chiffre d'Affaires Brut : DZD ${formatMoney(s.totalGrossSales)}`,
      14,
      45,
    );
    doc.text(
      `- Remises accordées : - DZD ${formatMoney(s.totalDiscounts)}`,
      14,
      51,
    );
    doc.text(
      `- Chiffre d'Affaires Net : DZD ${formatMoney(s.totalNetSales)}`,
      14,
      57,
    );
    doc.text(
      `- Pourboires Coiffeurs : + DZD ${formatMoney(s.totalTips)}`,
      14,
      63,
    );
    doc.text(
      `- Part Coiffure : DZD ${formatMoney(s.byPole.coiffure.net)} (${s.byPole.coiffure.ordersCount} coupes)`,
      110,
      45,
    );
    doc.text(
      `- Part Cafétéria : DZD ${formatMoney(s.byPole.cafe.net)} (${s.byPole.cafe.ordersCount} commandes)`,
      110,
      51,
    );
    doc.text(
      `- Panier Moyen Global : DZD ${formatMoney(s.averageTicket)}`,
      110,
      57,
    );

    // Section Trésorerie
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("2. RAPPORT DE CAISSE & TRÉSORERIE (ESPÈCES)", 14, 76);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `- Fond de caisse initial : DZD ${formatMoney(c.openingBalance)}`,
      14,
      83,
    );
    doc.text(
      `- Encaissements ventes : + DZD ${formatMoney(c.cashSales)}`,
      14,
      89,
    );
    doc.text(
      `- Apports & Règlements : + DZD ${formatMoney(c.cashEntries)}`,
      14,
      95,
    );
    doc.text(
      `- Décaissements & Retraits : - DZD ${formatMoney(c.cashWithdrawals)}`,
      110,
      83,
    );
    doc.text(
      `- Solde théorique attendu : DZD ${formatMoney(c.expectedClosingBalance)}`,
      110,
      89,
    );
    doc.text(
      `- Écart de caisse : ${c.difference >= 0 ? `+${formatMoney(c.difference)}` : formatMoney(c.difference)} DZD`,
      110,
      95,
    );

    // Tableau Collaborateurs
    const empRows = reportData.employees.map((e) => [
      e.name,
      `Poste ${e.poste}`,
      e.clientsCount,
      `DZD ${formatMoney(e.netGenerated)}`,
      `DZD ${formatMoney(e.tipsCollected)}`,
      e.isOwner ? "Propriétaire" : `DZD ${formatMoney(e.commissionEarned)}`,
    ]);

    doc.autoTable({
      head: [
        [
          "Collaborateur",
          "Poste",
          "Clients",
          "CA Net",
          "Tips",
          "Part Coiffeur",
        ],
      ],
      body: empRows,
      startY: 105,
      headStyles: { fillColor: [15, 23, 42], textColor: [156, 161, 73] },
      styles: { fontSize: 8 },
    });

    doc.save(`Rapport_Complet_VSP_${filterPeriod.toUpperCase()}.pdf`);
    toast.success("Rapport PDF généré !");
  };

  const sales = reportData?.sales;
  const cash = reportData?.cash;
  const employees = reportData?.employees || [];

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* ══════════════════════════════════════════════════════════════
          1. EN-TÊTE ET SÉLECTEURS DE DATE (TODAY, YESTERDAY, WEEK, MONTH, CUSTOM)
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-center bg-surface border border-subtle p-5 shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-t-main uppercase tracking-widest flex items-center gap-2">
            <BarChart3 className="text-brand" size={26} /> Rapports &amp; États
            Comptables
          </h2>
          <p className="text-xs font-bold text-t-muted uppercase tracking-wider mt-1">
            Agrégation et synthèse des ventes, trésorerie et performances
            d'équipe
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* BOUTONS PÉRIODES INCLUANT HIER */}
          <div className="flex bg-main border border-subtle p-1">
            {[
              { key: "today", label: "Aujourd'hui" },
              { key: "yesterday", label: "Hier" },
              { key: "week", label: "Cette Semaine" },
              { key: "month", label: "Ce Mois" },
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

          {/* Saisie Période Libre */}
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
                  setFilterPeriod("today");
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
          2. NAVIGATION ENTRE LES 4 STRUCTURES DE RAPPORT
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-surface border border-subtle p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveReportTab("sales")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border rounded-none ${
              activeReportTab === "sales"
                ? "bg-brand text-white border-brand shadow-md"
                : "bg-main text-t-muted border-subtle hover:text-t-main"
            }`}
          >
            <TrendingUp size={15} /> 1. Rapport des Ventes
          </button>

          <button
            type="button"
            onClick={() => setActiveReportTab("cash")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border rounded-none ${
              activeReportTab === "cash"
                ? "bg-brand text-white border-brand shadow-md"
                : "bg-main text-t-muted border-subtle hover:text-t-main"
            }`}
          >
            <Wallet size={15} /> 2. Rapport de Caisse
          </button>

          <button
            type="button"
            onClick={() => setActiveReportTab("employees")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border rounded-none ${
              activeReportTab === "employees"
                ? "bg-brand text-white border-brand shadow-md"
                : "bg-main text-t-muted border-subtle hover:text-t-main"
            }`}
          >
            <Users size={15} /> 3. Rapport Collaborateurs
          </button>

          <button
            type="button"
            onClick={() => setActiveReportTab("tickets")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border rounded-none ${
              activeReportTab === "tickets"
                ? "bg-brand text-white border-brand shadow-md"
                : "bg-main text-t-muted border-subtle hover:text-t-main"
            }`}
          >
            <Receipt size={15} /> 4. Journal Factures
          </button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="text-xs py-2 px-4 border-subtle rounded-none"
          >
            <FileText size={14} className="mr-1.5 text-green-500" /> Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            className="text-xs py-2 px-4 border-subtle rounded-none"
          >
            <FileDown size={14} className="mr-1.5 text-red-500" /> Export PDF A4
          </Button>
        </div>
      </div>

      {isLoading || !reportData ? (
        <div className="p-20 text-center animate-pulse text-brand uppercase tracking-widest text-xs font-bold bg-surface border border-subtle">
          Génération des états consolidés...
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════════
              SECTION 1 : RAPPORT DES VENTES (SALES REPORT)
          ══════════════════════════════════════════════════════════ */}
          {activeReportTab === "sales" && (
            <div className="space-y-6">
              {/* Macro KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface border border-subtle p-5 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-t-muted block mb-1">
                    Chiffre d'Affaires Net
                  </span>
                  <p className="text-3xl font-mono font-bold text-green-400">
                    DZD {formatMoney(sales.totalNetSales)}
                  </p>
                  <p className="text-[9px] text-t-muted uppercase font-bold mt-1">
                    Brut : {formatMoney(sales.totalGrossSales)} DZD
                  </p>
                </div>

                <div className="bg-surface border border-subtle p-5 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-t-muted block mb-1">
                    Commandes &amp; Prestations
                  </span>
                  <p className="text-3xl font-mono font-bold text-t-main">
                    {sales.totalOrdersCount}
                  </p>
                  <p className="text-[9px] text-t-muted uppercase font-bold mt-1">
                    Volume global de passages
                  </p>
                </div>

                <div className="bg-surface border border-subtle p-5 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-t-muted block mb-1">
                    Panier Moyen Global
                  </span>
                  <p className="text-3xl font-mono font-bold text-brand">
                    DZD {formatMoney(sales.averageTicket)}
                  </p>
                  <p className="text-[9px] text-t-muted uppercase font-bold mt-1">
                    Par transaction client
                  </p>
                </div>

                <div className="bg-surface border border-subtle p-5 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-t-muted block mb-1">
                    Remises &amp; Pourboires
                  </span>
                  <p className="text-lg font-mono font-bold text-red-400">
                    - DZD {formatMoney(sales.totalDiscounts)}{" "}
                    <span className="text-xs text-t-muted">(Remises)</span>
                  </p>
                  <p className="text-lg font-mono font-bold text-emerald-400 mt-1">
                    + DZD {formatMoney(sales.totalTips)}{" "}
                    <span className="text-xs text-t-muted">(Pourboires)</span>
                  </p>
                </div>
              </div>

              {/* Comparaison Pôles Salon vs Café */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Coiffure */}
                <div className="bg-surface border-l-4 border-l-blue-500 border border-subtle p-6 shadow-sm">
                  <div className="flex justify-between items-center border-b border-subtle pb-3 mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2">
                      <Scissors size={16} /> Pôle Salon de Coiffure
                    </h3>
                    <span className="font-mono text-xs font-bold text-slate-300">
                      {sales.byPole.coiffure.ordersCount} prestations
                    </span>
                  </div>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between text-t-muted">
                      <span>CA Brut Théorique :</span>
                      <span>
                        DZD {formatMoney(sales.byPole.coiffure.gross)}
                      </span>
                    </div>
                    <div className="flex justify-between text-red-400">
                      <span>Remises accordées :</span>
                      <span>
                        - DZD {formatMoney(sales.byPole.coiffure.discounts)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-green-400 border-t border-subtle pt-2">
                      <span>CA Net Coiffure :</span>
                      <span>DZD {formatMoney(sales.byPole.coiffure.net)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400">
                      <span>Pourboires Récoltés :</span>
                      <span>
                        + DZD {formatMoney(sales.byPole.coiffure.tips)}
                      </span>
                    </div>
                    <div className="flex justify-between text-brand border-t border-subtle pt-2">
                      <span>Panier Moyen Coupe :</span>
                      <span>
                        DZD {formatMoney(sales.byPole.coiffure.averageTicket)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cafétéria */}
                <div className="bg-surface border-l-4 border-l-amber-500 border border-subtle p-6 shadow-sm">
                  <div className="flex justify-between items-center border-b border-subtle pb-3 mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2">
                      <Coffee size={16} /> Pôle Espace Cafétéria
                    </h3>
                    <span className="font-mono text-xs font-bold text-slate-300">
                      {sales.byPole.cafe.ordersCount} commandes
                    </span>
                  </div>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between text-t-muted">
                      <span>CA Brut Ventes :</span>
                      <span>DZD {formatMoney(sales.byPole.cafe.gross)}</span>
                    </div>
                    <div className="flex justify-between text-red-400">
                      <span>Remises accordées :</span>
                      <span>
                        - DZD {formatMoney(sales.byPole.cafe.discounts)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-green-400 border-t border-subtle pt-2">
                      <span>CA Net Cafétéria :</span>
                      <span>DZD {formatMoney(sales.byPole.cafe.net)}</span>
                    </div>
                    <div className="flex justify-between text-brand border-t border-subtle pt-2">
                      <span>Panier Moyen Boisson :</span>
                      <span>
                        DZD {formatMoney(sales.byPole.cafe.averageTicket)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ventes par Prestation & Produit */}
              <div className="bg-surface border border-subtle shadow-sm overflow-hidden">
                <div className="p-4 border-b border-subtle bg-main/40">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-brand">
                    Ventes Détaillées par Prestation &amp; Article (
                    {sales.byProductService.length} références)
                  </h3>
                </div>

                <DataTable
                  headers={[
                    { label: "Désignation" },
                    { label: "Pôle" },
                    { label: "Volume Vendu", align: "center" },
                    { label: "CA Généré", align: "right" },
                  ]}
                >
                  {sales.byProductService.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-subtle hover:bg-brand/5 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-t-main uppercase text-xs">
                        {item.name}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 text-[8px] font-bold uppercase border rounded-none ${
                            item.category === "Coiffure"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-xs text-t-main">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-green-400 text-sm">
                        DZD {formatMoney(item.revenue)}
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SECTION 2 : RAPPORT DE CAISSE & TRÉSORERIE (CASH REPORT)
          ══════════════════════════════════════════════════════════ */}
          {activeReportTab === "cash" && (
            <div className="space-y-6">
              {/* Le Grand Écran Digital de Réconciliation Caisse */}
              <div className="bg-surface border-t-4 border-brand p-6 shadow-lg">
                <h3 className="text-sm font-bold uppercase tracking-widest text-brand border-b border-subtle pb-3 mb-6 flex items-center gap-2">
                  <Wallet size={18} /> Rapprochement de Trésorerie (Espèces
                  Réelles)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-mono">
                  <div className="bg-main border border-subtle p-4">
                    <span className="text-[10px] uppercase font-bold text-t-muted block mb-1">
                      1. Fond Initial (Ouverture)
                    </span>
                    <p className="text-2xl font-bold text-slate-200">
                      DZD {formatMoney(cash.openingBalance)}
                    </p>
                    <p className="text-[9px] text-t-muted mt-1">
                      Mise de départ tiroir
                    </p>
                  </div>

                  <div className="bg-main border border-green-500/30 p-4">
                    <span className="text-[10px] uppercase font-bold text-green-400 block mb-1">
                      2. (+) Ventes en Espèces
                    </span>
                    <p className="text-2xl font-bold text-green-400">
                      + DZD {formatMoney(cash.cashSales)}
                    </p>
                    <p className="text-[9px] text-green-500/70 mt-1">
                      CA Net + Pourboires
                    </p>
                  </div>

                  <div className="bg-main border border-blue-500/30 p-4">
                    <span className="text-[10px] uppercase font-bold text-blue-400 block mb-1">
                      3. (+) Apports &amp; Règlements
                    </span>
                    <p className="text-2xl font-bold text-blue-400">
                      + DZD {formatMoney(cash.cashEntries)}
                    </p>
                    <p className="text-[9px] text-blue-500/70 mt-1">
                      Ardoises réglées &amp; apports
                    </p>
                  </div>

                  <div className="bg-main border border-red-500/30 p-4">
                    <span className="text-[10px] uppercase font-bold text-red-400 block mb-1">
                      4. (-) Décaissements &amp; Retraits
                    </span>
                    <p className="text-2xl font-bold text-red-400">
                      - DZD {formatMoney(cash.cashWithdrawals)}
                    </p>
                    <p className="text-[9px] text-red-500/70 mt-1">
                      Coiffeurs, grossistes, charges
                    </p>
                  </div>
                </div>

                {/* Bandeau d'équilibrage Théorique vs Réel */}
                <div className="mt-6 pt-6 border-t border-subtle grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="bg-slate-900 border border-slate-800 p-4 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block mb-1">
                      Solde Théorique Attendu
                    </span>
                    <p className="text-2xl font-mono font-bold text-amber-400">
                      DZD {formatMoney(cash.expectedClosingBalance)}
                    </p>
                  </div>

                  <div className="bg-[#0a0a0a] border-2 border-slate-800 p-4 text-center shadow-inner">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block mb-1">
                      Compté Réellement en Tiroir
                    </span>
                    <p className="text-3xl font-mono font-black text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.4)]">
                      DZD {formatMoney(cash.actualClosingBalance)}
                    </p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-4 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block mb-1">
                      Écart de Caisse Constaté
                    </span>
                    <p
                      className={`text-2xl font-mono font-bold ${
                        cash.difference === 0
                          ? "text-green-500"
                          : cash.difference < 0
                            ? "text-red-500"
                            : "text-amber-500"
                      }`}
                    >
                      {cash.difference === 0
                        ? "0.00 (PARFAIT)"
                        : `${cash.difference > 0 ? "+" : ""}${formatMoney(cash.difference)} DZD`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SECTION 3 : RAPPORT COLLABORATEURS & COIFFEURS
          ══════════════════════════════════════════════════════════ */}
          {activeReportTab === "employees" && (
            <div className="space-y-6">
              <div className="bg-surface border border-subtle shadow-sm overflow-hidden">
                <div className="p-4 border-b border-subtle bg-main/40 flex justify-between items-center">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-brand flex items-center gap-2">
                    <Users size={16} /> Performance &amp; Rémunérations par
                    Coiffeur
                  </h3>
                </div>

                <DataTable
                  headers={[
                    { label: "Collaborateur" },
                    { label: "Poste" },
                    { label: "Coupes", align: "center" },
                    { label: "CA Brut", align: "right" },
                    { label: "Remises", align: "right" },
                    { label: "CA Net Généré", align: "right" },
                    { label: "Pourboires", align: "right" },
                    { label: "Part Coiffeur (DA)", align: "right" },
                    { label: "Panier Moyen", align: "right" },
                  ]}
                >
                  {employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="border-b border-subtle hover:bg-brand/5 transition-colors"
                    >
                      <td className="px-5 py-3 font-bold text-t-main uppercase text-xs">
                        {emp.name}{" "}
                        {emp.isOwner && (
                          <span className="bg-amber-500 text-slate-900 px-1.5 py-0.5 text-[8px] font-black uppercase rounded-none ml-1">
                            👑 Patron
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs font-bold text-t-muted">
                        Poste {emp.poste}
                      </td>
                      <td className="px-5 py-3 text-center font-mono font-bold text-xs text-t-main">
                        {emp.clientsCount}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-xs text-t-muted">
                        {formatMoney(emp.grossGenerated)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-xs text-red-400">
                        {emp.discountsGiven > 0
                          ? `- ${formatMoney(emp.discountsGiven)}`
                          : "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-xs text-green-400">
                        DZD {formatMoney(emp.netGenerated)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-xs text-emerald-400">
                        {emp.tipsCollected > 0
                          ? `+ ${formatMoney(emp.tipsCollected)}`
                          : "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-black text-sm text-blue-400">
                        {emp.isOwner ? (
                          <span className="text-[10px] text-amber-500 font-bold uppercase">
                            100% Salon
                          </span>
                        ) : (
                          `DZD ${formatMoney(emp.commissionEarned)}`
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-xs text-brand">
                        DZD {formatMoney(emp.avgTicket)}
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SECTION 4 : JOURNAL DES FACTURES & PERTES
          ══════════════════════════════════════════════════════════ */}
          {activeReportTab === "tickets" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setTicketsSubTab("paid")}
                  className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider border rounded-none ${
                    ticketsSubTab === "paid"
                      ? "bg-green-600 text-white border-green-600 shadow-md"
                      : "bg-surface text-t-muted border-subtle hover:text-t-main"
                  }`}
                >
                  <CheckCircle size={14} /> Factures Réglées (
                  {reportData.history.paidTickets.length})
                </button>
                <button
                  onClick={() => setTicketsSubTab("canceled")}
                  className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider border rounded-none ${
                    ticketsSubTab === "canceled"
                      ? "bg-red-600 text-white border-red-600 shadow-md"
                      : "bg-surface text-t-muted border-subtle hover:text-t-main"
                  }`}
                >
                  <Ban size={14} /> Tickets Annulés / Absents (
                  {reportData.history.canceledTickets.length})
                </button>
              </div>

              <div className="bg-surface border border-subtle shadow-sm overflow-hidden">
                {ticketsSubTab === "paid" ? (
                  <DataTable
                    headers={[
                      { label: "N° Ticket" },
                      { label: "Date & Heure" },
                      { label: "Client" },
                      { label: "Coiffeur" },
                      { label: "Prestation" },
                      { label: "Remise", align: "right" },
                      { label: "Net Facturé", align: "right" },
                      { label: "Pourboire", align: "right" },
                    ]}
                  >
                    {reportData.history.paidTickets.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-subtle hover:bg-brand/5 transition-colors"
                      >
                        <td className="px-5 py-3 font-mono font-bold text-brand text-xs">
                          #{t.queueNumber || t.id}
                        </td>
                        <td className="px-5 py-3 text-[10px] font-mono text-t-muted">
                          {new Date(t.date).toLocaleString("fr-FR")}
                        </td>
                        <td className="px-5 py-3 font-bold text-t-main uppercase text-xs">
                          {t.clientName}
                        </td>
                        <td className="px-5 py-3 text-t-muted uppercase text-xs font-bold">
                          {t.barber}
                        </td>
                        <td className="px-5 py-3 text-t-main italic text-xs font-bold uppercase">
                          {t.service}
                        </td>
                        <td className="px-5 py-3 text-right text-red-400 font-mono font-bold text-xs">
                          {t.discountAmount > 0
                            ? `- DZD ${formatMoney(t.discountAmount)}`
                            : "—"}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-green-400 text-sm">
                          DZD {formatMoney(t.price)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-emerald-400 text-xs">
                          {t.tip > 0 ? `+ DZD ${formatMoney(t.tip)}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                ) : (
                  <DataTable
                    headers={[
                      { label: "N° Ticket" },
                      { label: "Date & Heure" },
                      { label: "Client" },
                      { label: "Barbier" },
                      { label: "Prestation Annulée" },
                      { label: "Perte Estimée", align: "right" },
                    ]}
                  >
                    {reportData.history.canceledTickets.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-subtle hover:bg-red-500/5 transition-colors"
                      >
                        <td className="px-5 py-3 font-mono font-bold text-red-500 text-xs">
                          #{t.queueNumber || t.id}
                        </td>
                        <td className="px-5 py-3 text-[10px] font-mono text-t-muted">
                          {new Date(t.date).toLocaleString("fr-FR")}
                        </td>
                        <td className="px-5 py-3 font-bold text-t-main uppercase text-xs">
                          {t.clientName}
                        </td>
                        <td className="px-5 py-3 text-t-muted uppercase text-xs font-bold">
                          {t.barber}
                        </td>
                        <td className="px-5 py-3 text-slate-400 italic text-xs">
                          {t.service}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-red-500 text-sm">
                          - DZD {formatMoney(t.price)}
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
