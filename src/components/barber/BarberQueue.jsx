import { useState, useEffect } from "react";
import {
  CheckCircle,
  Clock,
  Play,
  UserCircle,
  BarChart2,
  Scissors,
  DollarSign,
  Wallet,
  Banknote,
  Crown,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

// Common UI Imports
import Button from "../common/Button";
import Modal from "../common/Modal";
import StatCard from "../common/StatCard";
import DataTable from "../common/DataTable";
import Input from "../common/Input";

export default function BarberQueue({ barberId, barberName }) {
  const [activeTab, setActiveTab] = useState("workspace"); // 'workspace' ou 'stats'
  const [statsSubTab, setStatsSubTab] = useState("services"); // 'services' ou 'payouts'

  // --- WORKSPACE STATES ---
  const [tickets, setTickets] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [postes, setPostes] = useState([]); // <-- AJOUTEZ CECI
  const [isBarberVip, setIsBarberVip] = useState(false); // <-- AJOUTEZ CECI
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceSearch, setServiceSearch] = useState("");

  // --- STATS STATES ---
  const [statsPeriod, setStatsPeriod] = useState("today");
  const [statsData, setStatsData] = useState({
    summary: { totalRevenue: 0, totalTips: 0, totalClients: 0 },
    history: [],
  });
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // --- PAYOUT (WALLET) STATES ---
  const [balanceData, setBalanceData] = useState({
    currentBalance: 0,
    totalEarned: 0,
    totalRetrieved: 0,
    payoutHistory: [],
    pendingRequests: [],
  });
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");

  // --- 1. CHARGEMENT DE LA FILE D'ATTENTE & DES PRESTATIONS ---
  const loadWorkspace = async () => {
    if (activeTab !== "workspace") return;
    try {
      const resTickets = await api.get("/tickets/live");
      const myTickets = resTickets.data
        .filter((t) => t.barberId === barberId)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Tri chronologique
      setTickets(myTickets);
      setIsLoading(false);
    } catch (err) {
      toast.error("Erreur de synchronisation du poste.");
    }
  };

  useEffect(() => {
    loadWorkspace();

    // ── CHARGE LES SERVICES, BARBIERS ET POSTES POUR VÉRIFIER LE STATUT VIP ──
    Promise.all([
      api.get("/services"),
      api.get(`/barbers/${barberId}`),
      api.get("/postes"),
    ]).then(([srvRes, barberRes, postesRes]) => {
      setAvailableServices(srvRes.data);
      setPostes(postesRes.data);

      const currentBarber = barberRes.data;
      if (currentBarber && currentBarber.poste) {
        // Le coiffeur a-t-il un poste VIP ?
        const myPoste = postesRes.data.find(
          (p) => p.number === currentBarber.poste,
        );
        setIsBarberVip(myPoste ? myPoste.isVip : false);
      } else {
        setIsBarberVip(false);
      }
    });

    const interval = setInterval(loadWorkspace, 5000);
    return () => clearInterval(interval);
  }, [barberId, activeTab]);

  // --- 2. STATS & SOLDE DU COIFFEUR ---
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

  const currentTicket = tickets.find((t) => t.status === "in-progress");
  const pendingTickets = tickets.filter((t) => t.status === "waiting");

  // ── CALCUL DYNAMIQUE DU TAUX COIFFEUR VS PROPRIÉTAIRE ──
  const isOwner = Boolean(balanceData.isOwner);
  // Si c'est le propriétaire, sa commission est forcée à 0% (100% au Salon)
  const myCommissionRate = isOwner
    ? 0
    : balanceData.commissionRate !== undefined
      ? balanceData.commissionRate
      : 50;
  const effectiveRate = myCommissionRate / 100;

  // Calcul du gain de la période (Revenu * Taux + Pourboires)
  const myPeriodRevenue = Number(statsData.summary.totalRevenue || 0);
  const myPeriodTips = Number(statsData.summary.totalTips || 0);
  const myPeriodGain = myPeriodRevenue * effectiveRate + myPeriodTips;

  // --- 3. ACTIONS DU FAUTEUIL ---
  const handleStartService = async (ticketId) => {
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status: "in-progress" });
      loadWorkspace();
    } catch (error) {
      toast.error("Erreur serveur.");
    }
  };

  const handleClientNoShow = async (ticketId, clientName) => {
    if (window.confirm(`Retirer ${clientName} de la liste ? (Client absent)`)) {
      try {
        await api.delete(`/tickets/${ticketId}`);
        toast.success(`Client ${clientName} retiré.`);
        loadWorkspace();
      } catch (err) {
        toast.error("Erreur d'annulation.");
      }
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

  // ── FINALISER LA COUPE (AVEC MAJORATION AUTOMATIQUE +50% SI RDV) ──
  const handleCompleteService = async () => {
    if (!selectedTicketId || !selectedService) {
      return toast.error("Veuillez sélectionner la prestation réalisée.");
    }

    setIsProcessing(true);
    try {
      let finalName = selectedService.name;
      let finalPrice = Number(selectedService.price);

      // MAGIE : Si le ticket actuel est une réservation, on applique +50% !
      if (currentTicket && currentTicket.isReservation) {
        finalPrice = finalPrice * 1.5; // +50%
        finalName = `${selectedService.name} (Tarif RDV VIP)`; // Mention pour le client sur le reçu
      }

      await api.patch(`/tickets/${selectedTicketId}/finish`, {
        serviceName: finalName,
        totalPrice: finalPrice,
        productCost: selectedService.hasProductDeduction
          ? Number(selectedService.productCost)
          : 0,
      });

      toast.success("Facture transmise à la caisse !");
      setShowServiceModal(false);
      setSelectedTicketId(null);
      setSelectedService(null);
      loadWorkspace();
    } catch (err) {
      toast.error("Échec de transmission de la facture.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
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

  if (isLoading && activeTab === "workspace") {
    return (
      <div className="p-10 text-center font-bold tracking-widest text-amber-500 uppercase animate-pulse text-xs">
        Synchronisation du poste...
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-full overflow-hidden">
      {/* ── ONGLETS DU TERMINAL BARBIER (PARFAITEMENT DÉGAGÉS DU HEADER) ── */}
      <div className="flex border-b border-slate-800 bg-slate-900/80 mb-6 mt-1 overflow-x-auto hide-scrollbar">
        {" "}
        <button
          onClick={() => setActiveTab("workspace")}
          className={`flex items-center gap-2 px-4 sm:px-6 py-3.5 text-xs font-bold tracking-wider uppercase transition-all ${
            activeTab === "workspace"
              ? "border-b-2 border-amber-500 text-amber-500 bg-slate-800/40"
              : "border-b-2 border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Scissors className="w-4 h-4" /> Fauteuil &amp; File
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`flex items-center gap-2 px-4 sm:px-6 py-3.5 text-xs font-bold tracking-wider uppercase transition-all ${
            activeTab === "stats"
              ? "border-b-2 border-amber-500 text-amber-500 bg-slate-800/40"
              : "border-b-2 border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <BarChart2 className="w-4 h-4" /> Espace Pro &amp; Rémunération
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          VUE 1 : FAUTEUIL ACTIF & SALLE D'ATTENTE
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "workspace" && (
        <div className="space-y-4">
          {/* FAUTEUIL ACTIF */}
          {currentTicket ? (
            <div className="bg-slate-950 border border-amber-500/50 p-4 sm:p-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
              <div className="flex items-center gap-2.5 mb-4 pl-3 border-b border-slate-800 pb-3">
                <UserCircle className="w-6 h-6 text-amber-500 animate-pulse" />
                <div>
                  <h2 className="text-base sm:text-lg font-serif font-bold text-amber-400 uppercase tracking-widest">
                    Actuellement en Fauteuil
                  </h2>
                  <p className="text-slate-500 text-[9px] uppercase font-bold font-mono">
                    Client N° #{currentTicket.queueNumber || currentTicket.id}
                  </p>
                </div>
              </div>

              <div className="pl-3 flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                  <p className="text-[10px] uppercase text-slate-500 tracking-widest font-bold">
                    Nom du Client
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-100 uppercase">
                    {currentTicket.clientName}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2.5">
                  <Button
                    variant="outline"
                    onClick={() => handlePauseService(currentTicket.id)}
                    className="py-3.5 px-4 font-bold text-xs border-slate-700 text-slate-400 hover:text-amber-500 w-full sm:w-auto"
                  >
                    Mettre en Attente
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => openCompletionModal(currentTicket.id)}
                    className="py-3.5 px-6 font-bold text-xs tracking-wider w-full sm:w-auto shadow-md"
                  >
                    <CheckCircle size={16} className="mr-1.5" /> Valider Coupe
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 p-6 text-center text-slate-500 uppercase tracking-widest text-xs font-bold">
              Fauteuil Actuellement Libre
            </div>
          )}

          {/* LISTE D'ATTENTE DE CE BARBIER */}
          <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6">
            <h2 className="text-sm font-serif font-bold text-slate-100 uppercase tracking-widest border-b border-slate-800 pb-3 mb-3">
              En attente pour vous ({pendingTickets.length})
            </h2>
            {pendingTickets.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center justify-center opacity-50">
                <Clock className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                  Aucun client en attente pour votre fauteuil
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-slate-950 border border-slate-800 p-3.5 hover:border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 bg-slate-900 border border-amber-500 text-amber-500 flex justify-center items-center font-mono font-bold text-lg shadow-sm">
                        {ticket.queueNumber || ticket.id}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                          {ticket.clientName}
                        </h3>
                        <p className="text-slate-500 text-[10px] uppercase font-mono">
                          Arrivé à : {ticket.time}
                        </p>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleClientNoShow(ticket.id, ticket.clientName)
                        }
                        disabled={currentTicket != null}
                        className="text-red-500 hover:text-red-400 text-[10px] py-2 px-3 flex-1 sm:flex-none"
                      >
                        Absent
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleStartService(ticket.id)}
                        disabled={currentTicket != null}
                        className={`text-[10px] py-2 px-4 flex-1 sm:flex-none ${
                          currentTicket
                            ? "opacity-30 border-slate-800 text-slate-700"
                            : "text-slate-200"
                        }`}
                      >
                        <Play size={12} className="mr-1.5" /> Prendre en charge
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          VUE 2 : ESPACE PRO & RÉMUNÉRATION (WALLET)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "stats" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-900 border border-slate-800 p-4 sm:p-5 gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-slate-100 uppercase tracking-widest">
                Mon Activité &amp; Gains
              </h2>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mt-0.5">
                Suivi de vos commissions et retraits
              </p>
            </div>
            <div className="flex bg-slate-950 p-1 border border-slate-800 w-full sm:w-auto">
              {["Today", "Week", "Month", "Year"].map((period) => (
                <Button
                  key={period}
                  variant={
                    statsPeriod === period.toLowerCase() ? "primary" : "ghost"
                  }
                  onClick={() => setStatsPeriod(period.toLowerCase())}
                  className="flex-1 sm:flex-none px-3 py-1.5 text-[10px] tracking-wider font-bold"
                >
                  {period === "Today"
                    ? "Aujourd'hui"
                    : period === "Week"
                      ? "Semaine"
                      : period === "Month"
                        ? "Mois"
                        : "Année"}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={DollarSign}
              label={`CA Généré (${statsPeriod.toUpperCase()})`}
              value={
                isStatsLoading
                  ? "..."
                  : `DZD ${Number(statsData.summary.totalRevenue || 0).toFixed(2)}`
              }
              colorClass="text-amber-500"
              highlight={true}
            />
            <StatCard
              icon={DollarSign}
              label={
                isOwner
                  ? "Mon Gain (Propriétaire - 100% Salon)"
                  : `Mon Gain Période (${myCommissionRate}% + Tips)`
              }
              value={isStatsLoading ? "..." : `DZD ${myPeriodGain.toFixed(2)}`}
              colorClass="text-green-400"
              highlight={true}
            />
            <StatCard
              icon={Scissors}
              label={`Clients (${statsPeriod.toUpperCase()})`}
              value={isStatsLoading ? "..." : statsData.summary.totalClients}
              colorClass="text-slate-100"
            />
          </div>

          {/* PORTEFEUILLE */}
          <div className="bg-slate-900 border-2 border-amber-500 p-4 sm:p-5 shadow-lg">
            <div className="flex justify-between items-center mb-3 border-b border-amber-500/30 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                <Wallet size={16} /> Mon Portefeuille Personnel
              </h3>
              {balanceData.pendingRequests?.length > 0 && (
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 font-bold text-[9px] uppercase animate-pulse">
                  Demande en cours
                </span>
              )}
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-stretch gap-4">
              <div className="flex flex-1 gap-3">
                <div className="flex-1 bg-slate-950 border border-slate-800 p-3 text-center">
                  <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-1">
                    Total Gagné
                  </p>
                  <p className="text-base sm:text-lg font-mono font-bold text-slate-200">
                    DZD {Number(balanceData.totalEarned || 0).toFixed(2)}
                  </p>
                </div>
                <div className="flex-1 bg-slate-950 border border-slate-800 p-3 text-center">
                  <p className="text-[9px] uppercase font-bold text-red-500 tracking-widest mb-1">
                    Déjà Récupéré
                  </p>
                  <p className="text-base sm:text-lg font-mono font-bold text-red-400">
                    - DZD {Number(balanceData.totalRetrieved || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex-1 bg-[#0a0a0a] border-2 border-slate-800 p-3 flex justify-between items-center shadow-inner">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest block">
                    Solde Disponible
                  </span>
                  <span className="text-[9px] text-slate-600 font-bold">
                    À réclamer en caisse
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-mono font-black text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.4)]">
                  DZD{" "}
                  {(
                    balanceData.availableToRequest ??
                    balanceData.currentBalance ??
                    0
                  ).toFixed(2)}
                </p>
              </div>

              <Button
                variant="success"
                onClick={() => {
                  const maxAvail =
                    balanceData.availableToRequest ??
                    balanceData.currentBalance ??
                    0;
                  setPayoutAmount(maxAvail.toString());
                  setIsPayoutModalOpen(true);
                }}
                disabled={
                  (balanceData.availableToRequest ??
                    balanceData.currentBalance ??
                    0) <= 0
                }
                className="py-4 px-6 font-bold text-xs tracking-widest uppercase shadow-md shrink-0"
              >
                <Banknote size={16} className="mr-2" /> Demander Retrait
              </Button>
            </div>
          </div>

          {/* ONGLETS DES TABLEAUX */}
          <div className="bg-slate-900 border border-slate-800 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-slate-800 flex gap-2 bg-slate-950/40">
              <button
                onClick={() => setStatsSubTab("services")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border ${
                  statsSubTab === "services"
                    ? "bg-amber-500 text-slate-950 border-amber-500 shadow-md"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                📋 Prestations Validées ({statsData.history.length})
              </button>
              <button
                onClick={() => setStatsSubTab("payouts")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border ${
                  statsSubTab === "payouts"
                    ? "bg-amber-500 text-slate-950 border-amber-500 shadow-md"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                🏦 Historique Retraits ({balanceData.payoutHistory.length})
              </button>
            </div>

            {statsSubTab === "services" ? (
              <DataTable
                headers={[
                  { label: "Ref" },
                  { label: "Client" },
                  { label: "Prestation" },
                  { label: "Tips", align: "right" },
                  { label: "Prix", align: "right" },
                  { label: "Ma Part", align: "right" },
                ]}
              >
                {isStatsLoading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-8 text-center animate-pulse text-amber-500 text-xs"
                    >
                      Chargement...
                    </td>
                  </tr>
                ) : statsData.history.length > 0 ? (
                  statsData.history.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-slate-800 hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-500 text-[10px]">
                        #{t.id}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-200 uppercase text-xs">
                        {t.client}
                      </td>
                      <td className="px-4 py-3 text-slate-300 italic text-xs">
                        {t.service}
                        {t.productCost > 0 && (
                          <span className="block text-[9px] text-amber-500 not-italic font-bold">
                            (Dose déduite : -{t.productCost} DA)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-green-400 text-xs">
                        {t.tip > 0 ? `+${Number(t.tip).toFixed(0)}` : "--"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-amber-400 text-xs">
                        {Number(t.price).toFixed(2)}
                      </td>

                      {/* ── C'EST CE DERNIER <td/> QU'IL FAUT REMPLACER ── */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-[#00ff00] text-sm">
                        {(
                          Math.max(
                            0,
                            Number(t.originalPrice ?? t.price) -
                              Number(t.productCost || 0),
                          ) *
                            effectiveRate +
                          Number(t.tip || 0)
                        ).toFixed(2)}{" "}
                        DA
                      </td>
                      {/* ──────────────────────────────────────────────── */}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-10 text-slate-600 font-bold uppercase text-[10px] tracking-widest"
                    >
                      Aucune coupe enregistrée.
                    </td>
                  </tr>
                )}
              </DataTable>
            ) : (
              <DataTable
                headers={[
                  { label: "Date" },
                  { label: "Statut" },
                  { label: "Validé par" },
                  { label: "Montant", align: "right" },
                ]}
              >
                {balanceData.payoutHistory.length > 0 ? (
                  balanceData.payoutHistory.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-slate-800 hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3 text-[10px] font-mono text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString("fr-FR")} à{" "}
                        {new Date(p.createdAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 font-bold text-[9px] uppercase border ${
                            p.status === "approved"
                              ? "bg-green-500/10 text-green-500 border-green-500/20"
                              : p.status === "pending"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse"
                                : "bg-red-500/10 text-red-500 border-red-500/20"
                          }`}
                        >
                          {p.status === "approved"
                            ? "Payé"
                            : p.status === "pending"
                              ? "En attente"
                              : "Refusé"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[10px] font-bold text-slate-300 uppercase">
                        {p.processedBy || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-200 text-xs">
                        DZD {p.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="text-center py-8 text-slate-600 font-bold uppercase text-[10px] tracking-widest"
                    >
                      Aucun historique de retrait.
                    </td>
                  </tr>
                )}
              </DataTable>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL : FINALISER LA COUPE (COMPACTE & RESPONSIVE) ── */}
      <Modal
        isOpen={showServiceModal}
        onClose={() => !isProcessing && setShowServiceModal(false)}
      >
        <div className="p-4 sm:p-6 max-h-[85vh] overflow-y-auto bg-slate-950 w-full">
          <h2 className="text-base sm:text-lg font-serif font-bold text-amber-500 mb-1 uppercase tracking-wider text-center">
            Valider la Prestation
          </h2>
          <p className="text-[9px] uppercase text-slate-500 tracking-widest font-bold text-center border-b border-slate-800 pb-2.5 mb-3">
            Sélectionnez la coupe réalisée
          </p>

          <div className="mb-4">
            {/* BARRE DE RECHERCHE EMPILABLE (S'adapte aux petits écrans sans dépasser) */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-900 py-2.5 px-3 border border-slate-800 mb-3 gap-2">
              <h3 className="text-xs font-bold tracking-widest uppercase text-slate-100">
                Menu Prestations
              </h3>
              <input
                type="text"
                placeholder="Recherche rapide..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 rounded-none w-full sm:w-48 font-bold"
              />
            </div>

            {/* GRILLE DES COUPES COMPACTE (Moins de scroll vertical) */}
            <div className="grid grid-cols-2 gap-2 max-h-[420px] sm:max-h-[480px] overflow-y-auto pr-1">
              {availableServices
                .filter((s) =>
                  s.name.toLowerCase().includes(serviceSearch.toLowerCase()),
                )
                // ── FILTRE VIP : On cache si la coupe est VIP et le barbier n'est pas VIP ──
                .filter((s) => (s.isVipOnly ? isBarberVip : true))
                // ───────────────────────────────────────────────────────────────────────────
                .map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`p-2.5 border transition-all text-left flex flex-col justify-between min-h-[65px] ${
                        isSelected
                          ? "border-amber-500 bg-amber-500/10 shadow-md"
                          : "border-slate-800 bg-slate-950 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <p className="font-bold text-slate-200 uppercase text-xs leading-tight">
                          {service.name}
                        </p>
                        {service.hasProductDeduction && (
                          <span className="text-[8px] font-bold text-amber-400 bg-amber-400/10 px-1 border border-amber-400/30 shrink-0">
                            Dose: {service.productCost} DA
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs sm:text-sm font-mono mt-1.5 font-bold ${isSelected ? "text-amber-500" : "text-slate-400"}`}
                      >
                        DZD {Number(service.price).toFixed(2)}
                      </p>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* TOTAL AVEC CALCUL +50% VISIBLE */}
          <div className="pt-2.5 border-t border-slate-800 flex flex-col mb-4">
            {/* Alerte visuelle si c'est un RDV VIP */}
            {currentTicket?.isReservation && selectedService && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-2 mb-2">
                <p className="text-[10px] font-bold text-amber-500 uppercase flex items-center gap-1">
                  <Crown size={12} /> Majoration Rendez-vous VIP (+50%)
                </p>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                  Prix de base : {Number(selectedService.price).toFixed(2)} DA →
                  Majoré : {(Number(selectedService.price) * 1.5).toFixed(2)} DA
                </p>
              </div>
            )}

            <div className="flex justify-between items-end">
              <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">
                Montant à transmettre :
              </p>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-amber-500 leading-none mt-1">
                DZD{" "}
                {selectedService
                  ? (currentTicket?.isReservation
                      ? Number(selectedService.price) * 1.5
                      : Number(selectedService.price)
                    ).toFixed(2)
                  : "0.00"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowServiceModal(false)}
              disabled={isProcessing}
              className="py-3 text-xs font-bold"
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleCompleteService}
              disabled={isProcessing || !selectedService}
              className="py-3 text-xs font-bold shadow-md"
            >
              {isProcessing ? "Transmission..." : "Envoyer en Caisse"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL 2 : DEMANDE DE RETRAIT ── */}
      <Modal
        isOpen={isPayoutModalOpen}
        onClose={() => !isProcessing && setIsPayoutModalOpen(false)}
      >
        <form
          onSubmit={handleRequestPayout}
          className="p-6 sm:p-8 bg-slate-950 border-t-4 border-amber-500"
        >
          <h3 className="text-lg font-serif font-bold text-amber-500 mb-2 uppercase tracking-wider text-center">
            Demande de Retrait d'Espèces
          </h3>
          <p className="text-[11px] text-slate-400 text-center mb-5 leading-relaxed">
            Transmettez votre demande à la réception pour récupérer vos
            commissions en espèces.
          </p>

          <div className="space-y-4">
            <Input
              label="Montant (DZD) *"
              type="number"
              step="0.01"
              max={balanceData.currentBalance}
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              required
              autoFocus
            />

            <div className="flex justify-between items-center text-xs font-bold bg-slate-900 p-3 border border-slate-800">
              <span className="text-slate-500 uppercase">Disponible :</span>
              <span className="text-green-400 font-mono text-sm">
                DZD{" "}
                {(
                  balanceData.availableToRequest ??
                  balanceData.currentBalance ??
                  0
                ).toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsPayoutModalOpen(false)}
                disabled={isProcessing}
                className="py-3 text-xs font-bold"
              >
                Annuler
              </Button>
              <Button
                variant="success"
                type="submit"
                disabled={isProcessing}
                className="py-3 text-xs font-bold shadow-md"
              >
                {isProcessing ? "Validation..." : "Envoyer Demande"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
