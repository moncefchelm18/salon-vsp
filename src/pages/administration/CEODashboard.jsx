import React, { useState, useEffect } from "react";
import {
  Scale,
  Scissors,
  Coffee,
  Wallet,
  Building2,
  Printer,
  FileDown,
  FileText,
  CheckCircle,
  AlertTriangle,
  Coins,
  Receipt,
  X,
  Eye,
} from "lucide-react";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../utils/api";

import Button from "../../components/common/Button";
import DataTable from "../../components/common/DataTable";
import ThermalReceipt from "../../components/common/ThermalReceipt";
import Modal from "../../components/common/Modal";

const formatMoney = (val) => {
  const num = Number(val);
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

export default function CEODashboard() {
  const [filterPeriod, setFilterPeriod] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [bilanData, setBilanData] = useState(null);

  // Comptage physique manuel interactif
  const [liveCountInput, setLiveCountInput] = useState("");
  const [isManualCounting, setIsManualCounting] = useState(false);

  // Modale détails d'opération
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Impression Thermique 80mm
  const [printTrigger, setPrintTrigger] = useState(0);
  const [printData, setPrintData] = useState(null);

  const fetchBilan = async () => {
    setIsLoading(true);
    try {
      let url = `/reports/ceo?period=${filterPeriod}`;
      if (filterPeriod === "custom" && startDate && endDate) {
        url = `/reports/ceo?startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await api.get(url);
      setBilanData(res.data);
      if (res.data.caisse?.actualPhysicalCount > 0) {
        setLiveCountInput(res.data.caisse.actualPhysicalCount.toString());
      } else {
        setLiveCountInput((res.data.caisse?.expectedCaisse || 0).toString());
      }
    } catch (error) {
      toast.error("Erreur de chargement du bilan financier.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (filterPeriod !== "custom" || (startDate && endDate)) {
      fetchBilan();
    }
  }, [filterPeriod, startDate, endDate]);

  // Supporte la rétrocompatibilité (salon / cafe ou anter / cherif)
  const r = bilanData?.revenue;
  const c = bilanData?.caisse;
  const s = bilanData?.settlement;
  const salonSettlement = s?.salon || s?.anter || {};
  const cafeSettlement = s?.cafe || s?.cherif || {};

  // Calcul live de l'écart
  const displayedCounted = isManualCounting
    ? parseFloat(liveCountInput) || 0
    : c?.actualPhysicalCount || c?.expectedCaisse || 0;

  const displayedDiff = isManualCounting
    ? displayedCounted - (c?.expectedCaisse || 0)
    : c?.caisseDifference || 0;

  // ── IMPRESSION TICKET DE CLÔTURE ET MHASBA (80MM) ──
  const handlePrintSettlementTicket = () => {
    if (!bilanData) return;

    const s = bilanData.settlement;
    const salonDue = salonSettlement.totalDue ?? salonSettlement.finalNet ?? 0;
    const cafeDue = cafeSettlement.totalDue ?? cafeSettlement.finalNet ?? 0;

    setPrintData({
      ticketId: "CLOTURE-GERANCE",
      clientName: "Bilan des Pôles (Mhasba)",
      barber: "Gérance Générale",
      service: `Période : ${filterPeriod.toUpperCase()}`,
      haircutPrice: salonDue,
      items: [
        {
          name:
            salonSettlement.floatRefund > 0
              ? "Part Salon (Net + Fond Avancé)"
              : "Part Nette Salon",
          price: salonDue,
          quantity: 1,
        },
        {
          name:
            cafeSettlement.floatRefund > 0
              ? "Part Café (Net + Fond Avancé)"
              : "Part Nette Café",
          price: cafeDue,
          quantity: 1,
        },
      ],
      grandTotal: salonDue + cafeDue,
      paidAmount: displayedCounted,
      unpaidDebt: displayedDiff < 0 ? Math.abs(displayedDiff) : 0,
    });
    setPrintTrigger((p) => p + 1);
    toast.success("Impression du ticket de Mhasba 80mm envoyée !");
  };

  // ── EXPORT PDF OFFICIEL A4 DU BILAN ──
  const handleExportPDF = () => {
    try {
      if (!bilanData) {
        return toast.error("Aucune donnée disponible pour l'export.");
      }

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const dates = bilanData.dates || {};

      const startDateStr = dates.start
        ? new Date(dates.start).toLocaleDateString("fr-FR")
        : "Debut";
      const endDateStr = dates.end
        ? new Date(dates.end).toLocaleDateString("fr-FR")
        : "Fin";

      // En-tête
      doc.setFontSize(16);
      doc.setTextColor(156, 161, 73); // Olive Brand
      doc.text("SALON VSP - BILAN DE GERANCE & RECONCILIATION", 14, 18);

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Periode : ${filterPeriod.toUpperCase()} | Du ${startDateStr} au ${endDateStr} | Edite le ${new Date().toLocaleDateString("fr-FR")}`,
        14,
        25,
      );

      doc.setDrawColor(220, 220, 220);
      doc.line(14, 28, 196, 28);

      // ── PILIER 1 : REVENUS ──
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("1. CHIFFRE D'AFFAIRES & PRODUCTION (REVENUE / CA)", 14, 36);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(
        `- CA Net Salon de Coiffure : DZD ${formatMoney(r?.salonNetRevenue || 0)} (${r?.salonClientsCount || 0} clients)`,
        14,
        43,
      );
      doc.text(
        `- CA Espace Cafeteria : DZD ${formatMoney(r?.totalCafeRevenue || 0)} (${r?.cafeOrdersCount || 0} commandes)`,
        14,
        49,
      );
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(
        `= TOTAL PRODUCTION BRUTE : DZD ${formatMoney(r?.grossRevenue || 0)}`,
        14,
        56,
      );

      // ── PILIER 2 : CAISSE PARTAGÉE ──
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(
        "2. CONTROLE DU TIROIR-CAISSE PARTAGE (CASH RECONCILIATION)",
        14,
        66,
      );

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(
        `- Fond d'Ouverture : DZD ${formatMoney(c?.openingCaisse || 0)}`,
        14,
        73,
      );
      doc.text(
        `- Entrees d'especes (+) : + DZD ${formatMoney(c?.totalCashIn || 0)}`,
        14,
        79,
      );
      doc.text(
        `- Sorties d'especes (-) : - DZD ${formatMoney(c?.totalCashOut || 0)}`,
        14,
        85,
      );

      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(
        `= ESPECES THEORIQUES ATTENDUES : DZD ${formatMoney(c?.expectedCaisse || 0)}`,
        14,
        92,
      );

      doc.setFont("helvetica", "normal");
      doc.text(
        `- Compte reellement : DZD ${formatMoney(displayedCounted)}`,
        115,
        73,
      );

      const diffNum = Number(displayedDiff || 0);
      doc.setFont("helvetica", "bold");
      if (diffNum === 0) {
        doc.setTextColor(0, 150, 0);
        doc.text(`= Ecart de caisse : 0.00 DZD (PARFAIT)`, 115, 80);
      } else if (diffNum < 0) {
        doc.setTextColor(200, 0, 0);
        doc.text(
          `= Ecart de caisse : ${formatMoney(diffNum)} DZD (DEFICIT)`,
          115,
          80,
        );
      } else {
        doc.setTextColor(220, 140, 0);
        doc.text(
          `= Ecart de caisse : +${formatMoney(diffNum)} DZD (EXCEDENT)`,
          115,
          80,
        );
      }

      // ── PILIER 3 : RÈGLEMENT PAR PÔLE ──
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(
        "3. MHASBA & PARTAGE DES POLES (NET PROFIT SETTLEMENT)",
        14,
        102,
      );

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);

      const salonPct =
        salonSettlement.sharePercentage != null
          ? Number(salonSettlement.sharePercentage).toFixed(1)
          : "0.0";
      const cafePct =
        cafeSettlement.sharePercentage != null
          ? Number(cafeSettlement.sharePercentage).toFixed(1)
          : "0.0";

      doc.text(
        `- Part Nette Pole Salon (Coiffure) : DZD ${formatMoney(salonSettlement.finalNet || 0)} (${salonPct}%)`,
        14,
        109,
      );
      doc.text(
        `- Part Nette Pole Cafeteria : DZD ${formatMoney(cafeSettlement.finalNet || 0)} (${cafePct}%)`,
        14,
        115,
      );

      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 150, 0);
      doc.text(
        `= BENEFICE NET CONSOLIDE : DZD ${formatMoney(s?.consolidatedNetProfit || 0)}`,
        14,
        122,
      );

      // Tableau Grand Livre
      const ledgerRows = (bilanData.ledger || []).map((row) => [
        new Date(row.date).toLocaleDateString("fr-FR"),
        row.departmentLabel || row.business || row.pole,
        row.ref || "-",
        String(row.label || "").substring(0, 40),
        `DZD ${formatMoney(row.net || 0)}`,
      ]);

      autoTable(doc, {
        head: [["Date", "Departement", "Ref", "Designation", "Net Impact"]],
        body: ledgerRows,
        startY: 130,
        headStyles: { fillColor: [15, 23, 42], textColor: [156, 161, 73] },
        styles: { fontSize: 7.5, cellPadding: 2 },
        theme: "grid",
      });

      doc.save(`Bilan_Gerance_VSP_${filterPeriod.toUpperCase()}.pdf`);
      toast.success("Bilan PDF téléchargé avec succès !");
    } catch (err) {
      console.error("Erreur génération PDF Bilan :", err);
      toast.error(`Erreur génération PDF : ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 max-w-full overflow-x-hidden">
      {/* ══════════════════════════════════════════════════════════════
          EN-TÊTE & SÉLECTEUR DE PÉRIODES
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-center bg-surface border border-subtle p-5 shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-t-main flex items-center gap-2 uppercase tracking-widest">
            <Scale className="text-brand" size={26} /> Bilan &amp;
            Réconciliation de Caisse
          </h2>
          <p className="text-xs font-bold text-t-muted uppercase tracking-wider mt-1">
            Contrôle physique du tiroir commun et répartition des pôles (Salon
            &amp; Café)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sélecteur de période avec Hier */}
          <div className="flex bg-main border border-subtle p-1">
            {[
              { key: "today", label: "Aujourd'hui" },
              { key: "yesterday", label: "Hier" },
              { key: "week", label: "7 Jours" },
              { key: "month", label: "Ce Mois" },
            ].map((p) => (
              <Button
                key={p.key}
                variant={filterPeriod === p.key ? "primary" : "ghost"}
                onClick={() => {
                  setFilterPeriod(p.key);
                  setStartDate("");
                  setEndDate("");
                  setIsManualCounting(false);
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
                  setFilterPeriod("today");
                }}
                className="text-red-500 hover:text-red-400 p-1 border-l border-subtle ml-1"
                title="Réinitialiser"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex gap-2 ml-2">
            <Button
              variant="outline"
              onClick={handleExportPDF}
              className="text-xs py-2 px-3 border-subtle rounded-none"
            >
              <FileDown size={14} className="mr-1 text-red-500" /> PDF Bilan
            </Button>
            <Button
              variant="success"
              onClick={handlePrintSettlementTicket}
              className="text-xs py-2 px-4 shadow-md rounded-none"
            >
              <Printer size={14} className="mr-1.5" /> Ticket Mhasba (80mm)
            </Button>
          </div>
        </div>
      </div>

      {isLoading || !bilanData ? (
        <div className="p-20 text-center animate-pulse text-brand uppercase tracking-widest text-xs font-bold bg-surface border border-subtle">
          Calcul et équilibrage des 3 piliers financiers...
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════════
              PILIER ① : CHIFFRE D'AFFAIRES & PRODUCTION
          ══════════════════════════════════════════════════════════ */}
          <div className="bg-surface border border-subtle shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-subtle pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-brand flex items-center gap-2">
                  <Coins size={18} /> Pilier ① : Chiffre d'Affaires &amp;
                  Activité Générée
                </h3>
                <p className="text-[10px] text-t-muted uppercase font-bold mt-0.5">
                  Production commerciale réalisée par chaque pôle avant
                  déductions
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-t-muted block">
                  Production Totale
                </span>
                <span className="font-mono text-2xl font-bold text-t-main">
                  DZD {formatMoney(r?.grossRevenue || 0)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activité Salon */}
              <div className="bg-main border border-subtle p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                <div className="flex justify-between items-center border-b border-subtle pb-2.5 mb-3 pl-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <Scissors size={14} /> Pôle Salon de Coiffure
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-t-muted">
                    {r?.salonClientsCount || 0} prestations
                  </span>
                </div>

                <div className="pl-2 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-t-muted">
                    <span>CA Brut Facturé :</span>
                    <span>DZD {formatMoney(r?.salonGrossRevenue || 0)}</span>
                  </div>
                  {r?.salonDiscounts > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>Remises accordées :</span>
                      <span>- DZD {formatMoney(r?.salonDiscounts || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-t-main font-bold pt-1 border-t border-subtle">
                    <span>CA Net Salon :</span>
                    <span className="text-blue-400">
                      DZD {formatMoney(r?.salonNetRevenue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Pourboires Réceptionnés :</span>
                    <span>+ DZD {formatMoney(r?.salonTips || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Activité Cafétéria */}
              <div className="bg-main border border-subtle p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                <div className="flex justify-between items-center border-b border-subtle pb-2.5 mb-3 pl-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <Coffee size={14} /> Pôle Espace Cafétéria
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-t-muted">
                    {r?.cafeOrdersCount || 0} commandes
                  </span>
                </div>

                <div className="pl-2 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-t-muted">
                    <span>Ventes Directes Comptoir :</span>
                    <span>DZD {formatMoney(r?.cafeDirectRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between text-t-muted">
                    <span>Boissons Factures Coiffure :</span>
                    <span>+ DZD {formatMoney(r?.cafeLinkedRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between text-t-main font-bold pt-1 border-t border-subtle">
                    <span>CA Net Cafétéria :</span>
                    <span className="text-amber-400">
                      DZD {formatMoney(r?.totalCafeRevenue || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              PILIER ② : LE TIROIR-CAISSE PARTAGÉ (RÉCONCILIATION DU CASH)
          ══════════════════════════════════════════════════════════ */}
          <div className="bg-surface border-2 border-brand/50 p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-subtle pb-4 mb-6 gap-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-brand flex items-center gap-2">
                  <Wallet size={18} /> Pilier ② : Tiroir-Caisse Partagé
                  (Contrôle Physique des Espèces)
                </h3>
                <p className="text-[10px] text-t-muted uppercase font-bold mt-0.5">
                  Réconciliation : Espèces physiques attendues vs Comptage réel
                  du tiroir
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualCounting(!isManualCounting)}
                  className="px-3 py-1.5 bg-main border border-subtle text-[10px] font-bold uppercase text-brand hover:border-brand transition-colors rounded-none"
                >
                  {isManualCounting
                    ? "Utiliser Clôture Enregistrée"
                    : "Saisir Comptage Direct"}
                </button>
              </div>
            </div>

            {/* Waterfall de réconciliation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs mb-6">
              <div className="bg-main border border-subtle p-4">
                <span className="text-[10px] uppercase font-bold text-t-muted block mb-1">
                  Fond d'Ouverture
                </span>
                <p className="text-xl font-bold text-slate-200">
                  DZD {formatMoney(c?.openingCaisse || 0)}
                </p>
                <p className="text-[9px] text-t-muted mt-1">
                  Mise de départ matin
                </p>
              </div>

              <div className="bg-main border border-green-500/30 p-4">
                <span className="text-[10px] uppercase font-bold text-green-400 block mb-1">
                  (+) Total Espèces Entrées
                </span>
                <p className="text-xl font-bold text-green-400">
                  + DZD {formatMoney(c?.totalCashIn || 0)}
                </p>
                <p className="text-[9px] text-green-500/70 mt-1">
                  Coupes + Café + Apports
                </p>
              </div>

              <div className="bg-main border border-red-500/30 p-4">
                <span className="text-[10px] uppercase font-bold text-red-400 block mb-1">
                  (-) Total Espèces Sorties
                </span>
                <p className="text-xl font-bold text-red-400">
                  - DZD {formatMoney(c?.totalCashOut || 0)}
                </p>
                <p className="text-[9px] text-red-500/70 mt-1">
                  Coiffeurs + Fournisseurs
                </p>
              </div>

              <div className="bg-main border border-brand p-4">
                <span className="text-[10px] uppercase font-bold text-brand block mb-1">
                  (=) Solde Attendu
                </span>
                <p className="text-xl font-bold text-brand">
                  DZD {formatMoney(c?.expectedCaisse || 0)}
                </p>
                <p className="text-[9px] text-brand/70 mt-1">
                  Fond + Entrées - Sorties
                </p>
              </div>
            </div>

            {/* GRAND CADRAN COMPARATEUR THÉORIQUE VS RÉEL */}
            <div className="bg-[#0a0a0a] border-2 border-slate-800 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center shadow-inner">
              {/* Théorique */}
              <div className="text-center md:text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block mb-1">
                  Solde Théorique Attendu
                </span>
                <p className="text-2xl font-mono font-bold text-slate-200">
                  DZD {formatMoney(c?.expectedCaisse || 0)}
                </p>
                <span className="text-[9px] text-slate-500 uppercase font-bold">
                  Calculé par le système
                </span>
              </div>

              {/* Réel Compté */}
              <div className="text-center bg-slate-950 p-4 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-green-400 tracking-widest block mb-1">
                  Espèces Réellement Comptées
                </span>
                {isManualCounting ? (
                  <input
                    type="number"
                    step="100"
                    value={liveCountInput}
                    onChange={(e) => setLiveCountInput(e.target.value)}
                    className="w-full bg-black border-2 border-green-500 text-center font-mono font-black text-3xl text-[#00ff00] focus:outline-none p-1 rounded-none shadow-[0_0_10px_rgba(0,255,0,0.2)]"
                  />
                ) : (
                  <p className="text-3xl font-mono font-black text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.4)]">
                    DZD {formatMoney(displayedCounted)}
                  </p>
                )}
                <span className="text-[9px] text-slate-500 uppercase font-bold block mt-1">
                  {isManualCounting
                    ? "Saisie libre directe"
                    : "Compté à la clôture de caisse"}
                </span>
              </div>

              {/* Écart de Caisse */}
              <div className="text-center md:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block mb-1">
                  Écart de Caisse
                </span>
                <p
                  className={`text-2xl font-mono font-black ${
                    displayedDiff === 0
                      ? "text-green-500"
                      : displayedDiff < 0
                        ? "text-red-500"
                        : "text-amber-500"
                  }`}
                >
                  {displayedDiff === 0
                    ? "0.00 DA (PARFAIT)"
                    : `${displayedDiff > 0 ? "+" : ""}${formatMoney(displayedDiff)} DA`}
                </p>
                <span className="text-[9px] uppercase font-bold block mt-1">
                  {displayedDiff === 0 ? (
                    <span className="text-green-500 flex items-center justify-center md:justify-end gap-1">
                      <CheckCircle size={11} /> Caisse Équilibrée
                    </span>
                  ) : displayedDiff < 0 ? (
                    <span className="text-red-400 flex items-center justify-center md:justify-end gap-1">
                      <AlertTriangle size={11} /> Déficit en Caisse
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center justify-center md:justify-end gap-1">
                      <AlertTriangle size={11} /> Excédent en Caisse
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              PILIER ③ : MHASBA & RÉPARTITION NETTE DES PÔLES
          ══════════════════════════════════════════════════════════ */}
          <div className="bg-surface border border-subtle shadow-sm p-6 space-y-6">
            <div className="border-b border-subtle pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-brand flex items-center gap-2">
                  <Building2 size={18} /> Pilier ③ : Répartition Nette des Pôles
                  (Mhasba de Clôture)
                </h3>
                <p className="text-[10px] text-t-muted uppercase font-bold mt-0.5">
                  Attribution comptable de la trésorerie nette entre le Salon et
                  la Cafétéria
                </p>
              </div>

              <span className="px-3 py-1 bg-brand/10 border border-brand/30 text-brand font-bold text-xs uppercase">
                Bénéfice Net Consolidé : DZD{" "}
                {formatMoney(s?.consolidatedNetProfit || 0)}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* PÔLE SALON */}
              <div className="bg-surface border-2 border-blue-500/50 p-6 flex flex-col justify-between shadow-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>

                <div>
                  <div className="flex justify-between items-center border-b border-subtle pb-3 mb-4 pl-3">
                    <div>
                      <h4 className="text-base font-bold uppercase tracking-wider text-blue-400">
                        Part Nette : Pôle Salon de Coiffure
                      </h4>
                      <p className="text-[10px] text-t-muted uppercase font-bold">
                        Activité Coiffure
                      </p>
                    </div>
                    <span className="font-mono font-bold text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-1">
                      {(salonSettlement.sharePercentage || 0).toFixed(1)}% du
                      Net
                    </span>
                  </div>

                  <div className="pl-3 space-y-2.5 font-mono text-xs">
                    <div className="flex justify-between text-t-muted">
                      <span>(+) CA Net Coiffure :</span>
                      <span>
                        DZD {formatMoney(salonSettlement.netRevenue || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-blue-400">
                      <span>(-) Commissions Coiffeurs :</span>
                      <span>
                        - DZD{" "}
                        {formatMoney(salonSettlement.barberCommissions || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-red-400">
                      <span>(-) Dépenses Caisse du Salon :</span>
                      <span>
                        - DZD {formatMoney(salonSettlement.expenses || 0)}
                      </span>
                    </div>

                    {/* LIGNE DE REMBOURSEMENT DU FOND SI AVANCÉ PAR LE SALON */}
                    {salonSettlement.floatRefund > 0 && (
                      <div className="flex justify-between text-green-400 bg-green-500/10 p-2 border border-green-500/20 font-bold">
                        <span>(+) Récupération Fond Avancé le Matin :</span>
                        <span>
                          + DZD {formatMoney(salonSettlement.floatRefund)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#0a0a0a] border border-slate-800 p-4 mt-6 ml-3 flex justify-between items-center shadow-inner">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Total Liquide Récupéré par Salon
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold">
                      {salonSettlement.floatRefund > 0
                        ? "Bénéfice Net + Monnaie Avancée"
                        : "Bénéfice net légitime"}
                    </span>
                  </div>
                  <span className="text-3xl font-mono font-black text-blue-400">
                    DZD{" "}
                    {formatMoney(
                      salonSettlement.totalDue ?? salonSettlement.finalNet ?? 0,
                    )}
                  </span>
                </div>
              </div>

              {/* PÔLE CAFÉTÉRIA */}
              <div className="bg-surface border-2 border-amber-500/50 p-6 flex flex-col justify-between shadow-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>

                <div>
                  <div className="flex justify-between items-center border-b border-subtle pb-3 mb-4 pl-3">
                    <div>
                      <h4 className="text-base font-bold uppercase tracking-wider text-amber-400">
                        Part Nette : Pôle Espace Cafétéria
                      </h4>
                      <p className="text-[10px] text-t-muted uppercase font-bold">
                        Activité Cafétéria &amp; Bar
                      </p>
                    </div>
                    <span className="font-mono font-bold text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-1">
                      {(cafeSettlement.sharePercentage || 0).toFixed(1)}% du Net
                    </span>
                  </div>

                  <div className="pl-3 space-y-2.5 font-mono text-xs">
                    <div className="flex justify-between text-t-muted">
                      <span>(+) Ventes Directes Comptoir :</span>
                      <span>
                        DZD {formatMoney(cafeSettlement.directRevenue || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-t-muted">
                      <span>(+) Boissons Factures Coiffure :</span>
                      <span>
                        + DZD {formatMoney(cafeSettlement.linkedRevenue || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-red-400">
                      <span>(-) Achats &amp; Dépenses Caisse :</span>
                      <span>
                        - DZD {formatMoney(cafeSettlement.expenses || 0)}
                      </span>
                    </div>

                    {/* LIGNE DE REMBOURSEMENT DU FOND SI AVANCÉ PAR LE CAFÉ */}
                    {cafeSettlement.floatRefund > 0 && (
                      <div className="flex justify-between text-green-400 bg-green-500/10 p-2 border border-green-500/20 font-bold">
                        <span>(+) Récupération Fond Avancé le Matin :</span>
                        <span>
                          + DZD {formatMoney(cafeSettlement.floatRefund)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#0a0a0a] border border-slate-800 p-4 mt-6 ml-3 flex justify-between items-center shadow-inner">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Total Liquide Récupéré par Café
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold">
                      {cafeSettlement.floatRefund > 0
                        ? "Bénéfice Net + Monnaie Avancée"
                        : "Bénéfice net légitime"}
                    </span>
                  </div>
                  <span className="text-3xl font-mono font-black text-amber-400">
                    DZD{" "}
                    {formatMoney(
                      cafeSettlement.totalDue ?? cafeSettlement.finalNet ?? 0,
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              4. GRAND LIVRE CHRONOLOGIQUE DU BILAN
          ══════════════════════════════════════════════════════════ */}
          <div className="bg-surface border border-subtle shadow-sm overflow-hidden">
            <div className="p-4 border-b border-subtle bg-main/40 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-brand">
                  Livre Journal d'Audit du Bilan (
                  {bilanData.ledger?.length || 0} opérations)
                </h3>
                <p className="text-[10px] text-t-muted uppercase font-bold mt-0.5">
                  Traçabilité intégrale de chaque centime contribuant au Bilan
                </p>
              </div>
            </div>

            <DataTable
              headers={[
                { label: "Date & Heure" },
                { label: "Pôle" },
                { label: "Département" },
                { label: "Réf" },
                { label: "Désignation" },
                { label: "CA Brut", align: "right" },
                { label: "Commission", align: "right" },
                { label: "Dépense", align: "right" },
                { label: "Net Pôle", align: "right" },
                { label: "Action", align: "right" },
              ]}
            >
              {(bilanData.ledger || []).map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-subtle hover:bg-brand/5 transition-colors"
                >
                  <td className="px-4 py-3 text-[10px] font-mono text-t-muted whitespace-nowrap">
                    {new Date(row.date).toLocaleDateString("fr-FR")}{" "}
                    {new Date(row.date).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 text-[8px] font-bold uppercase border rounded-none ${
                        row.pole === "COIFFURE"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {row.pole}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 text-[8px] font-black uppercase border rounded-none ${
                        row.departmentLabel === "SALON" ||
                        row.business === "ANTER"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-amber-500 text-white border-amber-500"
                      }`}
                    >
                      {row.departmentLabel ||
                        (row.business === "ANTER" ? "SALON" : "CAFÉ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-brand text-[10px]">
                    {row.ref}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-t-main uppercase max-w-[200px] truncate">
                    {row.label}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-green-400">
                    {row.gross > 0 ? `+ ${formatMoney(row.gross)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-blue-400">
                    {row.barberCut > 0
                      ? `- ${formatMoney(row.barberCut)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-red-400">
                    {row.expense > 0 ? `- ${formatMoney(row.expense)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-black text-xs">
                    <span
                      className={
                        row.net >= 0 ? "text-[#00ff00]" : "text-red-500"
                      }
                    >
                      {row.net >= 0 ? "+" : "-"}{" "}
                      {formatMoney(Math.abs(row.net))}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSelectedTransaction(row);
                        setIsViewModalOpen(true);
                      }}
                      className="p-1.5 bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white rounded-none"
                      title="Voir les détails"
                    >
                      <Eye size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </DataTable>
          </div>
        </>
      )}

      {/* ── MODALE DÉTAIL D'OPÉRATION ── */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)}>
        {selectedTransaction && (
          <div className="bg-slate-950 p-6 sm:p-8 border-t-4 border-brand w-full max-w-md rounded-none">
            <div className="flex justify-between items-start mb-6 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-t-main uppercase tracking-widest flex items-center gap-2">
                  <Receipt className="text-brand" size={18} /> Détail Opération
                </h3>
                <p className="text-[10px] text-t-muted font-mono font-bold mt-1">
                  RÉF : {selectedTransaction.ref}
                </p>
              </div>
              <span className="px-2.5 py-1 text-[9px] font-black uppercase bg-brand text-white">
                {selectedTransaction.departmentLabel ||
                  (selectedTransaction.business === "ANTER" ? "SALON" : "CAFÉ")}
              </span>
            </div>

            <div className="space-y-4 mb-6 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Date &amp; Heure :</span>
                <span>
                  {new Date(selectedTransaction.date).toLocaleString("fr-FR")}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Désignation :</span>
                <span className="font-bold text-t-main">
                  {selectedTransaction.label}
                </span>
              </div>
              <div className="flex justify-between text-green-400 border-t border-slate-800 pt-2">
                <span>Entrée Brute :</span>
                <span>DZD {formatMoney(selectedTransaction.gross)}</span>
              </div>
              {selectedTransaction.barberCut > 0 && (
                <div className="flex justify-between text-blue-400">
                  <span>Part Coiffeur Déduite :</span>
                  <span>
                    - DZD {formatMoney(selectedTransaction.barberCut)}
                  </span>
                </div>
              )}
              {selectedTransaction.expense > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Dépense Déduite :</span>
                  <span>- DZD {formatMoney(selectedTransaction.expense)}</span>
                </div>
              )}

              <div className="bg-[#0a0a0a] p-4 border border-slate-800 flex justify-between items-center mt-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Impact Net :
                </span>
                <span
                  className={`text-xl font-black ${
                    selectedTransaction.net >= 0
                      ? "text-[#00ff00]"
                      : "text-red-500"
                  }`}
                >
                  {selectedTransaction.net >= 0 ? "+" : "-"} DZD{" "}
                  {formatMoney(Math.abs(selectedTransaction.net))}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              fullWidth
              onClick={() => setIsViewModalOpen(false)}
              className="py-3 text-xs font-bold uppercase rounded-none"
            >
              Fermer
            </Button>
          </div>
        )}
      </Modal>

      {/* Impression Thermique 80mm Bilan */}
      <ThermalReceipt
        type="receipt"
        data={printData}
        printTrigger={printTrigger}
      />
    </div>
  );
}
