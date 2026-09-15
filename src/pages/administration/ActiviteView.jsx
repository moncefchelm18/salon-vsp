import React, { useState, useEffect, useMemo } from "react";
import {
  List,
  FileDown,
  FileText,
  Eye,
  Receipt,
  X,
  Search,
  Scissors,
  Coffee,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCcw,
  SlidersHorizontal,
  Ban,
  Tag,
} from "lucide-react";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";
import api from "../../utils/api";

import Button from "../../components/common/Button";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";

const formatMoney = (val) => {
  const num = Number(val);
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

const CATEGORY_STYLES = {
  VENTE: "bg-green-500/10 text-green-500 border-green-500/30",
  DEPENSE: "bg-red-500/10 text-red-500 border-red-500/30",
  CHARGE: "bg-red-500/15 text-red-400 border-red-500/40",
  APPORT: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  RETRAIT: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  FOURNISSEUR: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  REGLEMENT: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  ANNULATION: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  SESSION: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  AJUSTEMENT: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  RETOUR: "bg-rose-500/10 text-rose-400 border-rose-500/30",
};

export default function ActiviteView() {
  const [filterPeriod, setFilterPeriod] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pôle filter: 'all' | 'coiffure' | 'cafe'
  const [selectedPole, setSelectedPole] = useState("all");

  // Type filter: 'all' | 'VENTE' | 'DEPENSE' | 'APPORT' | 'RETRAIT' | 'SESSION' | 'ANNULATION' | 'AJUSTEMENT'
  const [selectedType, setSelectedType] = useState("all");

  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [ledgerData, setLedgerData] = useState({
    summary: {
      totalOperations: 0,
      totalIn: 0,
      totalOut: 0,
      netFlow: 0,
      countsByPole: { coiffure: 0, cafe: 0, caisse: 0 },
    },
    ledger: [],
  });

  // Modal Details
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const fetchLedger = async () => {
    setIsLoading(true);
    try {
      let url = `/reports/activity?period=${filterPeriod}&pole=${selectedPole}&type=${selectedType}`;
      if (filterPeriod === "custom" && startDate && endDate) {
        url = `/reports/activity?startDate=${startDate}&endDate=${endDate}&pole=${selectedPole}&type=${selectedType}`;
      }
      const res = await api.get(url);
      setLedgerData(res.data);
    } catch (error) {
      toast.error("Erreur de synchronisation du journal d'activité.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (filterPeriod !== "custom" || (startDate && endDate)) {
      fetchLedger();
    }
  }, [filterPeriod, startDate, endDate, selectedPole, selectedType]);

  // Client-side instant text filtering
  const filteredLedger = useMemo(() => {
    if (!searchQuery.trim()) return ledgerData.ledger;
    const q = searchQuery.toLowerCase();
    return ledgerData.ledger.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.ref.toLowerCase().includes(q) ||
        item.operator.toLowerCase().includes(q) ||
        item.motif.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q),
    );
  }, [ledgerData.ledger, searchQuery]);

  // ── EXPORT PDF INDIVIDUEL (REÇU / JUSTIFICATIF COMPTABLE) ──
  const handlePrintTransactionPDF = (tx) => {
    const doc = new jsPDF({ format: "a5" });

    doc.setFontSize(16);
    doc.setTextColor(156, 161, 73); // Olive Brand
    doc.text("SALON VSP - PIÈCE D'AUDIT COMPTABLE", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Réf Opération : ${tx.ref}`, 14, 30);
    doc.text(
      `Date & Heure : ${new Date(tx.date).toLocaleString("fr-FR")}`,
      14,
      36,
    );
    doc.text(`Pôle Assigné : ${tx.pole}`, 14, 42);
    doc.text(`Opérateur : ${tx.operator}`, 14, 48);
    doc.text(`Type : ${tx.categoryLabel}`, 14, 54);
    doc.text(`Mode de Règlement : ${tx.method}`, 14, 60);

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 66, 134, 66);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Désignation / Motif :", 14, 76);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const splitMotif = doc.splitTextToSize(tx.motif || tx.label, 120);
    doc.text(splitMotif, 14, 84);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    if (tx.inOut === "in") {
      doc.setTextColor(0, 150, 0);
      doc.text(`ENTRÉE EN CAISSE : + DZD ${formatMoney(tx.amount)}`, 14, 115);
    } else if (tx.inOut === "out") {
      doc.setTextColor(200, 0, 0);
      doc.text(`SORTIE DE CAISSE : - DZD ${formatMoney(tx.amount)}`, 14, 115);
    } else {
      doc.setTextColor(100, 100, 100);
      doc.text(`IMPACT CAISSE : NEUTRE (0.00 DZD)`, 14, 115);
    }

    doc.save(`Justificatif_${tx.ref.replace("#", "")}.pdf`);
    toast.success("Justificatif PDF téléchargé !");
  };

  // ── EXPORT CSV DU JOURNAL EN COURS ──
  const handleExportCSV = () => {
    if (filteredLedger.length === 0)
      return toast.error("Aucune opération à exporter.");

    const headers =
      "Date,Heure,Pole,Categorie,Reference,Operateur,Designation,Motif,Mode,Sens,Montant_DZD,Impact_Net_DZD\n";
    const rows = filteredLedger
      .map(
        (item) =>
          `"${new Date(item.date).toLocaleDateString("fr-FR")}","${new Date(item.date).toLocaleTimeString("fr-FR")}","${item.pole}","${item.categoryLabel}","${item.ref}","${item.operator}","${item.label.replace(/"/g, '""')}","${item.motif.replace(/"/g, '""')}","${item.method}","${item.inOut}",${item.amount},${item.netImpact}`,
      )
      .join("\n");

    const blob = new Blob([headers + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      "download",
      `Journal_Complet_VSP_${selectedPole.toUpperCase()}_${filterPeriod.toUpperCase()}.csv`,
    );
    link.click();
  };

  // ── EXPORT PDF GLOBAL DU JOURNAL COMPLET ──
  const handleExportFullPDF = () => {
    if (filteredLedger.length === 0)
      return toast.error("Aucune donnée à imprimer.");

    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(16);
    doc.setTextColor(156, 161, 73);
    doc.text("SALON VSP - GRAND LIVRE CHRONOLOGIQUE DES OPÉRATIONS", 14, 16);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Période : ${filterPeriod.toUpperCase()} | Pôle : ${selectedPole.toUpperCase()} | Généré le : ${new Date().toLocaleString("fr-FR")}`,
      14,
      22,
    );

    const tableRows = filteredLedger.map((row) => [
      new Date(row.date).toLocaleDateString("fr-FR") +
        " " +
        new Date(row.date).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      row.pole,
      row.categoryLabel,
      row.ref,
      row.operator,
      row.label,
      row.inOut === "in"
        ? `+ ${formatMoney(row.amount)}`
        : row.inOut === "out"
          ? `- ${formatMoney(row.amount)}`
          : "0.00",
      row.method,
    ]);

    doc.autoTable({
      head: [
        [
          "Date & Heure",
          "Pôle",
          "Type",
          "Réf",
          "Opérateur",
          "Désignation",
          "Montant (DZD)",
          "Mode",
        ],
      ],
      body: tableRows,
      startY: 28,
      headStyles: { fillColor: [15, 23, 42], textColor: [156, 161, 73] },
      styles: { fontSize: 7, cellPadding: 2 },
    });

    doc.save(`Journal_Activite_VSP_${selectedPole}_${filterPeriod}.pdf`);
    toast.success("Rapport PDF généré !");
  };

  const s = ledgerData.summary;

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* ══════════════════════════════════════════════════════════════
          1. EN-TÊTE PRINCIPALE & SÉLECTEUR DE DATES
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-center bg-surface border border-subtle p-5 shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-t-main flex items-center gap-2 uppercase tracking-widest">
            <List className="text-brand" size={26} /> Journal Global d'Activité
          </h2>
          <p className="text-xs font-bold text-t-muted uppercase tracking-wider mt-1">
            Traçabilité intégrale : Ventes, Décaissements, Apports, Clôtures
            &amp; Pertes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Date Presets */}
          <div className="flex bg-main border border-subtle p-1">
            {["today", "week", "month", "year"].map((p) => (
              <Button
                key={p}
                variant={filterPeriod === p ? "primary" : "ghost"}
                onClick={() => {
                  setFilterPeriod(p);
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-[10px] py-1.5 px-3 font-bold uppercase rounded-none"
              >
                {p === "today"
                  ? "Aujourd'hui"
                  : p === "week"
                    ? "7 Jours"
                    : p === "month"
                      ? "Ce Mois"
                      : "Année"}
              </Button>
            ))}
          </div>

          {/* Custom Date Input */}
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
          2. FILTRES SPÉCIFIQUES : PÔLE (COIFFURE / CAFÉ) & CATÉGORIES
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-surface border border-subtle p-4 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* PÔLE TOGGLE (TOUS / COIFFURE SEULE / CAFÉ SEUL) */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-t-muted tracking-widest mr-1">
            Pôle :
          </span>
          <div className="flex bg-main border border-subtle p-1 gap-1">
            <button
              type="button"
              onClick={() => setSelectedPole("all")}
              className={`px-3 py-1.5 text-xs font-bold uppercase transition-all rounded-none ${
                selectedPole === "all"
                  ? "bg-brand text-white shadow-md"
                  : "text-t-muted hover:text-t-main"
              }`}
            >
              Tous les Pôles (
              {s.countsByPole.coiffure +
                s.countsByPole.cafe +
                s.countsByPole.caisse}
              )
            </button>
            <button
              type="button"
              onClick={() => setSelectedPole("coiffure")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase transition-all rounded-none ${
                selectedPole === "coiffure"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-t-muted hover:text-blue-400"
              }`}
            >
              <Scissors size={13} /> Coiffure ({s.countsByPole.coiffure})
            </button>
            <button
              type="button"
              onClick={() => setSelectedPole("cafe")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase transition-all rounded-none ${
                selectedPole === "cafe"
                  ? "bg-amber-500 text-white shadow-md"
                  : "text-t-muted hover:text-amber-400"
              }`}
            >
              <Coffee size={13} /> Cafétéria ({s.countsByPole.cafe})
            </button>
          </div>
        </div>

        {/* TYPE D'OPÉRATION DROPDOWN */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-t-muted tracking-widest">
            Type d'opération :
          </span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-main border border-subtle text-t-main px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-brand rounded-none cursor-pointer"
          >
            <option value="all">Toutes les Opérations</option>
            <option value="VENTE">Ventes &amp; Prestations</option>
            <option value="DEPENSE">Dépenses &amp; Sorties Caisse</option>
            <option value="CHARGE">Charges OPEX Fixes</option>
            <option value="APPORT">Apports de Trésorerie (+)</option>
            <option value="RETRAIT">Retraits Barbiers</option>
            <option value="FOURNISSEUR">Paiements Grossistes</option>
            <option value="SESSION">Ouvertures &amp; Clôtures Caisse</option>
            <option value="ANNULATION">Tickets Annulés (Pertes)</option>
            <option value="AJUSTEMENT">Ajustements &amp; Pertes Stock</option>
            <option value="RETOUR">Retours Marchandises</option>
          </select>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          3. CARTES DE SYNTHÈSE DES FLUX D'ACTIVITÉ
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Opérations */}
        <div className="bg-surface border border-subtle p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-t-muted mb-1 flex items-center gap-1.5">
            <List size={13} /> Opérations Enregistrées
          </p>
          <p className="text-2xl font-mono font-bold text-t-main">
            {filteredLedger.length}
          </p>
          <p className="text-[9px] text-t-muted uppercase mt-1 font-bold">
            Audit trail actif
          </p>
        </div>

        {/* Entrées */}
        <div className="bg-surface border border-green-500/20 p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-green-500 mb-1 flex items-center gap-1.5">
            <ArrowDownRight size={13} /> Entrées (CA &amp; Apports)
          </p>
          <p className="text-2xl font-mono font-bold text-green-400">
            + DZD {formatMoney(s.totalIn)}
          </p>
          <p className="text-[9px] text-green-500/70 uppercase mt-1 font-bold">
            Flux positif en caisse
          </p>
        </div>

        {/* Sorties */}
        <div className="bg-surface border border-red-500/20 p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1 flex items-center gap-1.5">
            <ArrowUpRight size={13} /> Sorties (Charges, Coiffeurs, Dépenses)
          </p>
          <p className="text-2xl font-mono font-bold text-red-400">
            - DZD {formatMoney(s.totalOut)}
          </p>
          <p className="text-[9px] text-red-500/70 uppercase mt-1 font-bold">
            Décaissements totaux
          </p>
        </div>

        {/* Solde Net */}
        <div className="bg-surface border-2 border-brand/50 p-5 shadow-sm bg-[#0a0a0a]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
            <Wallet size={13} /> Solde Net de la Période
          </p>
          <p
            className={`text-2xl font-mono font-black ${
              s.netFlow >= 0 ? "text-[#00ff00]" : "text-red-500"
            }`}
          >
            {s.netFlow >= 0 ? "+" : "-"} DZD {formatMoney(Math.abs(s.netFlow))}
          </p>
          <p className="text-[9px] text-slate-500 uppercase mt-1 font-bold">
            Différentiel trésorerie
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          4. LE GRAND LIVRE DU JOURNAL D'AUDIT
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-surface border border-subtle shadow-sm overflow-hidden">
        {/* BARRE D'OUTILS ET RECHERCHE */}
        <div className="p-4 border-b border-subtle flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-main/40">
          <div className="relative flex-1 max-w-md">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-t-muted"
            />
            <input
              type="text"
              placeholder="Rechercher par client, coiffeur, motif ou référence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-main border border-subtle text-t-main px-4 py-2 pl-9 text-xs focus:outline-none focus:border-brand rounded-none font-bold"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-400 p-1"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="text-xs py-2 px-4 border-subtle rounded-none"
            >
              <FileText size={14} className="mr-1.5 text-green-500" /> Export
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportFullPDF}
              className="text-xs py-2 px-4 border-subtle rounded-none"
            >
              <FileDown size={14} className="mr-1.5 text-red-500" /> Export PDF
              A4
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-20 text-center animate-pulse text-brand uppercase tracking-widest text-xs font-bold">
            Chargement et réconciliation du journal d'activité...
          </div>
        ) : (
          <DataTable
            headers={[
              { label: "Date & Heure" },
              { label: "Pôle" },
              { label: "Type d'Opération" },
              { label: "Réf" },
              { label: "Opérateur" },
              { label: "Désignation & Motif" },
              { label: "Mode" },
              { label: "Montant / Impact", align: "right" },
              { label: "Actions", align: "right" },
            ]}
          >
            {filteredLedger.length === 0 ? (
              <tr>
                <td
                  colSpan="9"
                  className="text-center py-12 text-t-muted font-bold text-xs uppercase"
                >
                  Aucune opération correspondant à ces filtres.
                </td>
              </tr>
            ) : (
              filteredLedger.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-subtle hover:bg-brand/5 transition-colors"
                >
                  {/* Date & Heure */}
                  <td className="px-4 py-3 text-[10px] font-mono text-t-muted whitespace-nowrap">
                    {new Date(row.date).toLocaleDateString("fr-FR")}{" "}
                    <span className="font-bold text-t-main">
                      {new Date(row.date).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>

                  {/* Pôle Badge */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 text-[8px] font-bold uppercase border rounded-none ${
                        row.pole === "COIFFURE"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                          : row.pole === "CAFÉTÉRIA"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                      }`}
                    >
                      {row.pole}
                    </span>
                  </td>

                  {/* Type d'opération */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 text-[8px] font-bold uppercase border rounded-none ${
                        CATEGORY_STYLES[row.category] ||
                        "bg-main text-t-muted border-subtle"
                      }`}
                    >
                      {row.categoryLabel}
                    </span>
                  </td>

                  {/* Réf */}
                  <td className="px-4 py-3 font-mono font-bold text-brand text-[10px] whitespace-nowrap">
                    {row.ref}
                  </td>

                  {/* Opérateur */}
                  <td className="px-4 py-3 text-[10px] font-bold text-t-main uppercase whitespace-nowrap">
                    {row.operator}
                  </td>

                  {/* Désignation & Motif */}
                  <td className="px-4 py-3 max-w-[280px]">
                    <p className="font-bold text-t-main text-xs uppercase truncate">
                      {row.label}
                    </p>
                    {row.motif && row.motif !== row.label && (
                      <p className="text-[10px] text-t-muted truncate mt-0.5 italic">
                        {row.motif}
                      </p>
                    )}
                  </td>

                  {/* Mode de Règlement */}
                  <td className="px-4 py-3 text-[10px] font-mono text-t-muted whitespace-nowrap">
                    {row.method}
                  </td>

                  {/* Montant / Impact */}
                  <td className="px-4 py-3 text-right font-mono font-black text-xs whitespace-nowrap">
                    {row.inOut === "in" ? (
                      <span className="text-green-400">
                        + DZD {formatMoney(row.amount)}
                      </span>
                    ) : row.inOut === "out" ? (
                      <span className="text-red-400">
                        - DZD {formatMoney(row.amount)}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">
                        DZD {formatMoney(row.amount)}
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSelectedTransaction(row);
                        setIsViewModalOpen(true);
                      }}
                      className="p-1.5 bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white rounded-none"
                      title="Voir les détails complets"
                    >
                      <Eye size={14} />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </DataTable>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          5. MODALE : DÉTAIL COMPLET DE L'OPÉRATION & TÉLÉCHARGEMENT
      ══════════════════════════════════════════════════════════════ */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)}>
        {selectedTransaction && (
          <div className="bg-slate-950 p-6 sm:p-8 border-t-4 border-brand w-full max-w-lg rounded-none">
            <div className="flex justify-between items-start mb-6 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-t-main uppercase tracking-widest flex items-center gap-2">
                  <Receipt className="text-brand" size={18} /> Détail Opération
                </h3>
                <p className="text-[10px] text-t-muted font-mono font-bold mt-1">
                  RÉF : {selectedTransaction.ref}
                </p>
              </div>
              <div className="flex gap-2">
                <span
                  className={`px-2 py-0.5 text-[9px] font-bold uppercase border rounded-none ${
                    selectedTransaction.pole === "COIFFURE"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                      : selectedTransaction.pole === "CAFÉTÉRIA"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                  }`}
                >
                  {selectedTransaction.pole}
                </span>
                <span
                  className={`px-2 py-0.5 text-[9px] font-bold uppercase border rounded-none ${
                    CATEGORY_STYLES[selectedTransaction.category] ||
                    "bg-main text-t-muted border-subtle"
                  }`}
                >
                  {selectedTransaction.categoryLabel}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-6 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-900/50 p-3 border border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-t-muted block mb-0.5">
                    Date &amp; Heure
                  </span>
                  <span className="font-mono font-bold text-slate-200">
                    {new Date(selectedTransaction.date).toLocaleString("fr-FR")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-t-muted block mb-0.5">
                    Opérateur / Auteur
                  </span>
                  <span className="font-bold text-brand uppercase">
                    {selectedTransaction.operator}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-t-muted tracking-widest block mb-1">
                  Désignation Principale
                </span>
                <p className="text-sm font-bold text-t-main uppercase bg-slate-900 p-2.5 border border-slate-800">
                  {selectedTransaction.label}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-t-muted tracking-widest block mb-1">
                  Motif / Justification Complète
                </span>
                <p className="text-xs text-slate-300 bg-slate-900 p-2.5 border border-slate-800 italic leading-relaxed">
                  {selectedTransaction.motif || "Non spécifié"}
                </p>
              </div>

              <div className="flex justify-between items-center bg-slate-900/80 p-3 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-t-muted">
                  Mode de Paiement
                </span>
                <span className="font-mono font-bold text-slate-200">
                  {selectedTransaction.method}
                </span>
              </div>

              {/* Panneau de l'impact net sur le tiroir */}
              <div className="bg-[#0a0a0a] p-4 border-2 border-slate-800 flex justify-between items-center shadow-inner">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">
                    Impact Caisse / Trésorerie
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold">
                    {selectedTransaction.inOut === "in"
                      ? "Entrée d'argent perçue"
                      : selectedTransaction.inOut === "out"
                        ? "Sortie d'espèces décaissée"
                        : "Opération informative / Écart"}
                  </span>
                </div>
                <span
                  className={`text-2xl font-mono font-black ${
                    selectedTransaction.inOut === "in"
                      ? "text-[#00ff00]"
                      : selectedTransaction.inOut === "out"
                        ? "text-red-500"
                        : "text-slate-300"
                  }`}
                >
                  {selectedTransaction.inOut === "in"
                    ? "+"
                    : selectedTransaction.inOut === "out"
                      ? "-"
                      : ""}{" "}
                  DZD {formatMoney(selectedTransaction.amount)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={() => setIsViewModalOpen(false)}
                className="py-3 text-xs font-bold uppercase tracking-widest rounded-none"
              >
                Fermer
              </Button>
              <Button
                variant="success"
                onClick={() => handlePrintTransactionPDF(selectedTransaction)}
                className="py-3 text-xs font-bold shadow-md flex items-center justify-center gap-1.5 rounded-none"
              >
                <FileDown size={15} /> Justificatif PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
