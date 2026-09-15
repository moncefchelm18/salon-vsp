import React, { useState, useEffect } from "react";
import {
  Wallet,
  Plus,
  Minus,
  Key,
  RefreshCcw,
  AlertTriangle,
  CheckCircle,
  Eye,
  Clock,
  Banknote,
  Check,
  X,
  Search,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

import Button from "../common/Button";
import DataTable from "../common/DataTable";
import Modal from "../common/Modal";
import Input from "../common/Input";
import ConfirmModal from "../common/ConfirmModal";
import ThermalReceipt from "../common/ThermalReceipt";

export default function CaisseManager() {
  const { user } = useAuth();
  const [currentTill, setCurrentTill] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modales Caisse
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [startingCash, setStartingCash] = useState("");

  const [isAdjModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjType, setAdjType] = useState("out");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjMotif, setAdjMotif] = useState("");
  const [adjDepartment, setAdjDepartment] = useState("coiffure"); // <-- "coiffure" ou "cafe"

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [reportedCash, setReportedCash] = useState("");

  // Modale Audit (Visionner une caisse passée OU actuelle)
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [tillToAudit, setTillToAudit] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");

  const [printData, setPrintData] = useState(null);
  const [printTrigger, setPrintTrigger] = useState(0);

  const [pendingPayouts, setPendingPayouts] = useState([]);

  const loadData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const [currRes, histRes, payoutsRes] = await Promise.all([
        api.get("/caisse/current"),
        api.get("/caisse/history"),
        api.get("/barbers/payouts/pending"),
      ]);
      setCurrentTill(currRes.data);
      setHistory(histRes.data);
      setPendingPayouts(payoutsRes.data);
    } catch (err) {
      if (isInitial) toast.error("Erreur de synchronisation caisse");
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenTill = async (e) => {
    e.preventDefault();
    if (!startingCash || parseFloat(startingCash) < 0)
      return toast.error("Montant invalide");
    try {
      await api.post("/caisse/open", {
        startingCash: parseFloat(startingCash),
        username: user?.username,
      });
      toast.success("Caisse ouverte pour la journée !");
      setIsOpenModalOpen(false);
      loadData();
    } catch (err) {
      toast.error("Échec de l'ouverture.");
    }
  };

  const handleApprovePayout = async (payout) => {
    if (
      !window.confirm(
        `Donner DZD ${payout.amount.toFixed(2)} en espèces à ${payout.barber?.name} ? (Sera déduit du tiroir)`,
      )
    )
      return;
    try {
      await api.patch(`/barbers/payouts/${payout.id}/approve`, {
        processedBy: user?.username || "Réception",
      });
      toast.success(
        `Retrait de ${payout.amount} DZD validé pour ${payout.barber?.name} !`,
      );
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur d'approbation.");
    }
  };

  const handleRejectPayout = async (payout) => {
    if (!window.confirm(`Rejeter la demande de ${payout.barber?.name} ?`))
      return;
    try {
      await api.patch(`/barbers/payouts/${payout.id}/reject`, {
        processedBy: user?.username || "Réception",
      });
      toast.success("Demande refusée.");
      loadData();
    } catch (err) {
      toast.error("Erreur de rejet.");
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!adjAmount || parseFloat(adjAmount) <= 0)
      return toast.error("Montant invalide");
    if (!adjMotif.trim()) return toast.error("Motif obligatoire");
    try {
      await api.post("/caisse/transaction", {
        amount: parseFloat(adjAmount),
        type: adjType,
        motif: adjMotif,
        department: adjDepartment, // <-- TRANSMET LE PÔLE SÉLECTIONNÉ
      });
      toast.success(
        adjType === "in" ? "Apport enregistré" : "Dépense enregistrée",
      );
      setIsAdjustmentModalOpen(false);
      setAdjAmount("");
      setAdjMotif("");
      setAdjDepartment("coiffure"); // Réinitialise
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur de caisse");
    }
  };

  const handleCheckBeforeClose = (e) => {
    e.preventDefault();
    if (!reportedCash || parseFloat(reportedCash) < 0)
      return toast.error("Montant invalide");

    const parsedReported = parseFloat(reportedCash);
    const differencePrevue = parsedReported - currentTill.expectedCash;

    if (Math.abs(differencePrevue) > 2000) {
      setConfirmMessage(
        `Vous êtes sur le point de déclarer ${parsedReported} DA en caisse.\nCela génère un écart anormal de ${differencePrevue.toFixed(2)} DA !\n\nÊtes-vous sûr de ne pas avoir fait d'erreur de frappe ?`,
      );
      setIsConfirmModalOpen(true);
    } else {
      executeCloseTill(parsedReported);
    }
  };

  const executeCloseTill = async (finalReportedCash) => {
    try {
      const res = await api.post("/caisse/close", {
        reportedCash: finalReportedCash,
        username: user?.username,
      });
      const closedTill = res.data;
      const diff = closedTill.difference;

      if (diff === 0) toast.success("Caisse parfaite !");
      else if (diff < 0)
        toast.error(`DÉFICIT de DZD ${Math.abs(diff).toFixed(2)}`, {
          duration: 5000,
        });
      else
        toast.success(`EXCÉDENT de DZD ${diff.toFixed(2)}`, { duration: 5000 });

      const totalIn = closedTill.transactions
        .filter((t) => t.type === "in")
        .reduce((sum, t) => sum + t.amount, 0);
      const totalOut = closedTill.transactions
        .filter((t) => t.type === "out")
        .reduce((sum, t) => sum + t.amount, 0);

      setPrintData({
        closedAt: closedTill.closedAt,
        closedBy: closedTill.closedBy,
        startingCash: closedTill.startingCash,
        expectedCash: closedTill.expectedCash,
        reportedCash: closedTill.reportedCash,
        difference: closedTill.difference,
        totalIn,
        totalOut,
      });
      setPrintTrigger((prev) => prev + 1);

      setIsCloseModalOpen(false);
      setReportedCash("");
      loadData();
    } catch (err) {
      toast.error("Erreur de clôture");
    }
  };

  // ── OUVRE LA FENÊTRE D'AUDIT ──
  const handleOpenAudit = (till) => {
    setTillToAudit(till);
    setIsAuditModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center animate-pulse text-brand uppercase tracking-widest text-xs font-bold">
        Synchronisation du tiroir-caisse...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. ÉTAT DE LA CAISSE ACTUELLE */}
      {!currentTill ? (
        <div className="bg-surface border border-red-500/20 p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
          <AlertTriangle className="w-16 h-16 text-red-500 animate-bounce" />
          <h2 className="text-2xl font-serif font-bold text-t-main uppercase tracking-widest">
            Le Tiroir-Caisse est Fermé
          </h2>
          <p className="text-t-muted text-sm max-w-md">
            Ouvrez la caisse et enregistrez le fond de caisse du matin avant
            d'encaisser des ventes.
          </p>
          <Button
            variant="success"
            onClick={() => {
              setStartingCash("");
              setIsOpenModalOpen(true);
            }}
            className="py-4 px-8 mt-4 font-bold shadow-md"
          >
            <Key size={16} className="mr-2" /> Ouvrir la Caisse
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PANNEAU DE CONTRÔLE */}
          <div
            className={`bg-surface border-t-4 p-6 flex flex-col justify-between space-y-6 shadow-sm ${currentTill.isExpired ? "border-red-500 bg-red-950/10" : "border-green-500"}`}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                {currentTill.isExpired ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-bounce" />
                    <span className="text-xs font-bold text-red-500 uppercase tracking-widest">
                      Alerte : Oubli de Clôture
                    </span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">
                      Caisse Ouverte
                    </span>
                  </>
                )}
              </div>
              <h3
                className={`text-xl font-serif font-bold uppercase tracking-widest ${currentTill.isExpired ? "text-red-500" : "text-t-main"}`}
              >
                {currentTill.isExpired
                  ? "Session Précédente"
                  : "Session Actuelle"}
              </h3>
              <p className="text-[10px] text-t-muted font-mono mt-1 font-bold">
                Ouverte par {currentTill.openedBy} le{" "}
                {new Date(currentTill.openedAt).toLocaleDateString()} à{" "}
                {new Date(currentTill.openedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div
              className={`bg-main border p-4 space-y-4 shadow-inner ${currentTill.isExpired ? "border-red-500/50" : "border-subtle"}`}
            >
              <div className="flex justify-between text-[10px] uppercase text-t-muted items-center">
                <span className="font-bold">Fond de Départ :</span>
                <span className="font-mono font-bold text-t-main text-sm">
                  DZD {currentTill.startingCash.toFixed(2)}
                </span>
              </div>
              <div className="bg-[#0a0a0a] p-4 border-2 border-slate-800 flex flex-col gap-1 shadow-inner">
                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                  Solde Théorique Attendu
                </span>
                <span
                  className={`text-3xl font-mono font-black text-right tracking-wider ${currentTill.isExpired ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]" : "text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.4)]"}`}
                >
                  DZD {currentTill.expectedCash.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {currentTill.isExpired ? (
                // ── ÉCRAN BLOQUÉ (OUBLI DE CLÔTURE) ──
                <div className="text-center p-3 border border-red-500/30 bg-red-500/10">
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-2">
                    Action Requise
                  </p>
                  <p className="text-[11px] text-slate-300 leading-tight">
                    Cette caisse date d'une session précédente. Vous devez
                    obligatoirement compter les espèces et la clôturer avant de
                    démarrer une nouvelle journée.
                  </p>
                </div>
              ) : (
                // ── ÉCRAN NORMAL (CAISSE DU JOUR) ──
                <div className="flex gap-3">
                  <Button
                    variant="success"
                    onClick={() => {
                      setAdjType("in");
                      setIsAdjustmentModalOpen(true);
                    }}
                    className="flex-1 py-3 text-xs font-bold shadow-md"
                  >
                    <Plus size={14} className="mr-1" /> Apport (+)
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setAdjType("out");
                      setIsAdjustmentModalOpen(true);
                    }}
                    className="flex-1 py-3 text-xs font-bold shadow-md"
                  >
                    <Minus size={14} className="mr-1" /> Dépense (-)
                  </Button>
                </div>
              )}

              <Button
                variant="secondary"
                onClick={() => handleOpenAudit(currentTill)}
                className="w-full py-3 text-xs font-bold uppercase tracking-widest bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white"
              >
                <Search size={14} className="mr-1.5" /> Auditer cette Caisse
              </Button>

              {/* BOUTON CLÔTURE (ROUGE SOLIDE AVEC TEXTE BLANC NET) */}
              <Button
                variant="primary"
                onClick={() => setIsCloseModalOpen(true)}
                className={`w-full py-4 text-xs font-bold uppercase tracking-widest shadow-lg mt-2 ${
                  currentTill.isExpired
                    ? "!bg-red-600 hover:!bg-red-500 !border-red-600 !text-white shadow-red-500/30 animate-pulse"
                    : "shadow-brand/20"
                }`}
              >
                {currentTill.isExpired
                  ? "Clôturer la Session Précédente"
                  : "Clôturer & Compter"}
              </Button>
            </div>
          </div>

          {/* HISTORIQUE DES MOUVEMENTS (LIVE) */}
          <div className="lg:col-span-2 bg-surface border border-subtle p-6 flex flex-col shadow-sm">
            <div className="flex justify-between items-center border-b border-subtle pb-3 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-t-muted">
                Derniers Mouvements du Tiroir
              </h3>
              <span className="text-[10px] font-mono font-bold text-t-muted bg-main px-2 py-1 border border-subtle">
                {currentTill.transactions.length} Opération(s)
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px]">
              {currentTill.transactions.length === 0 ? (
                <p className="text-center text-t-muted text-[10px] py-12 uppercase tracking-widest font-bold">
                  Aucune transaction enregistrée.
                </p>
              ) : (
                currentTill.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center p-3 bg-main border border-subtle shadow-sm hover:border-brand/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 text-[8px] font-bold uppercase border ${
                            tx.department === "cafe"
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {tx.department === "cafe" ? "Café" : "Salon"}
                        </span>
                        <p className="font-bold text-t-main text-xs uppercase truncate max-w-[300px]">
                          {tx.motif}
                        </p>
                      </div>
                      <p className="text-[9px] text-t-muted font-mono mt-1 font-bold">
                        {new Date(tx.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <p
                      className={`font-mono font-bold text-xs px-3 py-1.5 border ${
                        tx.type === "in"
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      }`}
                    >
                      {tx.type === "in" ? "+" : "-"} DZD {tx.amount.toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DEMANDES DE RETRAITS (BARBIERS) ── */}
      {pendingPayouts.length > 0 && currentTill && (
        <div className="bg-surface border-2 border-amber-500 shadow-xl p-6 relative overflow-hidden animate-in fade-in duration-300">
          <div className="absolute top-0 left-0 w-2 h-full bg-amber-500 animate-pulse"></div>

          <div className="flex justify-between items-center mb-4 border-b border-subtle pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2">
                <Banknote size={18} /> Demandes de Rémunération en Attente
              </h3>
              <p className="text-[10px] text-t-muted font-bold mt-1 uppercase tracking-widest">
                Valider déduira l'argent de la caisse.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingPayouts.map((p) => (
              <div
                key={p.id}
                className="bg-main border border-subtle p-4 flex flex-col justify-between shadow-sm space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-t-main text-sm uppercase">
                      {p.barber?.name}
                    </p>
                    <p className="text-[9px] text-t-muted font-mono mt-0.5">
                      Demandé à{" "}
                      {new Date(p.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className="text-lg font-mono font-black text-amber-500">
                    DZD {p.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    onClick={() => handleRejectPayout(p)}
                    className="py-2.5 px-3 text-[10px] flex-1"
                  >
                    <X size={14} className="mr-1" /> Rejeter
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => handleApprovePayout(p)}
                    className="py-2.5 px-4 text-[10px] font-bold flex-1 shadow-md"
                  >
                    <Check size={14} className="mr-1" /> Payer (Tiroir)
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. HISTORIQUE DES ANCIENNES FERMETURES */}
      <div className="bg-surface border border-subtle shadow-sm">
        <div className="p-5 border-b border-subtle">
          <h3 className="text-lg font-serif font-bold text-brand uppercase tracking-widest">
            Historique des Clôtures
          </h3>
        </div>
        <DataTable
          headers={[
            { label: "Clôturé le" },
            { label: "Fond Départ" },
            { label: "Théorique" },
            { label: "Réel Compté" },
            { label: "Écart de Caisse", align: "right" },
            { label: "Audit", align: "right" },
          ]}
        >
          {history.length === 0 ? (
            <tr>
              <td
                colSpan="6"
                className="text-center py-12 text-t-muted text-xs font-bold uppercase tracking-widest"
              >
                Aucun historique de clôture.
              </td>
            </tr>
          ) : (
            history.map((h) => (
              <tr
                key={h.id}
                className="border-b border-subtle hover:bg-brand/5"
              >
                <td className="px-6 py-4 text-[10px] font-mono text-t-muted">
                  {new Date(h.closedAt).toLocaleDateString("fr-FR")} à{" "}
                  {new Date(h.closedAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  <span className="block mt-1 font-bold">
                    Par: {h.closedBy}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-t-main text-xs">
                  DZD {h.startingCash.toFixed(2)}
                </td>
                <td className="px-6 py-4 font-mono text-t-main text-xs">
                  DZD {h.expectedCash.toFixed(2)}
                </td>
                <td className="px-6 py-4 font-mono font-bold text-t-main text-sm">
                  DZD {h.reportedCash.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right">
                  {h.difference === 0 ? (
                    <span className="inline-block px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 font-bold text-[10px] uppercase shadow-sm">
                      Parfaite
                    </span>
                  ) : h.difference < 0 ? (
                    <span className="inline-block px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 font-mono font-bold text-[10px] shadow-sm">
                      Déficit: -DZD {Math.abs(h.difference).toFixed(2)}
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono font-bold text-[10px] shadow-sm">
                      Excédent: +DZD {h.difference.toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="secondary"
                    onClick={() => handleOpenAudit(h)}
                    className="py-2 px-3 text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white transition-colors"
                    title="Voir toutes les transactions"
                  >
                    <Eye size={14} className="mr-1.5" /> Voir Détails
                  </Button>
                </td>
              </tr>
            ))
          )}
        </DataTable>
      </div>

      {/* ── MODALE : AUDIT DE CAISSE (Ancienne ou Actuelle) ── */}
      <Modal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      >
        {tillToAudit && (
          <div className="flex flex-col bg-slate-950 max-h-[90vh]">
            <div className="px-6 py-5 border-b-4 border-slate-800 shrink-0 bg-slate-900">
              <h3 className="text-lg font-serif font-bold text-t-main uppercase tracking-widest flex items-center gap-2">
                <Search size={20} className="text-brand" />
                {tillToAudit.status === "open"
                  ? "Audit de la Caisse en Cours"
                  : "Audit de la Clôture"}
              </h3>
              <p className="text-[10px] text-t-muted font-mono mt-1.5 font-bold uppercase tracking-widest">
                Ouverte le{" "}
                {new Date(tillToAudit.openedAt).toLocaleString("fr-FR")}
                {tillToAudit.closedAt &&
                  ` • Clôturée le ${new Date(tillToAudit.closedAt).toLocaleString("fr-FR")}`}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-main border border-subtle p-4 shadow-inner grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <span className="text-[9px] uppercase font-bold text-t-muted">
                    Fond Départ
                  </span>
                  <p className="text-sm font-mono font-bold text-t-main">
                    DZD {tillToAudit.startingCash.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-t-muted">
                    Théorique Actuel
                  </span>
                  <p className="text-sm font-mono font-bold text-brand">
                    DZD {tillToAudit.expectedCash.toFixed(2)}
                  </p>
                </div>
                {tillToAudit.status === "closed" && (
                  <>
                    <div className="border-l border-subtle pl-4">
                      <span className="text-[9px] uppercase font-bold text-t-muted">
                        Compté par caissier
                      </span>
                      <p className="text-base font-mono font-bold text-t-main">
                        DZD {tillToAudit.reportedCash?.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-t-muted">
                        Écart Constaté
                      </span>
                      <p
                        className={`text-base font-mono font-bold ${tillToAudit.difference === 0 ? "text-green-500" : tillToAudit.difference < 0 ? "text-red-500" : "text-amber-500"}`}
                      >
                        {tillToAudit.difference === 0
                          ? "Parfait (0.00)"
                          : `${tillToAudit.difference > 0 ? "+" : ""}${tillToAudit.difference.toFixed(2)}`}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-t-muted border-b border-subtle pb-2 mb-3">
                  Registre des {tillToAudit.transactions.length} Mouvements
                </h4>
                <div className="space-y-2">
                  {tillToAudit.transactions.length === 0 ? (
                    <p className="text-center text-t-muted text-[10px] py-6 uppercase font-bold tracking-widest bg-main border border-dashed border-subtle">
                      Aucun mouvement.
                    </p>
                  ) : (
                    tillToAudit.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex justify-between items-center p-3 bg-main border border-subtle shadow-sm hover:border-brand/50 transition-colors"
                      >
                        <div>
                          <p className="font-bold text-t-main text-xs uppercase max-w-[250px] sm:max-w-[400px] truncate leading-tight">
                            {tx.motif}
                          </p>
                          <p className="text-[9px] text-t-muted font-mono mt-1 font-bold">
                            {new Date(tx.createdAt).toLocaleTimeString("fr-FR")}
                          </p>
                        </div>
                        <p
                          className={`font-mono font-bold text-xs px-2.5 py-1.5 border ${
                            tx.type === "in"
                              ? "bg-green-500/10 text-green-500 border-green-500/20"
                              : "bg-red-500/10 text-red-500 border-red-500/20"
                          }`}
                        >
                          {tx.type === "in" ? "+" : "-"} {tx.amount.toFixed(2)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 shrink-0">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setIsAuditModalOpen(false)}
                className="py-3 font-bold uppercase tracking-widest text-xs"
              >
                Fermer l'Audit
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODALES D'ACTIONS (Ouverture, Ajustement, Clôture) GARDÉES À L'IDENTIQUE */}
      {/* ... */}

      {/* --- MODAL 1 : OUVERTURE DE CAISSE --- */}
      <Modal isOpen={isOpenModalOpen} onClose={() => setIsOpenModalOpen(false)}>
        <form onSubmit={handleOpenTill} className="p-8 bg-surface">
          <h3 className="text-xl font-serif font-bold text-brand mb-6 uppercase tracking-wider text-center border-b border-subtle pb-4">
            Démarrage de la Caisse
          </h3>
          <div className="space-y-6">
            <Input
              label="Fond de Caisse de Départ (DZD)"
              type="number"
              step="0.01"
              value={startingCash}
              onChange={(e) => setStartingCash(e.target.value)}
              required
              placeholder="Entrez le montant de monnaie dans le tiroir"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-subtle">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsOpenModalOpen(false)}
                className="font-bold py-4 text-xs"
              >
                Annuler
              </Button>
              <Button
                variant="success"
                type="submit"
                className="font-bold py-4 text-xs shadow-md"
              >
                Valider & Ouvrir
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* --- MODAL 2 : AJUSTEMENT DE CAISSE --- */}
      <Modal
        isOpen={isAdjModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
      >
        <form onSubmit={handleAddTransaction} className="p-8 bg-surface">
          <h3 className="text-xl font-serif font-bold text-brand mb-6 uppercase tracking-wider text-center border-b border-subtle pb-4">
            {adjType === "in"
              ? "Enregistrer un Apport d'espèces"
              : "Enregistrer une Sortie de Caisse"}
          </h3>

          <div className="space-y-4">
            {/* ── NOUVEAU SÉLECTEUR DE PÔLE (ANTER VS CHÉRIF) ── */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-t-muted mb-2">
                Pôle concerné (Pour qui est cette opération ?) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjDepartment("coiffure")}
                  className={`py-3 px-2 text-xs font-bold uppercase tracking-wider transition-all border rounded-none ${
                    adjDepartment === "coiffure"
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "bg-main text-t-muted border-subtle hover:text-t-main"
                  }`}
                >
                  💈 Pôle Salon
                </button>
                <button
                  type="button"
                  onClick={() => setAdjDepartment("cafe")}
                  className={`py-3 px-2 text-xs font-bold uppercase tracking-wider transition-all border rounded-none ${
                    adjDepartment === "cafe"
                      ? "bg-amber-500 text-white border-amber-500 shadow-md"
                      : "bg-main text-t-muted hover:text-t-main"
                  }`}
                >
                  ☕ Pôle Cafétéria
                </button>
              </div>
            </div>
            {/* ────────────────────────────────────────────────── */}

            <Input
              label="Montant d'espèces (DZD) *"
              type="number"
              step="0.01"
              value={adjAmount}
              onChange={(e) => setAdjAmount(e.target.value)}
              required
              placeholder="0.00"
              autoFocus
            />
            <Input
              label="Motif / Justification *"
              type="text"
              value={adjMotif}
              onChange={(e) => setAdjMotif(e.target.value)}
              required
              placeholder={
                adjType === "in"
                  ? "ex: Ajout monnaie de 200 DA"
                  : "ex: Achat Lait / Lames de rasoir"
              }
            />
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-subtle">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="font-bold py-4 text-xs"
              >
                Annuler
              </Button>
              <Button
                variant={adjType === "in" ? "success" : "danger"}
                type="submit"
                className="font-bold py-4 text-xs shadow-md"
              >
                Confirmer l'opération
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* --- MODAL 3 : CLÔTURE DE CAISSE (LE SOIR) --- */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
      >
        <form
          onSubmit={handleCheckBeforeClose}
          className="p-8 bg-surface border-t-4 border-red-500"
        >
          <h3 className="text-xl font-serif font-bold text-red-500 mb-2 uppercase tracking-wider text-center">
            Clôture de Caisse Finale
          </h3>
          <p className="text-[10px] text-t-muted font-bold uppercase tracking-widest text-center border-b border-subtle pb-4 mb-6">
            Clôture de session à l'aveugle
          </p>
          <div className="space-y-6">
            <Input
              label="Montant des espèces réelles comptées (DZD)"
              type="number"
              step="0.01"
              value={reportedCash}
              onChange={(e) => setReportedCash(e.target.value)}
              required
              placeholder="Comptez le tiroir-caisse et saisissez le montant"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-subtle">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsCloseModalOpen(false)}
                className="font-bold py-4 text-xs"
              >
                Retour
              </Button>
              <Button
                variant="danger"
                type="submit"
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-none shadow-lg shadow-red-500/20 text-xs"
              >
                Valider la Clôture
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL 4 : CONFIRMATION ÉCART */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => executeCloseTill(parseFloat(reportedCash))}
        title="ÉCART ANORMAL DÉTECTÉ"
        message={confirmMessage}
        confirmText="Forcer la Clôture"
        cancelText="Corriger la saisie"
        isDanger={true}
      />

      {/* Impression Z-Report */}
      <ThermalReceipt
        type="z-report"
        data={printData}
        printTrigger={printTrigger}
      />
    </div>
  );
}
