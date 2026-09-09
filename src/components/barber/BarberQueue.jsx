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
  RefreshCcw,
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
  const [statsSubTab, setStatsSubTab] = useState("services"); // 'services' ou 'payouts' dans l'onglet stats

  // --- WORKSPACE STATES ---
  const [tickets, setTickets] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);

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

  // --- 1. POLLING & CHARGEMENT DE LA FILE D'ATTENTE ---
  const loadWorkspace = async () => {
    if (activeTab !== "workspace") return;
    try {
      const resTickets = await api.get("/tickets/live");
      const myTickets = resTickets.data
        .filter((t) => t.barberId === barberId)
        .sort((a, b) => a.id - b.id);
      setTickets(myTickets);
      setIsLoading(false);
    } catch (err) {
      toast.error("Erreur de synchronisation du poste.");
    }
  };

  useEffect(() => {
    loadWorkspace();
    Promise.all([api.get("/services"), api.get("/products")]).then(
      ([srvRes, prdRes]) => {
        setAvailableServices(srvRes.data);
        setAvailableProducts(prdRes.data);
      },
    );

    const interval = setInterval(loadWorkspace, 5000);
    return () => clearInterval(interval);
  }, [barberId, activeTab]);

  // --- 2. CHARGEMENT DES STATS ET DU SOLDE WALLET ---
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
    if (window.confirm(`Retirer ${clientName} de la liste ? (Absent)`)) {
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
    setSelectedProducts([]);
    setShowServiceModal(true);
  };

  const handleToggleProduct = (product) => {
    setSelectedProducts((prev) =>
      prev.find((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product],
    );
  };

  const handleCompleteService = async () => {
    if (!selectedTicketId || !selectedService)
      return toast.error("Veuillez sélectionner une prestation.");
    setIsProcessing(true);
    try {
      let finalName = selectedService.name;
      let finalPrice = Number(selectedService.price);
      if (selectedProducts.length > 0) {
        const prodNames = selectedProducts.map((p) => p.name).join(", ");
        finalName = `${selectedService.name} + (${prodNames})`;
        finalPrice += selectedProducts.reduce(
          (sum, p) => sum + Number(p.salePrice),
          0,
        );
      }

      await api.patch(`/tickets/${selectedTicketId}/finish`, {
        serviceName: finalName,
        totalPrice: finalPrice,
        productCost: selectedService.hasProductDeduction
          ? Number(selectedService.productCost)
          : 0,
        productIds: selectedProducts.map((p) => p.id),
      });
      toast.success("Facture transmise à la caisse !");

      setShowServiceModal(false);
      setSelectedTicketId(null);
      setSelectedService(null);
      setSelectedProducts([]);
      loadWorkspace();
    } catch (err) {
      toast.error("Échec de transmission.");
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
      toast.success(`Demande de ${amount} DZD transmise à la caisse !`);
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
      {/* ── ONGLETS DU TERMINAL BARBIER (TACTILES) ── */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 -mt-4 sm:-mt-8 -mx-3 sm:-mx-6 px-2 sm:px-6 mb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("workspace")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 sm:py-3.5 text-[10px] sm:text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap shrink-0 ${
            activeTab === "workspace"
              ? "border-b-2 border-amber-500 text-amber-500 bg-slate-800/40"
              : "border-b-2 border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Scissors className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="sm:hidden">Fauteuil</span>
          <span className="hidden sm:inline">Fauteuil &amp; File</span>
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 sm:py-3.5 text-[10px] sm:text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap shrink-0 ${
            activeTab === "stats"
              ? "border-b-2 border-amber-500 text-amber-500 bg-slate-800/40"
              : "border-b-2 border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="sm:hidden">Rémunération</span>
          <span className="hidden sm:inline">
            Espace Pro &amp; Rémunération
          </span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          VUE 1 : WORKSPACE (FAUTEUIL ACTIF & SALLE D'ATTENTE)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "workspace" && (
        <div className="space-y-4">
          {/* FAUTEUIL ACTIF */}
          {currentTicket ? (
            <div className="bg-slate-950 border border-amber-500/50 p-4 sm:p-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 sm:w-2 h-full bg-amber-500"></div>
              <div className="flex items-center gap-2.5 mb-4 pl-3 border-b border-slate-800 pb-3">
                <UserCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 animate-pulse shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-lg font-serif font-bold text-amber-400 uppercase tracking-widest truncate">
                    Actuellement en Fauteuil
                  </h2>
                  <p className="text-slate-500 text-[9px] uppercase font-bold font-mono">
                    Client N° #{currentTicket.queueNumber || currentTicket.id}
                  </p>
                </div>
              </div>

              <div className="pl-3 flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase text-slate-500 tracking-widest font-bold">
                    Nom du Client
                  </p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-100 uppercase break-words">
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
                    <CheckCircle size={16} className="mr-1.5 shrink-0" />{" "}
                    Valider Coupe
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
            <h2 className="text-xs sm:text-sm font-serif font-bold text-slate-100 uppercase tracking-widest border-b border-slate-800 pb-3 mb-3">
              En attente pour vous ({pendingTickets.length})
            </h2>
            {pendingTickets.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center justify-center opacity-50">
                <Clock className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] px-4">
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
                    <div className="flex gap-3 items-center min-w-0 w-full sm:w-auto">
                      <div className="w-10 h-10 bg-slate-900 border border-amber-500 text-amber-500 flex justify-center items-center font-mono font-bold text-lg shadow-sm shrink-0">
                        {ticket.queueNumber || ticket.id}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide truncate">
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
                        className="text-red-500 hover:text-red-400 text-[10px] py-2 px-3 flex-1 sm:flex-none whitespace-nowrap"
                      >
                        Absent
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleStartService(ticket.id)}
                        disabled={currentTicket != null}
                        className={`text-[10px] py-2 px-4 flex-1 sm:flex-none whitespace-nowrap ${
                          currentTicket
                            ? "opacity-30 border-slate-800 text-slate-700"
                            : "text-slate-200"
                        }`}
                      >
                        <Play size={12} className="mr-1.5 shrink-0" /> Prendre
                        en charge
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
          VUE 2 : ESPACE PRO & RÉMUNÉRATION (WALLET & ONGLETS TABLEAUX)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "stats" && (
        <div className="space-y-4">
          {/* PÉRIODE & STATS CARDS */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-900 border border-slate-800 p-4 sm:p-5 gap-3">
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-serif font-bold text-slate-100 uppercase tracking-widest truncate">
                Mon Activité &amp; Gains
              </h2>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mt-0.5">
                Suivi de vos commissions et retraits d'espèces
              </p>
            </div>
            <div className="grid grid-cols-4 sm:flex bg-slate-950 p-1 border border-slate-800 w-full sm:w-auto gap-1 sm:gap-0">
              {["Today", "Week", "Month", "Year"].map((period) => (
                <Button
                  key={period}
                  variant={
                    statsPeriod === period.toLowerCase() ? "primary" : "ghost"
                  }
                  onClick={() => setStatsPeriod(period.toLowerCase())}
                  className="px-2 sm:px-3 py-1.5 text-[9px] sm:text-[10px] tracking-wider font-bold whitespace-nowrap"
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
              label={`Mon Gain Période (50% + Tips)`}
              value={
                isStatsLoading
                  ? "..."
                  : `DZD ${(Number(statsData.summary.totalRevenue || 0) * 0.5 + Number(statsData.summary.totalTips || 0)).toFixed(2)}`
              }
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

          {/* PORTEFEUILLE (WALLET) */}
          <div className="bg-slate-900 border-2 border-amber-500 p-4 sm:p-5 shadow-lg">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-3 border-b border-amber-500/30 pb-2">
              <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5 min-w-0">
                <Wallet size={16} className="shrink-0" />{" "}
                <span className="truncate">Mon Portefeuille Personnel</span>
              </h3>
              {balanceData.pendingRequests?.length > 0 && (
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 font-bold text-[9px] uppercase animate-pulse whitespace-nowrap">
                  Demande en cours
                </span>
              )}
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-stretch gap-3">
              <div className="grid grid-cols-2 flex-1 gap-3">
                <div className="bg-slate-950 border border-slate-800 p-3 text-center min-w-0">
                  <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-1">
                    Total Gagné
                  </p>
                  <p className="text-sm sm:text-lg font-mono font-bold text-slate-200 break-words">
                    DZD {Number(balanceData.totalEarned || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-3 text-center min-w-0">
                  <p className="text-[9px] uppercase font-bold text-red-500 tracking-widest mb-1">
                    Déjà Récupéré
                  </p>
                  <p className="text-sm sm:text-lg font-mono font-bold text-red-400 break-words">
                    - DZD {Number(balanceData.totalRetrieved || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex-1 bg-[#0a0a0a] border-2 border-slate-800 p-3 flex flex-wrap justify-between items-center gap-2 shadow-inner min-w-0">
                <div className="min-w-0">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest block">
                    Solde Disponible
                  </span>
                  <span className="text-[9px] text-slate-600 font-bold">
                    À retirer en caisse
                  </span>
                </div>
                <p className="text-lg sm:text-2xl font-mono font-black text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.4)] break-words">
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
                className="py-3.5 sm:py-4 px-6 font-bold text-xs tracking-widest uppercase shadow-md shrink-0 whitespace-nowrap"
              >
                <Banknote size={16} className="mr-2 shrink-0" /> Demander
                Retrait
              </Button>
            </div>
          </div>

          {/* ── ONGLETS POUR BASCULER ENTRE LES TABLEAUX (FIN L'EMPILEMENT) ── */}
          <div className="bg-slate-900 border border-slate-800 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-slate-800 flex gap-2 bg-slate-950/40 overflow-x-auto">
              <button
                onClick={() => setStatsSubTab("services")}
                className={`px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border whitespace-nowrap shrink-0 ${
                  statsSubTab === "services"
                    ? "bg-amber-500 text-slate-950 border-amber-500 shadow-md"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                📋 Prestations ({statsData.history.length})
              </button>
              <button
                onClick={() => setStatsSubTab("payouts")}
                className={`px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border whitespace-nowrap shrink-0 ${
                  statsSubTab === "payouts"
                    ? "bg-amber-500 text-slate-950 border-amber-500 shadow-md"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                🏦 Retraits ({balanceData.payoutHistory.length})
              </button>
            </div>

            {/* RENDU DU TABLEAU ACTIF */}
            <div className="overflow-x-auto">
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
                        <td className="px-4 py-3 font-mono font-bold text-slate-500 text-[10px] whitespace-nowrap">
                          #{t.id}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-200 uppercase text-xs whitespace-nowrap">
                          {t.client}
                        </td>
                        <td className="px-4 py-3 text-slate-300 italic text-xs">
                          {t.service}
                          {t.productCost > 0 && (
                            <span className="block text-[9px] text-amber-500 not-italic font-bold">
                              (Dose produit : -{t.productCost} DA)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-green-400 text-xs whitespace-nowrap">
                          {t.tip > 0 ? `+${Number(t.tip).toFixed(0)}` : "--"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-400 text-xs whitespace-nowrap">
                          {Number(t.price).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-[#00ff00] text-sm whitespace-nowrap">
                          {(
                            Math.max(
                              0,
                              Number(t.originalPrice ?? t.price) -
                                Number(t.productCost || 0),
                            ) *
                              0.5 +
                            Number(t.tip)
                          ).toFixed(2)}{" "}
                          DA
                        </td>
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
                        <td className="px-4 py-3 text-[10px] font-mono text-slate-400 whitespace-nowrap">
                          {new Date(p.createdAt).toLocaleDateString("fr-FR")} à{" "}
                          {new Date(p.createdAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
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
                        <td className="px-4 py-3 text-[10px] font-bold text-slate-300 uppercase whitespace-nowrap">
                          {p.processedBy || "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-200 text-xs whitespace-nowrap">
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
        </div>
      )}

      {/* ── MODAL 1 : FINALISER LA COUPE ── */}
      <Modal
        isOpen={showServiceModal}
        onClose={() => !isProcessing && setShowServiceModal(false)}
      >
        <div className="p-4 sm:p-8 max-h-[85vh] overflow-y-auto bg-slate-950">
          <h2 className="text-lg sm:text-xl font-serif font-bold text-amber-500 mb-2 uppercase tracking-wider text-center">
            Finaliser la Prestation
          </h2>
          <p className="text-[10px] uppercase text-slate-500 tracking-widest font-bold text-center border-b border-slate-800 pb-4 mb-5">
            Sélectionnez la prestation réalisée
          </p>

          <div className="mb-6">
            <h3 className="text-xs font-bold tracking-widest uppercase text-slate-100 mb-3 bg-slate-900 py-2 px-3 border border-slate-800">
              1. Prestation Réalisée *
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availableServices.map((service) => {
                const isSelected = selectedService?.id === service.id;
                return (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`p-3.5 border transition-all text-left flex flex-col justify-between min-h-[90px] ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/10 shadow-md"
                        : "border-slate-800 bg-slate-950 hover:border-slate-600"
                    }`}
                  >
                    <p className="font-bold text-slate-200 uppercase text-xs leading-snug break-words">
                      {service.name}
                    </p>
                    <p
                      className={`text-base font-mono mt-2 font-bold ${isSelected ? "text-amber-500" : "text-slate-500"}`}
                    >
                      DZD {Number(service.price).toFixed(2)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-bold tracking-widest uppercase text-slate-100 mb-3 bg-slate-900 py-2 px-3 border border-slate-800">
              2. Produits Vendus (Optionnel)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availableProducts.map((product) => {
                const isSelected = selectedProducts.find(
                  (p) => p.id === product.id,
                );
                return (
                  <button
                    key={product.id}
                    onClick={() => handleToggleProduct(product)}
                    className={`p-2.5 border transition-all text-left flex items-center justify-between gap-2 ${
                      isSelected
                        ? "border-green-500/50 bg-green-500/10 text-green-400"
                        : "border-slate-800 bg-slate-950 text-slate-400"
                    }`}
                  >
                    <span className="font-bold uppercase text-[11px] truncate min-w-0">
                      {product.name}
                    </span>
                    <span className="font-mono text-xs font-bold shrink-0">
                      DZD {Number(product.salePrice).toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-between items-end mb-5 gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">
                Total transmis en caisse :
              </p>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-amber-500 leading-none mt-1 break-words">
                DZD{" "}
                {selectedService
                  ? (
                      Number(selectedService.price) +
                      selectedProducts.reduce(
                        (s, p) => s + Number(p.salePrice),
                        0,
                      )
                    ).toFixed(2)
                  : "0.00"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              className="py-3 text-xs font-bold"
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
          className="p-4 sm:p-8 bg-slate-950 border-t-4 border-amber-500"
        >
          <h3 className="text-base sm:text-lg font-serif font-bold text-amber-500 mb-3 uppercase tracking-wider text-center">
            Demande de Retrait d'Espèces
          </h3>
          <p className="text-[11px] text-slate-400 text-center mb-5 leading-relaxed">
            Transmettez votre demande à la réception pour récupérer vos gains en
            espèces.
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

            <div className="flex justify-between items-center gap-2 text-xs font-bold bg-slate-900 p-3 border border-slate-800 flex-wrap">
              <span className="text-slate-500 uppercase">Disponible :</span>
              <span className="text-green-400 font-mono text-sm break-words">
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
