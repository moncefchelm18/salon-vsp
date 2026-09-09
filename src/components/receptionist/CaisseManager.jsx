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
  Search,
  X, // <-- AJOUT DE CES 3 ICÔNES
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

import Button from "../common/Button";
import DataTable from "../common/DataTable";
import Modal from "../common/Modal";
import Input from "../common/Input";
import ConfirmModal from "../common/ConfirmModal"; // <-- AJOUT DE L'IMPORT

import ThermalReceipt from "../common/ThermalReceipt";

export default function CaisseManager() {
  const { user } = useAuth();
  const [currentTill, setCurrentTill] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal d'ouverture
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [startingCash, setStartingCash] = useState("");

  // Modal d'ajustement (Entrée/Sortie)
  const [isAdjModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjType, setAdjType] = useState("out"); // "in" ou "out"
  const [adjAmount, setAdjAmount] = useState("");
  const [adjMotif, setAdjMotif] = useState("");

  // Modal de Clôture
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [reportedCash, setReportedCash] = useState("");
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [tillToAudit, setTillToAudit] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");

  // --- PRINT STATES ---
  const [printData, setPrintData] = useState(null);
  const [printTrigger, setPrintTrigger] = useState(0);

  const [pendingPayouts, setPendingPayouts] = useState([]);

  const loadData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true); // Afficher le spinner UNIQUEMENT au premier chargement

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
      // On n'affiche le toast d'erreur que si c'est le chargement initial pour éviter de polluer l'écran
      if (isInitial) toast.error("Erreur de synchronisation caisse");
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true); // 1. Premier chargement visible avec spinner

    // 2. Synchronisation silencieuse toutes les 5 secondes (isInitial = false)
    // L'écran reste 100% immobile et stable, les chiffres se mettent à jour en douceur !
    const interval = setInterval(() => {
      loadData(false);
    }, 5000);

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
  // --- APPROUVER LE RETRAIT (DONNER L'ARGENT PHYSIQUE) ---
  const handleApprovePayout = async (payout) => {
    if (
      !window.confirm(
        `Donner DZD ${payout.amount.toFixed(2)} en espèces à ${payout.barber?.name} ? Cette somme sera déduite du tiroir-caisse.`,
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
      loadData(); // Actualise immédiatement le solde du tiroir et retire la carte !
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Erreur lors de l'approbation.",
      );
    }
  };

  // --- REJETER LA DEMANDE DU COIFFEUR ---
  const handleRejectPayout = async (payout) => {
    if (!window.confirm(`Rejeter la demande de ${payout.barber?.name} ?`))
      return;

    try {
      await api.patch(`/barbers/payouts/${payout.id}/reject`, {
        processedBy: user?.username || "Réception",
      });
      toast.success("Demande de retrait refusée.");
      loadData();
    } catch (err) {
      toast.error("Erreur lors du rejet.");
    }
  };
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!adjAmount || parseFloat(adjAmount) <= 0)
      return toast.error("Montant invalide");
    if (!adjMotif.trim()) return toast.error("Le motif est obligatoire");

    try {
      await api.post("/caisse/transaction", {
        amount: parseFloat(adjAmount),
        type: adjType,
        motif: adjMotif,
      });
      toast.success(
        adjType === "in" ? "Apport enregistré" : "Dépense enregistrée",
      );
      setIsAdjustmentModalOpen(false);
      setAdjAmount("");
      setAdjMotif("");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur de caisse");
    }
  };

  // 1. VÉRIFICATION AVANT CLÔTURE
  const handleCheckBeforeClose = (e) => {
    e.preventDefault();
    if (!reportedCash || parseFloat(reportedCash) < 0)
      return toast.error("Montant saisi invalide");

    const parsedReported = parseFloat(reportedCash);
    const differencePrevue = parsedReported - currentTill.expectedCash;

    // Si l'écart dépasse 2000 DZD, on ouvre la modale de confirmation
    if (Math.abs(differencePrevue) > 2000) {
      setConfirmMessage(
        `Vous êtes sur le point de déclarer ${parsedReported} DA en caisse.\n` +
          `Cela génère un écart énorme de ${differencePrevue.toFixed(2)} DA !\n\n` +
          `Êtes-vous sûr de ne pas avoir fait une erreur de frappe ?`,
      );
      setIsConfirmModalOpen(true); // <-- Ouvre la modale d'alerte par-dessus !
    } else {
      // Si l'écart est normal (< 2000), on clôture directement
      executeCloseTill(parsedReported);
    }
  };

  // 2. EXÉCUTION RÉELLE DE LA CLÔTURE (Appelée directement ou après confirmation)
  const executeCloseTill = async (finalReportedCash) => {
    try {
      const res = await api.post("/caisse/close", {
        reportedCash: finalReportedCash,
        username: user?.username,
      });

      const closedTill = res.data;
      const diff = closedTill.difference;

      if (diff === 0) {
        toast.success("Caisse parfaite ! Aucun écart.");
      } else if (diff < 0) {
        toast.error(
          `Caisse fermée avec un DÉFICIT de DZD ${Math.abs(diff).toFixed(2)}`,
          { duration: 5000 },
        );
      } else {
        toast.success(
          `Caisse fermée avec un EXCÉDENT de DZD ${diff.toFixed(2)}`,
          { duration: 5000 },
        );
      }

      // Impression Z-Report
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
        // ÉCRAN CAISSE FERMÉE
        <div className="bg-surface border border-red-500/20 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-red-500 animate-bounce" />
          <h2 className="text-2xl font-serif font-bold text-t-main uppercase tracking-widest">
            Le Tiroir-Caisse est Fermé
          </h2>
          <p className="text-t-muted text-sm max-w-md">
            Vous devez ouvrir la caisse et enregistrer le fond de caisse du
            matin avant de pouvoir enregistrer des ventes ou des dépenses.
          </p>
          <Button
            variant="success"
            onClick={() => {
              setStartingCash("");
              setIsOpenModalOpen(true);
            }}
            className="py-4 px-8 mt-4 font-bold"
          >
            <Key size={16} className="mr-2" /> Ouvrir la Caisse du Jour
          </Button>
        </div>
      ) : (
        // ÉCRAN CAISSE OUVERTE
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PANNEAU DE CONTRÔLE DE CAISSE */}
          <div className="bg-surface border border-brand/30 p-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">
                  Caisse Ouverte
                </span>
              </div>
              <h3 className="text-xl font-serif font-bold text-t-main uppercase tracking-widest">
                Caisse en cours
              </h3>
              <p className="text-xs text-t-muted font-mono mt-1 font-bold">
                Ouvert par {currentTill.openedBy} le{" "}
                {new Date(currentTill.openedAt).toLocaleDateString()}
              </p>
            </div>

            {/* SECTION MONTRANT LE FOND ET LE SOLDE (AVEC ÉCRAN LED PHYSIQUE) */}
            <div className="bg-main border border-subtle p-4 space-y-4 shadow-inner">
              <div className="flex justify-between text-xs uppercase text-t-muted items-center">
                <span className="font-bold">Fond de Caisse Initial :</span>
                <span className="font-mono font-bold text-t-main">
                  DZD {currentTill.startingCash.toFixed(2)}
                </span>
              </div>

              {/* --- ÉCRAN LED DE TRÉSORERIE --- */}
              <div className="bg-black p-4 border-2 border-slate-800 rounded-sm flex flex-col gap-1 shadow-inner">
                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                  Solde Théorique Attendu
                </span>
                <span className="text-3xl font-mono font-black text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.4)] tracking-wider text-right">
                  DZD {currentTill.expectedCash.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="success"
                  onClick={() => {
                    setAdjType("in");
                    setIsAdjustmentModalOpen(true);
                  }}
                  className="flex-1 py-4 text-xs font-bold"
                >
                  <Plus size={14} /> Apport (Entrée)
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setAdjType("out");
                    setIsAdjustmentModalOpen(true);
                  }}
                  className="flex-1 py-4 text-xs font-bold"
                >
                  <Minus size={14} /> Dépense (Sortie)
                </Button>
              </div>
              <Button
                variant="primary"
                onClick={() => setIsCloseModalOpen(true)}
                className="w-full py-4 text-xs font-bold tracking-widest shadow-lg shadow-brand/20"
              >
                Clôturer la Caisse
              </Button>
            </div>
          </div>

          {/* HISTORIQUE DES MOUVEMENTS DE LA SESSION EN COURS */}
          <div className="lg:col-span-2 bg-surface border border-subtle p-6 flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-widest text-t-muted border-b border-subtle pb-3 mb-4">
              Journal des transactions du jour (
              {currentTill.transactions.length})
            </h3>
            <div className="flex-1 h-0 overflow-y-auto space-y-2 pr-2 max-h-[340px]">
              {currentTill.transactions.length === 0 ? (
                <p className="text-center text-t-muted text-xs py-8 uppercase tracking-widest font-bold">
                  Aucune transaction enregistrée.
                </p>
              ) : (
                currentTill.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center p-3 bg-main border border-subtle shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-t-main text-xs uppercase truncate max-w-[300px]">
                        {tx.motif}
                      </p>
                      <p className="text-[10px] text-t-muted font-mono mt-1">
                        {new Date(tx.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {/* Montant sous forme de Badge coloré bien distinct */}
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

      {/* ═══════════════════════════════════════════════════════
          PANNEAU D'APPROBATION DES RETRAITS COIFFEURS (EN DIRECT)
      ═══════════════════════════════════════════════════════ */}
      {pendingPayouts.length > 0 && currentTill && (
        <div className="bg-surface border-2 border-amber-500 shadow-xl p-6 relative overflow-hidden animate-in fade-in duration-300">
          <div className="absolute top-0 left-0 w-2 h-full bg-amber-500 animate-pulse"></div>

          <div className="flex justify-between items-center mb-4 border-b border-subtle pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2">
                <Banknote size={18} /> Demandes de Rémunération en Attente (
                {pendingPayouts.length})
              </h3>
              <p className="text-xs text-t-muted font-bold mt-1">
                Les coiffeurs réclament leurs commissions. Donnez les billets
                physiquement avant de valider.
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
                    <p className="font-bold text-t-main text-base uppercase">
                      {p.barber?.name}
                    </p>
                    <p className="text-[10px] text-t-muted font-mono mt-0.5">
                      Demandé à{" "}
                      {new Date(p.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className="text-xl font-mono font-black text-amber-500">
                    DZD {p.amount.toFixed(2)}
                  </span>
                </div>

                {/* Boutons d'action solides */}
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    onClick={() => handleRejectPayout(p)}
                    className="py-2.5 px-3 text-xs flex-1"
                  >
                    <X size={14} className="mr-1" /> Rejeter
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => handleApprovePayout(p)}
                    className="py-2.5 px-4 text-xs font-bold flex-1 shadow-md"
                  >
                    <Check size={14} className="mr-1" /> Donner l'argent
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. HISTORIQUE DES ANCIENNES FERMETURES */}
      <div className="bg-surface border border-subtle">
        <div className="p-6 border-b border-subtle">
          <h3 className="text-lg font-serif font-bold text-brand uppercase tracking-widest">
            Historique des Clôtures de Caisse
          </h3>
        </div>
        <DataTable
          headers={[
            { label: "Clôturé le" },
            { label: "Fond de Caisse" },
            { label: "Théorique" },
            { label: "Compté (Réel)" },
            { label: "Écart de Caisse", align: "right" },
            { label: "Audit", align: "right" }, // <-- AJOUT DE LA COLONNE AUDIT
          ]}
        >
          {history.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center py-8 text-t-muted">
                Aucun historique disponible.
              </td>
            </tr>
          ) : (
            history.map((h) => (
              <tr
                key={h.id}
                className="border-b border-subtle hover:bg-brand/5"
              >
                <td className="px-6 py-4 text-xs font-mono text-t-muted">
                  {new Date(h.closedAt).toLocaleDateString("fr-FR")} à{" "}
                  {new Date(h.closedAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  <span className="block text-[10px] mt-1 font-bold text-t-muted">
                    Par: {h.closedBy}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-t-main font-semibold">
                  DZD {h.startingCash.toFixed(2)}
                </td>
                <td className="px-6 py-4 font-mono text-t-main font-semibold">
                  DZD {h.expectedCash.toFixed(2)}
                </td>
                <td className="px-6 py-4 font-mono font-bold text-t-main">
                  DZD {h.reportedCash.toFixed(2)}
                </td>
                {/* GAPS (ÉCARTS) TRADUITS EN BADGES SOLIDES SÉCURISÉS */}
                <td className="px-6 py-4 text-right">
                  {h.difference === 0 ? (
                    <span className="inline-block px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 font-bold text-xs uppercase shadow-sm">
                      Parfaite
                    </span>
                  ) : h.difference < 0 ? (
                    <span className="inline-block px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 font-mono font-bold text-xs shadow-sm">
                      Déficit: -DZD {Math.abs(h.difference).toFixed(2)}
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 font-mono font-bold text-xs shadow-sm">
                      Excédent: +DZD {h.difference.toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setTillToAudit(h);
                      setIsAuditModalOpen(true);
                    }}
                    className="py-1 px-3 text-xs bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white transition-colors"
                    title="Voir toutes les transactions de cette caisse"
                  >
                    <Eye size={16} className="mr-1" /> Audit
                  </Button>
                </td>
              </tr>
            ))
          )}
        </DataTable>
      </div>

      {/* --- MODAL 1 : OUVERTURE DE CAISSE --- */}
      <Modal isOpen={isOpenModalOpen} onClose={() => setIsOpenModalOpen(false)}>
        <form onSubmit={handleOpenTill} className="p-8">
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
                className="font-bold py-4"
              >
                Annuler
              </Button>
              <Button
                variant="success"
                type="submit"
                className="font-bold py-4"
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
        <form onSubmit={handleAddTransaction} className="p-8">
          <h3 className="text-xl font-serif font-bold text-brand mb-6 uppercase tracking-wider text-center border-b border-subtle pb-4">
            {adjType === "in"
              ? "Enregistrer un Apport d'espèces"
              : "Enregistrer une Sortie de Caisse"}
          </h3>
          <div className="space-y-4">
            <Input
              label="Montant d'espèces (DZD)"
              type="number"
              step="0.01"
              value={adjAmount}
              onChange={(e) => setAdjAmount(e.target.value)}
              required
              placeholder="Saisir le montant"
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
                  : "ex: Achat Lessive / Eau machine"
              }
            />
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-subtle">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="font-bold py-4"
              >
                Annuler
              </Button>
              <Button
                variant={adjType === "in" ? "success" : "danger"}
                type="submit"
                className="font-bold py-4"
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
          onSubmit={handleCheckBeforeClose} // <-- DOIT ÊTRE CECI !
          className="p-8 border-t-4 border-red-500"
        >
          <h3 className="text-xl font-serif font-bold text-red-500 mb-2 uppercase tracking-wider text-center">
            Clôture de Caisse Finale
          </h3>
          <p className="text-xs text-t-muted font-bold uppercase tracking-widest text-center border-b border-subtle pb-4 mb-6">
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
                className="font-bold py-4"
              >
                Retour
              </Button>
              <Button
                variant="danger"
                type="submit" // <-- DOIT ÊTRE "submit" !
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-none shadow-lg shadow-red-500/20"
              >
                Valider la Clôture
              </Button>
            </div>
          </div>
        </form>
      </Modal>
      {/* ═══════════════════════════════════════════════════════
          MODAL 4 : AUDIT D'UNE ANCIENNE CAISSE (POUR LE PATRON)
      ═══════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      >
        {tillToAudit && (
          <div className="flex flex-col bg-slate-950 max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-5 border-b-4 border-slate-800 shrink-0 bg-slate-900">
              <h3 className="text-lg font-serif font-bold text-t-main uppercase tracking-widest flex items-center gap-2">
                <Search size={20} className="text-brand" /> Audit de Caisse
              </h3>
              <p className="text-xs text-t-muted font-mono mt-1 font-bold">
                Clôturée par {tillToAudit.closedBy} le{" "}
                {new Date(tillToAudit.closedAt).toLocaleString("fr-FR")}
              </p>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Synthèse des montants */}
              <div className="bg-main border border-subtle p-4 shadow-inner grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-t-muted">
                    Fond de Caisse
                  </span>
                  <p className="text-sm font-mono font-bold text-t-main">
                    DZD {tillToAudit.startingCash.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-t-muted">
                    Solde Théorique
                  </span>
                  <p className="text-sm font-mono font-bold text-t-main">
                    DZD {tillToAudit.expectedCash.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand">
                    Compté par le caissier
                  </span>
                  <p className="text-lg font-mono font-bold text-brand">
                    DZD {tillToAudit.reportedCash.toFixed(2)}
                  </p>
                </div>
                <div className="bg-surface p-2 border border-subtle">
                  <span className="text-[10px] uppercase font-bold text-t-muted">
                    Écart de Caisse
                  </span>
                  <p
                    className={`text-lg font-mono font-bold ${tillToAudit.difference === 0 ? "text-green-500" : tillToAudit.difference < 0 ? "text-red-500" : "text-amber-500"}`}
                  >
                    {tillToAudit.difference === 0
                      ? "Parfait (0.00)"
                      : `${tillToAudit.difference > 0 ? "+" : ""}${tillToAudit.difference.toFixed(2)}`}
                  </p>
                </div>
              </div>

              {/* Liste des transactions du jour audité */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-t-muted border-b border-subtle pb-2 mb-3">
                  Détail des transactions ({tillToAudit.transactions.length})
                </h4>
                <div className="space-y-2">
                  {tillToAudit.transactions.length === 0 ? (
                    <p className="text-center text-t-muted text-xs py-4 uppercase font-bold tracking-widest bg-main border border-dashed border-subtle">
                      Aucun mouvement
                    </p>
                  ) : (
                    tillToAudit.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex justify-between items-center p-3 bg-main border border-subtle shadow-sm hover:border-brand/50 transition-colors"
                      >
                        <div>
                          <p className="font-bold text-t-main text-xs uppercase max-w-[280px] leading-tight">
                            {tx.motif}
                          </p>
                          <p className="text-[9px] text-t-muted font-mono mt-1">
                            {new Date(tx.createdAt).toLocaleTimeString(
                              "fr-FR",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                        <p
                          className={`font-mono font-bold text-xs px-2 py-1 border ${
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

            {/* Footer */}
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
      {/* --- NOTRE BELLE MODALE DE CONFIRMATION (REMPLACE WINDOW.CONFIRM) --- */}
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
      <ThermalReceipt
        type="z-report"
        data={printData}
        printTrigger={printTrigger}
      />
    </div>
  );
}
