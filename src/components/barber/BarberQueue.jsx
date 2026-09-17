import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle,
  Clock,
  Play,
  UserCircle,
  Scissors,
  DollarSign,
  Wallet,
  Banknote,
  Crown,
  PauseCircle,
  History,
  TrendingUp,
  X,
  Search,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

import Button from "../common/Button";
import Modal from "../common/Modal";
import Input from "../common/Input";

export default function BarberQueue({ barberId, barberName }) {
  const [activeTab, setActiveTab] = useState("workspace"); // 'workspace' ou 'stats'

  // Workspace States
  const [tickets, setTickets] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [isBarberVip, setIsBarberVip] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal Fin de Coupe
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceSearch, setServiceSearch] = useState("");

  // Stats & Wallet
  const [statsPeriod, setStatsPeriod] = useState("today");
  const [statsData, setStatsData] = useState({
    summary: { totalRevenue: 0, totalTips: 0, totalClients: 0 },
    history: [],
  });
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  const [balanceData, setBalanceData] = useState({
    isOwner: false,
    commissionRate: 50,
    currentBalance: 0,
    availableToRequest: 0,
    totalEarned: 0,
    totalRetrieved: 0,
    payoutHistory: [],
    pendingRequests: [],
  });

  // Modale Portefeuille compacte
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");

  // 1. CHARGEMENT FILE EN DIRECT
  const loadWorkspace = async () => {
    try {
      const resTickets = await api.get("/tickets/live");
      const myTickets = resTickets.data
        .filter((t) => t.barberId === barberId)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setTickets(myTickets);
      setIsLoading(false);
    } catch (err) {
      console.error("Erreur sync poste:", err);
    }
  };

  useEffect(() => {
    loadWorkspace();

    Promise.all([
      api.get("/services"),
      api.get(`/barbers/${barberId}`),
      api.get("/postes"),
    ]).then(([srvRes, barberRes, postesRes]) => {
      setAvailableServices(srvRes.data);
      const currentBarber = barberRes.data;
      if (currentBarber?.poste) {
        const myPoste = postesRes.data.find(
          (p) => p.number === currentBarber.poste,
        );
        setIsBarberVip(Boolean(myPoste?.isVip));
      }
    });

    const interval = setInterval(loadWorkspace, 5000);
    return () => clearInterval(interval);
  }, [barberId]);

  // 2. CHARGEMENT DES STATS ET DU SOLDE
  const fetchMyStats = async () => {
    setIsStatsLoading(true);
    try {
      const [statsRes, balanceRes] = await Promise.all([
        api.get(`/reports/barber/${barberId}?period=${statsPeriod}`),
        api.get(`/barbers/${barberId}/balance`),
      ]);
      setStatsData(statsRes.data);
      setBalanceData(balanceRes.data);
    } catch (error) {
      toast.error("Impossible de charger les statistiques.");
    } finally {
      setIsStatsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "stats") {
      fetchMyStats();
    }
  }, [activeTab, statsPeriod]);

  // Variables calculées
  const currentTicket = tickets.find((t) => t.status === "in-progress");
  const pendingTickets = tickets.filter((t) => t.status === "waiting");

  // RÈGLE PATRON : 0% si isOwner, sinon taux réel
  const isOwner = Boolean(balanceData.isOwner);
  const myRate = isOwner ? 0 : (balanceData.commissionRate || 50) / 100;
  const myPeriodRevenue = Number(statsData.summary.totalRevenue || 0);
  const myPeriodTips = Number(statsData.summary.totalTips || 0);
  const myPeriodGain = isOwner ? 0 : myPeriodRevenue * myRate + myPeriodTips;

  // 3. ACTIONS WORKSPACE
  const handleStartService = async (ticketId) => {
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status: "in-progress" });
      loadWorkspace();
    } catch (error) {
      toast.error("Erreur serveur.");
    }
  };

  const handlePauseService = async (ticketId) => {
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status: "waiting" });
      toast.success("Client replacé en attente.");
      loadWorkspace();
    } catch (error) {
      toast.error("Erreur serveur.");
    }
  };

  const openCompletionModal = (ticketId) => {
    setSelectedTicketId(ticketId);
    setSelectedService(null);
    setServiceSearch("");
    setShowServiceModal(true);
  };

  const handleCompleteService = async () => {
    if (!selectedTicketId || !selectedService) {
      return toast.error("Veuillez sélectionner la prestation réalisée.");
    }

    setIsProcessing(true);
    try {
      let finalName = selectedService.name;
      let finalPrice = Number(selectedService.price);

      if (currentTicket && currentTicket.isReservation) {
        finalPrice = finalPrice * 1.5;
        finalName = `${selectedService.name} (Tarif RDV VIP)`;
      }

      await api.patch(`/tickets/${selectedTicketId}/finish`, {
        serviceName: finalName,
        totalPrice: finalPrice,
      });

      toast.success("Prestation transmise en caisse !");
      setShowServiceModal(false);
      setSelectedTicketId(null);
      setSelectedService(null);
      loadWorkspace();
    } catch (err) {
      toast.error("Échec de transmission.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    if (isOwner) {
      return toast.error(
        "Le propriétaire perçoit les bénéfices directement via le Bilan.",
      );
    }

    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) return toast.error("Montant invalide.");

    const available =
      balanceData.availableToRequest ?? balanceData.currentBalance;
    if (amount > available) {
      return toast.error(
        `Fonds insuffisants. Disponible : ${available.toFixed(2)} DZD`,
      );
    }

    setIsProcessing(true);
    try {
      await api.post(`/barbers/${barberId}/payout-request`, { amount });
      toast.success(`Demande de ${amount} DZD transmise à la réception !`);
      setIsPayoutModalOpen(false);
      setPayoutAmount("");
      fetchMyStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur de demande.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3 max-w-full overflow-hidden select-none">
      {/* ── ONGLETS HAUTS COMPACTS ── */}
      <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-none gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("workspace")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all rounded-none ${
            activeTab === "workspace"
              ? "bg-amber-500 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-slate-100"
          }`}
        >
          <Scissors size={14} /> Fauteuil &amp; File ({pendingTickets.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("stats")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all rounded-none ${
            activeTab === "stats"
              ? "bg-amber-500 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-slate-100"
          }`}
        >
          <TrendingUp size={14} /> Mes Résultats &amp; Historique
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          VUE 1 : WORKSPACE (FAUTEUIL + ATTENTE CÔTE-À-CÔTE SUR TABLETTE)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "workspace" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
          {/* COLONNE GAUCHE : FAUTEUIL EN COURS */}
          <div className="bg-slate-900 border border-slate-800 p-4 relative overflow-hidden rounded-none shadow-md">
            <div
              className={`absolute top-0 left-0 w-1.5 h-full ${
                currentTicket ? "bg-amber-500" : "bg-slate-700"
              }`}
            />

            <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3 pl-2">
              <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                <UserCircle
                  size={14}
                  className={currentTicket ? "animate-pulse" : ""}
                />
                Actuellement en Fauteuil
              </span>
              {currentTicket && (
                <span className="font-mono text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5">
                  #{currentTicket.queueNumber || currentTicket.id}
                </span>
              )}
            </div>

            {currentTicket ? (
              <div className="pl-2 space-y-4">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">
                    Client à servir
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-slate-100 uppercase truncate">
                    {currentTicket.clientName}
                  </p>
                  {currentTicket.isReservation && (
                    <span className="inline-block mt-1 bg-amber-500 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5">
                      ⭐ Rendez-vous VIP (+50%)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <Button
                    variant="outline"
                    onClick={() => handlePauseService(currentTicket.id)}
                    className="py-3 text-[10px] border-slate-700 text-slate-400 rounded-none"
                  >
                    <PauseCircle size={12} className="mr-1" /> En Pause
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => openCompletionModal(currentTicket.id)}
                    className="py-3 text-xs font-bold rounded-none shadow-md flex items-center justify-center gap-1"
                  >
                    <CheckCircle size={14} /> Valider Coupe
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-slate-600 uppercase font-bold text-xs">
                Fauteuil Libre
              </div>
            )}
          </div>

          {/* COLONNE DROITE : SALLE D'ATTENTE COMPACTE */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-none shadow-md flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Clock size={13} /> Clients en Attente
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {pendingTickets.length} client(s)
              </span>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {pendingTickets.length === 0 ? (
                <div className="py-10 text-center text-slate-600 uppercase font-bold text-[10px]">
                  Aucun client en attente
                </div>
              ) : (
                pendingTickets.map((t) => (
                  <div
                    key={t.id}
                    className="bg-slate-950 border border-slate-800 p-2.5 flex justify-between items-center hover:border-amber-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono font-bold text-amber-400 text-sm w-7 text-center bg-slate-900 border border-slate-800 py-1">
                        #{t.queueNumber || t.id}
                      </span>
                      <div className="min-w-0 truncate">
                        <p className="font-bold text-slate-100 text-xs uppercase truncate">
                          {t.clientName}
                        </p>
                        <p className="text-[9px] text-slate-500 font-mono">
                          Arrivé à {t.time}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      onClick={() => handleStartService(t.id)}
                      disabled={currentTicket != null}
                      className="py-1.5 px-3 text-[10px] rounded-none disabled:opacity-30 shrink-0"
                    >
                      <Play size={10} className="mr-1" /> Installer
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          VUE 2 : RÉSULTATS & PORTEFEUILLE (ZERO FAUTE PROPRIÉTAIRE)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "stats" && (
        <div className="space-y-3">
          {/* Header Période Rapide */}
          <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-none">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Période :
            </span>
            <div className="flex bg-slate-950 border border-slate-800 p-0.5">
              {["today", "week", "month"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setStatsPeriod(p)}
                  className={`px-3 py-1 text-[9px] font-bold uppercase rounded-none transition-all ${
                    statsPeriod === p
                      ? "bg-amber-500 text-slate-950"
                      : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  {p === "today"
                    ? "Aujourd'hui"
                    : p === "week"
                      ? "7 Jours"
                      : "Ce Mois"}
                </button>
              ))}
            </div>
          </div>

          {/* KPI CARDS COMPACTES SUR PETITS ÉCRANS */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {/* 1. CA RÉALISÉ */}
            <div className="bg-slate-900 border border-slate-800 p-3">
              <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">
                CA Réalisé
              </span>
              <p className="text-lg sm:text-xl font-mono font-bold text-amber-400">
                {isStatsLoading ? "..." : `DZD ${myPeriodRevenue.toFixed(2)}`}
              </p>
              <span className="text-[8px] text-slate-500 uppercase font-bold">
                {statsData.summary.totalClients} coupes validées
              </span>
            </div>

            {/* 2. GAIN RÉEL (0 DA SI PATRON) */}
            <div
              className={`border p-3 ${
                isOwner
                  ? "bg-blue-950/20 border-blue-500/30"
                  : "bg-green-950/20 border-green-500/30"
              }`}
            >
              <span className="text-[9px] uppercase font-bold block mb-0.5 text-slate-400">
                {isOwner
                  ? "Statut Associé"
                  : `Mon Gain (${balanceData.commissionRate}%)`}
              </span>
              <p
                className={`text-lg sm:text-xl font-mono font-bold ${
                  isOwner ? "text-blue-400" : "text-green-400"
                }`}
              >
                {isOwner
                  ? "100% SALON"
                  : isStatsLoading
                    ? "..."
                    : `DZD ${myPeriodGain.toFixed(2)}`}
              </p>
              <span className="text-[8px] text-slate-400 uppercase font-bold">
                {isOwner
                  ? "👑 Propriétaire du Salon"
                  : `+${myPeriodTips} DA Tips`}
              </span>
            </div>

            {/* 3. PORTEFEUILLE RAPIDE / BOUTON RETRAIT */}
            <div className="col-span-2 md:col-span-1 bg-slate-900 border border-slate-800 p-3 flex justify-between items-center">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">
                  Solde à Réclamer
                </span>
                <p className="text-base font-mono font-black text-[#00ff00]">
                  {isOwner
                    ? "0.00 DA"
                    : `DZD ${(balanceData.availableToRequest || 0).toFixed(2)}`}
                </p>
              </div>

              {!isOwner && (
                <Button
                  variant="success"
                  onClick={() => {
                    setPayoutAmount(
                      (balanceData.availableToRequest || 0).toString(),
                    );
                    setIsPayoutModalOpen(true);
                  }}
                  disabled={(balanceData.availableToRequest || 0) <= 0}
                  className="py-2 px-3 text-[10px] font-bold rounded-none"
                >
                  <Banknote size={12} className="mr-1" /> Retirer
                </Button>
              )}
            </div>
          </div>

          {/* TABLEAU CONDENSÉ POUR TABLETTE */}
          <div className="bg-slate-900 border border-slate-800 overflow-hidden rounded-none shadow-sm">
            <div className="p-3 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Historique des Coupes ({statsData.history.length})
              </span>
              {!isOwner && (
                <button
                  type="button"
                  onClick={() => setIsWalletModalOpen(true)}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold uppercase flex items-center gap-1"
                >
                  <History size={12} /> Voir Retraits Caisse
                </button>
              )}
            </div>

            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-500 uppercase text-[9px] font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Réf</th>
                    <th className="py-2.5 px-3">Client</th>
                    <th className="py-2.5 px-3">Prestation</th>
                    <th className="py-2.5 px-3 text-right">Tarif</th>
                    <th className="py-2.5 px-3 text-right">Ma Part</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {statsData.history.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-8 text-center text-slate-600 text-[10px] uppercase"
                      >
                        Aucune coupe enregistrée
                      </td>
                    </tr>
                  ) : (
                    statsData.history.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2 px-3 text-slate-500 font-bold">
                          #{t.id}
                        </td>
                        <td className="py-2 px-3 text-slate-200 uppercase truncate max-w-[120px]">
                          {t.client}
                        </td>
                        <td className="py-2 px-3 text-slate-300 truncate max-w-[140px]">
                          {t.service}
                        </td>
                        <td className="py-2 px-3 text-right text-amber-400 font-bold">
                          {Number(t.price).toFixed(0)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold">
                          {isOwner ? (
                            <span className="text-blue-400 text-[9px]">
                              100% Salon
                            </span>
                          ) : (
                            <span className="text-green-400">
                              {(
                                Math.max(
                                  0,
                                  Number(t.originalPrice ?? t.price),
                                ) *
                                  myRate +
                                Number(t.tip || 0)
                              ).toFixed(0)}{" "}
                              DA
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALE FIN DE COUPE (COMPACTE & RECHERCHE RAPIDE) ── */}
      <Modal
        isOpen={showServiceModal}
        onClose={() => !isProcessing && setShowServiceModal(false)}
      >
        <div className="p-5 bg-slate-950 w-full max-h-[85vh] overflow-y-auto rounded-none">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Valider la Prestation
            </h3>
            <span className="text-xs font-mono font-bold text-slate-300">
              {currentTicket?.clientName}
            </span>
          </div>

          <div className="relative mb-3">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="Recherche coupe..."
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-amber-500 rounded-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1 mb-4">
            {availableServices
              .filter((s) =>
                s.name.toLowerCase().includes(serviceSearch.toLowerCase()),
              )
              .filter((s) => (s.isVipOnly ? isBarberVip : true))
              .map((service) => {
                const isSelected = selectedService?.id === service.id;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setSelectedService(service)}
                    className={`p-2.5 border text-left flex flex-col justify-between min-h-[60px] transition-all rounded-none ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/10 shadow-md"
                        : "border-slate-800 bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <p className="font-bold text-slate-200 uppercase text-xs truncate">
                      {service.name}
                    </p>
                    <p
                      className={`font-mono text-xs font-bold mt-1 ${isSelected ? "text-amber-400" : "text-slate-400"}`}
                    >
                      {Number(service.price).toFixed(2)} DA
                    </p>
                  </button>
                );
              })}
          </div>

          {currentTicket?.isReservation && selectedService && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-2 mb-3 text-[10px] text-amber-400 font-bold uppercase">
              ⭐ Majoration RDV VIP (+50%) :{" "}
              {(Number(selectedService.price) * 1.5).toFixed(2)} DA
            </div>
          )}

          <div className="flex justify-between items-center bg-slate-900 p-3 border border-slate-800 mb-4">
            <span className="text-[10px] uppercase font-bold text-slate-500">
              Montant Caisse :
            </span>
            <span className="text-xl font-mono font-black text-amber-400">
              DZD{" "}
              {selectedService
                ? (currentTicket?.isReservation
                    ? Number(selectedService.price) * 1.5
                    : Number(selectedService.price)
                  ).toFixed(2)
                : "0.00"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => setShowServiceModal(false)}
              className="py-2.5 text-xs font-bold rounded-none"
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleCompleteService}
              disabled={isProcessing || !selectedService}
              className="py-2.5 text-xs font-bold rounded-none shadow-md"
            >
              {isProcessing ? "..." : "Envoyer en Caisse"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── MODALE DEMANDE DE RETRAIT ── */}
      <Modal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
      >
        <form
          onSubmit={handleRequestPayout}
          className="p-6 bg-slate-950 border-t-4 border-amber-500 rounded-none"
        >
          <h3 className="text-sm font-serif font-bold text-amber-400 mb-4 uppercase tracking-wider text-center">
            Demande de Retrait d'Espèces
          </h3>

          <div className="space-y-4">
            <Input
              label="Montant (DZD) *"
              type="number"
              step="500"
              max={balanceData.availableToRequest}
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              required
              autoFocus
            />

            <div className="bg-slate-900 p-2.5 border border-slate-800 flex justify-between text-xs font-mono font-bold">
              <span className="text-slate-500 uppercase">Disponible :</span>
              <span className="text-green-400">
                DZD {(balanceData.availableToRequest || 0).toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsPayoutModalOpen(false)}
                className="py-2.5 text-xs font-bold rounded-none"
              >
                Annuler
              </Button>
              <Button
                variant="success"
                type="submit"
                disabled={isProcessing}
                className="py-2.5 text-xs font-bold rounded-none shadow-md"
              >
                {isProcessing ? "..." : "Transmettre"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ── MODALE HISTORIQUE DES RETRAITS (POUR NE PAS ENCOMBRER L'ÉCRAN) ── */}
      <Modal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      >
        <div className="p-5 bg-slate-950 max-h-[80vh] flex flex-col rounded-none">
          <h3 className="text-xs font-serif font-bold text-slate-200 uppercase tracking-widest border-b border-slate-800 pb-3 mb-3 flex items-center gap-1.5">
            <History size={14} className="text-amber-400" /> Historique de mes
            Retraits en Caisse
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {balanceData.payoutHistory.length === 0 ? (
              <p className="text-center text-slate-600 text-[10px] py-8 uppercase font-bold">
                Aucun retrait effectué
              </p>
            ) : (
              balanceData.payoutHistory.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-900 border border-slate-800 p-2.5 flex justify-between items-center text-xs font-mono"
                >
                  <div>
                    <span
                      className={`inline-block px-1.5 py-0.2 text-[8px] font-bold uppercase border rounded-none ${
                        p.status === "approved"
                          ? "bg-green-500/10 text-green-400 border-green-500/30"
                          : p.status === "pending"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-red-500/10 text-red-400 border-red-500/30"
                      }`}
                    >
                      {p.status === "approved"
                        ? "Payé"
                        : p.status === "pending"
                          ? "En attente"
                          : "Refusé"}
                    </span>
                    <p className="text-[9px] text-slate-500 mt-1">
                      {new Date(p.createdAt).toLocaleDateString("fr-FR")} à{" "}
                      {new Date(p.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className="font-bold text-slate-200">
                    DZD {p.amount.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 mt-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setIsWalletModalOpen(false)}
              className="py-2 text-xs font-bold rounded-none"
            >
              Fermer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
