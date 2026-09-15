import { useState, useEffect } from "react";
import {
  Users,
  Clock,
  DollarSign,
  Plus,
  CreditCard,
  RefreshCcw,
  Ban,
  Activity,
  Target,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

// Imports from the common folder
import StatCard from "../common/StatCard";
import StatusBadge from "../common/StatusBadge";
import DataTable from "../common/DataTable";
import Modal from "../common/Modal";
import Button from "../common/Button";
import Input from "../common/Input";

export default function ReceptionistDashboard() {
  const [liveTickets, setLiveTickets] = useState([]);
  const [historyTickets, setHistoryTickets] = useState([]);
  const [barbers, setBarbers] = useState([]);

  // New Analytics State specifically for the Dashboard
  const [dailyStats, setDailyStats] = useState({
    summary: {
      totalRevenue: 0,
      totalServicesSold: 0,
      avgTransaction: 0,
      lostClientsCount: 0,
      potentialLossAmount: 0,
    },
    charts: { serviceDistributionData: [], barberRevenueData: [] },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedBarber, setSelectedBarber] = useState("");
  const [clientName, setClientName] = useState("");

  const [showPayModal, setShowPayModal] = useState(false);
  const [ticketToPay, setTicketToPay] = useState(null);

  const [dailyGoal, setDailyGoal] = useState(30000);

  // --- 1. DATA FETCHING & POLLING ---
  const loadData = async () => {
    try {
      const [barbersRes, liveRes, historyRes, statsRes, settingsRes] =
        await Promise.all([
          api.get("/barbers"),
          api.get("/tickets/live"),
          api.get("/tickets/history"),
          api.get("/reports/dashboard?period=today"),
          api.get("/settings"), // <-- AJOUT POUR RÉCUPÉRER L'OBJECTIF
        ]);
      setBarbers(barbersRes.data);
      setLiveTickets(liveRes.data);
      setHistoryTickets(historyRes.data);
      setDailyStats(statsRes.data);

      // Met à jour l'objectif configuré par le patron
      if (settingsRes.data.daily_revenue_goal) {
        setDailyGoal(parseFloat(settingsRes.data.daily_revenue_goal) || 30000);
      }
    } catch (error) {
      console.error("Erreur de synchronisation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Auto-refresh every 5s
    return () => clearInterval(interval);
  }, []);

  // --- 2. DERIVED STATS & LOGIC ---
  const totalRevenueToday = dailyStats?.summary?.totalRevenue || 0;
  const pendingPaymentsCount = liveTickets.filter(
    (t) => t.status === "ready-to-pay",
  ).length;
  const waitingOrInServiceCount = liveTickets.filter((t) =>
    ["waiting", "in-progress"].includes(t.status),
  ).length;

  const DAILY_GOAL = dailyGoal || 30000;
  const goalPercentage =
    DAILY_GOAL > 0 ? Math.min((totalRevenueToday / DAILY_GOAL) * 100, 100) : 0;

  const topServices = [...(dailyStats?.charts?.serviceDistributionData || [])]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  // --- 3. HANDLERS ---
  const handleCreateTicket = async () => {
    if (!selectedBarber) return toast.error("Veuillez assigner un barbier.");

    setIsSubmitting(true);
    try {
      await api.post("/tickets", {
        clientName: clientName || "Client Standard",
        barberId: Number(selectedBarber),
      });
      toast.success("Ticket imprimé et ajouté à la file !");
      setClientName("");
      setSelectedBarber("");
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur de création");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelTicket = async (id, name) => {
    if (window.confirm(`Voulez-vous vraiment annuler le ticket de ${name} ?`)) {
      try {
        await api.delete(`/tickets/${id}`);
        toast.success("Ticket annulé avec succès.");
        loadData();
      } catch (err) {
        toast.error("Erreur lors de l'annulation.");
      }
    }
  };

  const handleOpenPayModal = (ticket) => {
    setTicketToPay(ticket);
    setShowPayModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!ticketToPay) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/tickets/${ticketToPay.id}/pay`);
      toast.success(
        `Paiement de DZD ${ticketToPay.price.toFixed(2)} encaissé !`,
      );
      setShowPayModal(false);
      setTicketToPay(null);
      loadData();
    } catch (error) {
      toast.error("Échec du paiement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* --- 1. TOP METRICS ROW --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Recette du Jour"
          value={`DZD ${(totalRevenueToday || 0).toFixed(2)}`} // <-- SÉCURISÉ ICI
          icon={DollarSign}
          colorClass="text-green-500"
          highlight={true}
        />
        <StatCard
          label="En Attente / Fauteuil"
          value={waitingOrInServiceCount}
          icon={Clock}
          colorClass="text-amber-500"
        />
        <StatCard
          label="Encaiss. en Attente"
          value={pendingPaymentsCount}
          icon={CreditCard}
          colorClass={
            pendingPaymentsCount > 0 ? "text-amber-500" : "text-slate-500"
          }
          highlight={pendingPaymentsCount > 0}
        />
        <StatCard
          label="Effectif Actif"
          value={barbers.length}
          icon={Users}
          colorClass="text-slate-100"
        />
      </div>

      {/* --- 2. NEW: PERFORMANCE TRACKER ROW --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goal Tracker */}
        <div className="bg-slate-900 border border-slate-800 p-6 flex flex-col justify-center">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs uppercase font-bold tracking-widest text-slate-400 flex items-center gap-2">
              <Target size={14} /> Objectif Journalier
            </h3>
            {/* AFFICHE LE MONTANT RÉEL CONFIGURÉ */}
            <span className="text-xs font-mono font-bold text-amber-400">
              DZD {Number(dailyGoal).toLocaleString()}
            </span>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold font-mono text-slate-100">
              {goalPercentage.toFixed(0)}%
            </span>
            <span className="text-xs text-slate-500 mb-1 uppercase tracking-widest">
              Atteint
            </span>
          </div>
          <div className="w-full bg-slate-950 h-3 border border-slate-800 relative overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-1000 ease-out"
              style={{ width: `${goalPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Top Services */}
        <div className="bg-slate-900 border border-slate-800 p-6">
          <h3 className="text-xs uppercase font-bold tracking-widest text-slate-400 flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
            <Activity size={14} /> Top Prestations (Aujourd'hui)
          </h3>
          <div className="space-y-3">
            {topServices.length > 0 ? (
              topServices.map((srv, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-200 uppercase truncate pr-4">
                    {srv.name}
                  </span>
                  <span className="text-xs font-mono bg-slate-950 border border-slate-800 px-2 py-1 text-amber-500">
                    {srv.amount}x
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-600 italic">Aucune donnée</p>
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-slate-900 border border-slate-800 p-6 flex flex-col">
          <h3 className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-4 border-b border-slate-800 pb-2">
            Activité Récente
          </h3>
          <div className="flex-1 overflow-hidden">
            <div className="space-y-3">
              {historyTickets.slice(0, 3).map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex justify-between items-start"
                >
                  <div>
                    <p className="text-xs font-bold text-green-500 uppercase">
                      Encaissé
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                      {ticket.clientName} • {ticket.barber}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    +DZD {ticket.price.toFixed(2)}
                  </span>
                </div>
              ))}
              {historyTickets.length === 0 && (
                <p className="text-xs text-slate-600 italic">
                  Aucune transaction
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- 3. MAIN WORKSPACE (WIDGETS & FORMS) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BARBER STATUS WIDGET */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 relative min-h-[300px]">
          {isLoading && (
            <div className="absolute inset-0 bg-slate-950/50 flex justify-center items-center z-10 backdrop-blur-[1px]">
              <RefreshCcw className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          )}
          <h2 className="text-lg font-serif font-bold text-amber-400 mb-6 uppercase tracking-widest">
            Statut des Postes
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-2">
            {barbers.length === 0 && !isLoading && (
              <p className="col-span-full text-slate-500 text-xs font-bold uppercase tracking-widest text-center mt-10">
                Aucun barbier actif
              </p>
            )}
            {barbers.map((barber) => {
              // On récupère les tickets de ce barbier
              const barberTickets = liveTickets.filter(
                (t) => t.barberId === barber.id,
              );
              const isInProgress = barberTickets.some(
                (t) => t.status === "in-progress",
              );
              const waitingCount = barberTickets.filter(
                (t) => t.status === "waiting",
              ).length;

              // MODIFIÉ : Occupé si en cours OU s'il y a de l'attente
              const isBusy = isInProgress || waitingCount > 0;

              return (
                <div
                  key={barber.id}
                  className={`flex flex-col items-center text-center gap-3 p-4 border transition-colors ${
                    isBusy
                      ? "bg-slate-800/40 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                      : "bg-slate-950 border-slate-800"
                  }`}
                >
                  <div className="relative">
                    {barber.image ? (
                      <img
                        src={barber.image}
                        alt={barber.name}
                        className={`w-20 h-20 object-cover rounded-full transition-all ${isBusy ? "border-amber-500" : "border-slate-700 grayscale"}`}
                      />
                    ) : (
                      <div
                        className={`w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-inner ${isBusy ? "bg-slate-900 border-amber-500" : "bg-slate-800 border-slate-700"}`}
                      >
                        <span
                          className={`text-3xl font-black uppercase ${isBusy ? "text-amber-500" : "text-slate-500"}`}
                        >
                          {barber.name ? barber.name.charAt(0) : "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 mt-2">
                    <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                      {barber.name}
                    </h3>
                    <p className="text-[10px] text-t-muted uppercase font-bold mt-1">
                      {waitingCount > 0
                        ? `${waitingCount} en attente`
                        : isBusy
                          ? "En cours"
                          : "Libre"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* QUICK ADD FORM */}
        <div className="bg-slate-900 border border-slate-800 p-6 h-fit relative">
          {isSubmitting && (
            <div className="absolute inset-0 bg-slate-950/50 flex justify-center items-center z-10">
              <RefreshCcw className="w-6 h-6 text-amber-500 animate-spin" />
            </div>
          )}
          <h2 className="text-lg font-serif font-bold text-amber-400 mb-6 uppercase tracking-widest">
            Ajout Rapide
          </h2>
          <div className="space-y-4">
            <Input
              placeholder="Nom du client (Optionnel)"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
            <select
              value={selectedBarber}
              onChange={(e) => setSelectedBarber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 px-4 py-3 focus:border-amber-500 focus:outline-none transition-colors appearance-none rounded-none text-xs font-bold uppercase tracking-wider"
            >
              <option value="" className="text-slate-600">
                -- Assigner un Barbier --
              </option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (Poste {b.poste || "?"})
                </option>
              ))}
            </select>
            <Button
              variant="primary"
              fullWidth
              onClick={handleCreateTicket}
              className="py-4 mt-4 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-5 h-5 mr-2" /> Imprimer Ticket
            </Button>
          </div>
        </div>
      </div>

      {/* --- 4. MAIN DATA TABLE --- */}
      <DataTable
        title="Flux en Direct (Live)"
        headers={[
          { label: "Ref" },
          { label: "Client" },
          { label: "Prestation" },
          { label: "Barbier" },
          { label: "Heure" },
          { label: "Statut" },
          { label: "Action", align: "right" },
        ]}
      >
        {liveTickets.length > 0 ? (
          liveTickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors"
            >
              <td className="px-6 py-4 font-mono text-slate-500 font-bold text-xs">
                #{ticket.id}
              </td>
              <td className="px-6 py-4 font-bold text-slate-200 uppercase text-xs tracking-tight">
                {ticket.clientName}
              </td>
              <td className="px-6 py-4 text-slate-300 italic text-sm">
                {ticket.service || "--"}
              </td>
              <td className="px-6 py-4 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                {ticket.barber}
              </td>
              <td className="px-6 py-4 text-slate-400 font-mono text-sm">
                {ticket.time}
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={ticket.status} />
              </td>
              <td className="px-6 py-4 text-right flex justify-end gap-2">
                {["waiting", "in-progress"].includes(ticket.status) && (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      handleCancelTicket(ticket.id, ticket.clientName)
                    }
                    className="text-red-500 hover:text-red-400 py-2 px-3 text-[10px]"
                  >
                    <Ban size={14} />
                  </Button>
                )}
                {ticket.status === "ready-to-pay" && (
                  <Button
                    variant="primary"
                    onClick={() => handleOpenPayModal(ticket)}
                    className="py-2 px-4 text-[10px]"
                  >
                    <CreditCard className="w-3.5 h-3.5 mr-1" /> Encaisser
                  </Button>
                )}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan="7"
              className="py-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs"
            >
              Le salon est actuellement vide.
            </td>
          </tr>
        )}
      </DataTable>

      {/* --- 5. PAYMENT MODAL --- */}
      <Modal
        isOpen={showPayModal}
        onClose={() => !isSubmitting && setShowPayModal(false)}
      >
        {/* ... (Payment Modal remains exactly the same as previously built) ... */}
        {ticketToPay && (
          <div className="p-8 text-center border-t-4 border-amber-500">
            <div className="mx-auto flex items-center justify-center h-12 w-12 bg-amber-500/10 mb-4 border border-amber-500/30">
              <DollarSign className="h-6 w-6 text-amber-500" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-slate-100 mb-1 uppercase tracking-wider">
              Validation Caisse
            </h3>
            <p className="text-xs text-slate-500 font-mono mb-6 uppercase tracking-widest border-b border-slate-800 pb-4">
              Ticket Ref: #{ticketToPay.id}
            </p>

            <div className="bg-slate-950 p-4 text-left mb-6 space-y-2 border border-slate-800 shadow-inner">
              <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
                  Client:
                </span>
                <span className="text-slate-100 font-bold uppercase truncate max-w-[150px]">
                  {ticketToPay.clientName}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-b border-slate-800/50 pb-2">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
                  Barbier:
                </span>
                <span className="text-slate-300 font-medium uppercase tracking-widest text-[10px]">
                  {ticketToPay.barber}
                </span>
              </div>
              <div className="pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 italic text-sm">
                    {ticketToPay.service}
                  </span>
                  <span className="text-slate-300 font-mono">
                    DZD {(ticketToPay.price || 0).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="border-t border-slate-700 pt-4 mt-4 flex justify-between items-center bg-green-950/20 px-2 pb-2">
                <span className="text-xs font-bold text-green-500 uppercase tracking-widest">
                  Net à Payer
                </span>
                <span className="text-3xl font-bold text-green-400 font-mono">
                  DZD {(ticketToPay.price || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-8">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setShowPayModal(false)}
                className="py-4"
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleConfirmPayment}
                className="py-4 bg-green-600 border-green-500 hover:bg-green-500 shadow-[0_0_15px_rgba(22,163,74,0.3)]"
                disabled={isSubmitting}
              >
                {isSubmitting ? "..." : "Confirmer Paiement"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
