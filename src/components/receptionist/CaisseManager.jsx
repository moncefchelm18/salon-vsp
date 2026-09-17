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
  Calendar,
  User,
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
  const [adjDepartment, setAdjDepartment] = useState("coiffure");

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [reportedCash, setReportedCash] = useState("");

  // Modale Audit
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [tillToAudit, setTillToAudit] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");

  const [printData, setPrintData] = useState(null);
  const [printTrigger, setPrintTrigger] = useState(0);

  const [pendingPayouts, setPendingPayouts] = useState([]);

  const [startingCashProvider, setStartingCashProvider] = useState("commune"); // 'commune', 'coiffure', 'cafe'

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
        startingCashProvider,
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
        department: adjDepartment,
      });
      toast.success(
        adjType === "in" ? "Apport enregistré" : "Dépense enregistrée",
      );
      setIsAdjustmentModalOpen(false);
      setAdjAmount("");
      setAdjMotif("");
      setAdjDepartment("coiffure");
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
        `Vous êtes sur le point de déclarer ${parsedReported} DA en caisse.\nCela génère un écart de ${differencePrevue.toFixed(2)} DA !\n\nConfirmez-vous ce comptage ?`,
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

      if (diff === 0) toast.success("Caisse parfaite (0.00 DA) !");
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
    <div className="space-y-6 select-none">
      {/* ── 1. SESSION EN COURS ── */}
      {!currentTill ? (
        <div className="bg-surface border border-red-500/20 p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm rounded-none">
          <AlertTriangle className="w-16 h-16 text-red-500 animate-bounce" />
          <h2 className="text-2xl font-serif font-bold text-t-main uppercase tracking-widest">
            Le Tiroir-Caisse est Fermé
          </h2>
          <p className="text-t-muted text-sm max-w-md">
            Ouvrez la caisse et saisissez le fond de monnaie avant de réaliser
            des ventes.
          </p>
          <Button
            variant="success"
            onClick={() => {
              setStartingCash("");
              setIsOpenModalOpen(true);
            }}
            className="py-4 px-8 mt-4 font-bold shadow-md rounded-none"
          >
            <Key size={16} className="mr-2" /> Ouvrir la Caisse
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panneau de Contrôle Live */}
          <div
            className={`bg-surface border-t-4 p-6 flex flex-col justify-between space-y-6 shadow-sm rounded-none ${
              currentTill.isExpired
                ? "border-red-500 bg-red-950/10"
                : "border-green-500"
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                {currentTill.isExpired ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-bounce" />
                    <span className="text-xs font-bold text-red-500 uppercase tracking-widest">
                      Session Précédente Non Clôturée
                    </span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">
                      Caisse Active
                    </span>
                  </>
                )}
              </div>
              <h3
                className={`text-xl font-serif font-bold uppercase tracking-widest ${
                  currentTill.isExpired ? "text-red-500" : "text-t-main"
                }`}
              >
                {currentTill.isExpired ? "Clôture Requise" : "Session Ouverte"}
              </h3>
              <p className="text-[10px] text-t-muted font-mono mt-1 font-bold">
                Par {currentTill.openedBy} le{" "}
                {new Date(currentTill.openedAt).toLocaleDateString()} à{" "}
                {new Date(currentTill.openedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="bg-main border border-subtle p-4 space-y-4 shadow-inner rounded-none">
              <div className="flex justify-between text-xs uppercase text-t-muted items-center">
                <span className="font-bold">Fond Initial :</span>
                <span className="font-mono font-bold text-t-main text-sm">
                  DZD {currentTill.startingCash.toFixed(2)}
                </span>
              </div>
              <div className="bg-[#0a0a0a] p-4 border-2 border-slate-800 flex flex-col gap-1 shadow-inner rounded-none">
                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                  Espèces Attendues en Tiroir
                </span>
                <span
                  className={`text-3xl font-mono font-black text-right tracking-wider ${
                    currentTill.isExpired
                      ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                      : "text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.4)]"
                  }`}
                >
                  DZD {currentTill.expectedCash.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {!currentTill.isExpired && (
                <div className="flex gap-2">
                  <Button
                    variant="success"
                    onClick={() => {
                      setAdjType("in");
                      setIsAdjustmentModalOpen(true);
                    }}
                    className="flex-1 py-3 text-xs font-bold shadow-md rounded-none"
                  >
                    <Plus size={14} className="mr-1" /> Apport (+)
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setAdjType("out");
                      setIsAdjustmentModalOpen(true);
                    }}
                    className="flex-1 py-3 text-xs font-bold shadow-md rounded-none"
                  >
                    <Minus size={14} className="mr-1" /> Dépense (-)
                  </Button>
                </div>
              )}

              <Button
                variant="secondary"
                onClick={() => handleOpenAudit(currentTill)}
                className="w-full py-3 text-xs font-bold uppercase tracking-widest bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white rounded-none"
              >
                <Search size={14} className="mr-1.5" /> Auditer les Mouvements
              </Button>

              <Button
                variant="primary"
                onClick={() => setIsCloseModalOpen(true)}
                className={`w-full py-4 text-xs font-bold uppercase tracking-widest shadow-lg rounded-none ${
                  currentTill.isExpired
                    ? "!bg-red-600 hover:!bg-red-500 !border-red-600 !text-white animate-pulse"
                    : "shadow-brand/20"
                }`}
              >
                {currentTill.isExpired
                  ? "Clôturer la Session d'Hier"
                  : "Clôturer la Caisse"}
              </Button>
            </div>
          </div>

          {/* Mouvements en direct */}
          <div className="lg:col-span-2 bg-surface border border-subtle p-6 flex flex-col shadow-sm rounded-none">
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
                <p className="text-center text-t-muted text-xs py-12 uppercase tracking-widest font-bold">
                  Aucun mouvement enregistré aujourd'hui.
                </p>
              ) : (
                currentTill.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center p-3 bg-main border border-subtle shadow-sm hover:border-brand/40 transition-colors rounded-none"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 text-[8px] font-bold uppercase border rounded-none ${
                            tx.department === "cafe"
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {tx.department === "cafe" ? "Café" : "Salon"}
                        </span>
                        <p className="font-bold text-t-main text-xs uppercase truncate max-w-[320px]">
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
                      className={`font-mono font-bold text-xs px-3 py-1.5 border rounded-none ${
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

      {/* ── 2. DEMANDES DE RETRAITS COIFFEURS ── */}
      {pendingPayouts.length > 0 && currentTill && (
        <div className="bg-surface border-2 border-amber-500 shadow-xl p-6 relative overflow-hidden rounded-none">
          <div className="absolute top-0 left-0 w-2 h-full bg-amber-500 animate-pulse" />

          <div className="flex justify-between items-center mb-4 border-b border-subtle pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2">
                <Banknote size={18} /> Demandes de Rémunération Coiffeurs en
                Attente
              </h3>
              <p className="text-[10px] text-t-muted font-bold mt-0.5 uppercase tracking-widest">
                Valider déduira immédiatement l'argent du tiroir-caisse
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingPayouts.map((p) => (
              <div
                key={p.id}
                className="bg-main border border-subtle p-4 flex flex-col justify-between shadow-sm space-y-4 rounded-none"
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
                  <span className="text-lg font-mono font-black text-amber-400">
                    DZD {p.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    onClick={() => handleRejectPayout(p)}
                    className="py-2.5 px-3 text-[10px] flex-1 rounded-none"
                  >
                    <X size={14} className="mr-1" /> Rejeter
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => handleApprovePayout(p)}
                    className="py-2.5 px-4 text-[10px] font-bold flex-1 shadow-md rounded-none"
                  >
                    <Check size={14} className="mr-1" /> Donner l'argent
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          3. TABLEAU DES ANCIENNES CLÔTURES (AVEC COLONNES SÉPARÉES !)
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-surface border border-subtle shadow-sm rounded-none overflow-hidden">
        <div className="p-5 border-b border-subtle bg-main/40">
          <h3 className="text-sm font-bold uppercase tracking-widest text-brand flex items-center gap-2">
            <Calendar size={18} /> Historique des Clôtures de Caisse
          </h3>
          <p className="text-[10px] text-t-muted uppercase font-bold mt-0.5">
            Registre officiel des comptages et écarts de caisse constatés
          </p>
        </div>

        <DataTable
          headers={[
            { label: "Date" },
            { label: "Heure" },
            { label: "Clôturé par" },
            { label: "Fond Départ" },
            { label: "Théorique" },
            { label: "Compté Réel" },
            { label: "Écart de Caisse", align: "right" },
            { label: "Audit", align: "right" },
          ]}
        >
          {history.length === 0 ? (
            <tr>
              <td
                colSpan="8"
                className="text-center py-12 text-t-muted text-xs font-bold uppercase tracking-widest"
              >
                Aucun historique de clôture disponible.
              </td>
            </tr>
          ) : (
            history.map((h) => (
              <tr
                key={h.id}
                className="border-b border-subtle hover:bg-brand/5 transition-colors"
              >
                {/* 1. DATE SÉPARÉE */}
                <td className="px-5 py-3 font-mono font-bold text-xs text-t-main whitespace-nowrap">
                  {new Date(h.closedAt).toLocaleDateString("fr-FR")}
                </td>

                {/* 2. HEURE SÉPARÉE */}
                <td className="px-5 py-3 font-mono text-xs text-t-muted whitespace-nowrap">
                  {new Date(h.closedAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>

                {/* 3. CLÔTURÉ PAR (RESPONSABLE) SÉPARÉ */}
                <td className="px-5 py-3 text-xs font-bold text-brand uppercase whitespace-nowrap">
                  <span className="flex items-center gap-1.5">
                    <User size={13} className="text-brand/60" />{" "}
                    {h.closedBy || "Système"}
                  </span>
                </td>

                {/* 4. FOND DÉPART */}
                <td className="px-5 py-3 font-mono text-xs text-t-muted">
                  DZD {h.startingCash.toFixed(2)}
                </td>

                {/* 5. THÉORIQUE ATTENDU */}
                <td className="px-5 py-3 font-mono text-xs text-slate-300">
                  DZD {h.expectedCash.toFixed(2)}
                </td>

                {/* 6. COMPTÉ RÉEL EN TIROIR */}
                <td className="px-5 py-3 font-mono font-bold text-xs text-green-400">
                  DZD {(h.reportedCash || 0).toFixed(2)}
                </td>

                {/* 7. ÉCART DE CAISSE */}
                <td className="px-5 py-3 text-right">
                  {h.difference === 0 ? (
                    <span className="inline-block px-2.5 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 font-bold text-[9px] uppercase rounded-none">
                      0.00 (Parfait)
                    </span>
                  ) : h.difference < 0 ? (
                    <span className="inline-block px-2.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 font-mono font-bold text-[9px] rounded-none">
                      Déficit : {h.difference.toFixed(2)} DA
                    </span>
                  ) : (
                    <span className="inline-block px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-bold text-[9px] rounded-none">
                      Excédent : +{h.difference.toFixed(2)} DA
                    </span>
                  )}
                </td>

                {/* 8. AUDIT DÉTAILLÉ */}
                <td className="px-5 py-3 text-right">
                  <Button
                    variant="secondary"
                    onClick={() => handleOpenAudit(h)}
                    className="py-1 px-3 text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white rounded-none"
                    title="Voir les mouvements de cette session"
                  >
                    <Eye size={13} className="mr-1" /> Voir
                  </Button>
                </td>
              </tr>
            ))
          )}
        </DataTable>
      </div>

      {/* ── MODALE : AUDIT DE SESSION ── */}
      <Modal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      >
        {tillToAudit && (
          <div className="flex flex-col bg-slate-950 max-h-[90vh] rounded-none">
            <div className="px-6 py-5 border-b border-slate-800 bg-slate-900 shrink-0">
              <h3 className="text-lg font-serif font-bold text-t-main uppercase tracking-widest flex items-center gap-2">
                <Search size={18} className="text-brand" />
                {tillToAudit.status === "open"
                  ? "Audit de la Caisse en Cours"
                  : "Détails de la Session Clôturée"}
              </h3>
              <p className="text-[10px] text-t-muted font-mono mt-1 font-bold uppercase">
                Ouverte le{" "}
                {new Date(tillToAudit.openedAt).toLocaleString("fr-FR")} par{" "}
                {tillToAudit.openedBy}
                {tillToAudit.closedAt &&
                  ` • Clôturée le ${new Date(tillToAudit.closedAt).toLocaleString("fr-FR")} par ${tillToAudit.closedBy}`}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-main border border-subtle p-4 grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-t-muted">
                    Fond Initial
                  </span>
                  <p className="font-bold text-slate-200 mt-0.5">
                    DZD {tillToAudit.startingCash.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-t-muted">
                    Attendu
                  </span>
                  <p className="font-bold text-amber-400 mt-0.5">
                    DZD {tillToAudit.expectedCash.toFixed(2)}
                  </p>
                </div>
                {tillToAudit.status === "closed" && (
                  <>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-t-muted">
                        Compté Réel
                      </span>
                      <p className="font-bold text-green-400 mt-0.5">
                        DZD {(tillToAudit.reportedCash || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-t-muted">
                        Écart
                      </span>
                      <p
                        className={`font-bold mt-0.5 ${tillToAudit.difference === 0 ? "text-green-500" : tillToAudit.difference < 0 ? "text-red-500" : "text-amber-500"}`}
                      >
                        {tillToAudit.difference === 0
                          ? "0.00 DA"
                          : `${tillToAudit.difference > 0 ? "+" : ""}${tillToAudit.difference.toFixed(2)} DA`}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-t-muted border-b border-subtle pb-2 mb-2">
                  Mouvements Enregistrés (
                  {tillToAudit.transactions?.length || 0})
                </h4>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {tillToAudit.transactions?.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex justify-between items-center p-2.5 bg-main border border-subtle text-xs"
                    >
                      <div>
                        <p className="font-bold text-t-main uppercase truncate max-w-[320px]">
                          {tx.motif}
                        </p>
                        <p className="text-[9px] text-t-muted font-mono">
                          {new Date(tx.createdAt).toLocaleTimeString("fr-FR")}
                        </p>
                      </div>
                      <p
                        className={`font-mono font-bold ${tx.type === "in" ? "text-green-400" : "text-red-400"}`}
                      >
                        {tx.type === "in" ? "+" : "-"} DZD{" "}
                        {tx.amount.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 shrink-0">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setIsAuditModalOpen(false)}
                className="py-3 font-bold uppercase tracking-widest text-xs rounded-none"
              >
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODALE OUVERTURE DE CAISSE ── */}
      <Modal isOpen={isOpenModalOpen} onClose={() => setIsOpenModalOpen(false)}>
        <form onSubmit={handleOpenTill} className="p-8 bg-surface rounded-none">
          <h3 className="text-lg font-serif font-bold text-brand mb-6 uppercase tracking-wider text-center border-b border-subtle pb-4">
            Ouverture du Tiroir-Caisse
          </h3>
          <div className="space-y-5">
            <Input
              label="Fond de Monnaie de Départ (DZD) *"
              type="number"
              step="500"
              value={startingCash}
              onChange={(e) => setStartingCash(e.target.value)}
              required
              placeholder="Ex: 5000"
              autoFocus
            />

            {/* SÉLECTEUR DE PROVENANCE DU FOND */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-t-muted mb-2">
                Provenance du Fond (Qui a mis la monnaie ?) *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStartingCashProvider("commune")}
                  className={`p-3 text-[10px] font-bold uppercase border rounded-none flex flex-col items-center justify-center gap-1 transition-all ${
                    startingCashProvider === "commune"
                      ? "bg-brand text-white border-brand shadow-md"
                      : "bg-main text-t-muted border-subtle hover:text-t-main"
                  }`}
                >
                  <span>🤝 Commune</span>
                  <span className="text-[8px] opacity-75 font-normal">
                    Permanent (Neutre)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStartingCashProvider("coiffure")}
                  className={`p-3 text-[10px] font-bold uppercase border rounded-none flex flex-col items-center justify-center gap-1 transition-all ${
                    startingCashProvider === "coiffure"
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "bg-main text-t-muted border-subtle hover:text-blue-400"
                  }`}
                >
                  <span>💈 Salon</span>
                  <span className="text-[8px] opacity-75 font-normal">
                    Avance Salon
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStartingCashProvider("cafe")}
                  className={`p-3 text-[10px] font-bold uppercase border rounded-none flex flex-col items-center justify-center gap-1 transition-all ${
                    startingCashProvider === "cafe"
                      ? "bg-amber-500 text-white border-amber-500 shadow-md"
                      : "bg-main text-t-muted border-subtle hover:text-amber-400"
                  }`}
                >
                  <span>☕ Cafétéria</span>
                  <span className="text-[8px] opacity-75 font-normal">
                    Avance Café
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-subtle">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsOpenModalOpen(false)}
                className="font-bold py-3 text-xs rounded-none"
              >
                Annuler
              </Button>
              <Button
                variant="success"
                type="submit"
                className="font-bold py-3 text-xs shadow-md rounded-none"
              >
                Valider &amp; Ouvrir
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ── MODALE APPORT / DÉPENSE ── */}
      <Modal
        isOpen={isAdjModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
      >
        <form
          onSubmit={handleAddTransaction}
          className="p-8 bg-surface rounded-none"
        >
          <h3 className="text-lg font-serif font-bold text-brand mb-6 uppercase tracking-wider text-center border-b border-subtle pb-4">
            {adjType === "in"
              ? "Enregistrer un Apport d'Espèces (+)"
              : "Enregistrer une Sortie de Caisse (-)"}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-t-muted mb-2">
                Pôle Concerné *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjDepartment("coiffure")}
                  className={`py-3 text-xs font-bold uppercase border rounded-none ${
                    adjDepartment === "coiffure"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-main text-t-muted border-subtle"
                  }`}
                >
                  💈 Salon de Coiffure
                </button>
                <button
                  type="button"
                  onClick={() => setAdjDepartment("cafe")}
                  className={`py-3 text-xs font-bold uppercase border rounded-none ${
                    adjDepartment === "cafe"
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-main text-t-muted border-subtle"
                  }`}
                >
                  ☕ Espace Cafétéria
                </button>
              </div>
            </div>

            <Input
              label="Montant (DZD) *"
              type="number"
              step="50"
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
                  ? "Ex: Rajout monnaie de 200 DA"
                  : "Ex: Achat Lait, Sonelgaz, Réparation"
              }
            />

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-subtle">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="font-bold py-3 text-xs rounded-none"
              >
                Annuler
              </Button>
              <Button
                variant={adjType === "in" ? "success" : "danger"}
                type="submit"
                className="font-bold py-3 text-xs shadow-md rounded-none"
              >
                Confirmer
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ── MODALE CLÔTURE ── */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
      >
        <form
          onSubmit={handleCheckBeforeClose}
          className="p-8 bg-surface border-t-4 border-red-500 rounded-none"
        >
          <h3 className="text-lg font-serif font-bold text-red-500 mb-2 uppercase tracking-wider text-center">
            Clôture de Caisse (Comptage Réel)
          </h3>
          <p className="text-[10px] text-t-muted font-bold uppercase tracking-widest text-center border-b border-subtle pb-4 mb-6">
            Comptez les billets et pièces dans le tiroir
          </p>

          <div className="space-y-6">
            <Input
              label="Espèces Réellement Comptées dans le Tiroir (DZD) *"
              type="number"
              step="50"
              value={reportedCash}
              onChange={(e) => setReportedCash(e.target.value)}
              required
              placeholder="Saisissez le total physique compté"
              autoFocus
            />

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-subtle">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsCloseModalOpen(false)}
                className="font-bold py-3 text-xs rounded-none"
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                type="submit"
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 text-xs rounded-none shadow-md"
              >
                Valider &amp; Clôturer
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Confirmation Écart */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => executeCloseTill(parseFloat(reportedCash))}
        title="ÉCART DE CAISSE DÉTECTÉ"
        message={confirmMessage}
        confirmText="Confirmer la Clôture"
        cancelText="Recompter"
        isDanger={true}
      />

      <ThermalReceipt
        type="z-report"
        data={printData}
        printTrigger={printTrigger}
      />
    </div>
  );
}
