import { useState, useEffect } from "react";
import {
  CheckCircle,
  Clock,
  Play,
  UserCircle,
  BarChart2,
  Scissors,
  DollarSign,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

// Common UI Imports
import Button from "../common/Button";
import Modal from "../common/Modal";
import StatCard from "../common/StatCard";
import DataTable from "../common/DataTable";
export default function BarberQueue({ barberId, barberName }) {
  const [activeTab, setActiveTab] = useState("workspace"); // 'workspace' or 'stats'

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

  // --- POLLING & WORKSPACE FETCHING ---
  const loadWorkspace = async () => {
    if (activeTab !== "workspace") return; // Stop polling workspace if viewing stats
    try {
      const resTickets = await api.get("/tickets/live");
      const myTickets = resTickets.data
        .filter((t) => t.barberId === barberId)
        .sort((a, b) => a.id - b.id);
      setTickets(myTickets);
      setIsLoading(false);
    } catch (err) {
      toast.error("Erreur de synchronisation");
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

  // --- FETCH STATS LOGIC ---
  const fetchMyStats = async () => {
    setIsStatsLoading(true);
    try {
      const res = await api.get(
        `/reports/barber/${barberId}?period=${statsPeriod}`,
      );
      setStatsData(res.data);
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

  // Derived Workspace Data
  const currentTicket = tickets.find((t) => t.status === "in-progress");
  const pendingTickets = tickets.filter((t) => t.status === "waiting");

  // --- WORKSPACE HANDLERS ---
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
        toast.success(`Client ${clientName} retiré de la liste.`);
        loadWorkspace();
      } catch (err) {
        toast.error("Erreur d'annulation.");
      }
    }
  };
  const handlePauseService = async (ticketId) => {
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status: "waiting" });
      toast.success("Client replacé en salle d'attente.");
      loadWorkspace(); // Instantly removes them from the chair and back to the queue
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
      return toast.error("Veuillez sélectionner une prestation");
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
      });
      toast.success("Facture transmise à la caisse.");

      setShowServiceModal(false);
      setSelectedTicketId(null);
      setSelectedService(null);
      setSelectedProducts([]);
      loadWorkspace();
    } catch (err) {
      toast.error("Échec de la transaction");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading && activeTab === "workspace")
    return (
      <div className="p-10 text-center font-bold tracking-widest text-amber-500 uppercase animate-pulse">
        Syncing Station...
      </div>
    );

  return (
    <div className="space-y-6">
      {/* --- TABLET TABS NAVIGATION --- */}
      <div className="flex border-b border-slate-800 bg-slate-900/50 -mt-6 -mx-6 px-6 mb-6">
        <button
          onClick={() => setActiveTab("workspace")}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold tracking-wider uppercase transition-all ${
            activeTab === "workspace"
              ? "border-b-2 border-amber-500 text-amber-500 bg-slate-800/50"
              : "border-b-2 border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Scissors className="w-4 h-4" /> File D'attente
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold tracking-wider uppercase transition-all ${
            activeTab === "stats"
              ? "border-b-2 border-amber-500 text-amber-500 bg-slate-800/50"
              : "border-b-2 border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <BarChart2 className="w-4 h-4" /> Mon Espace Pro (Stats)
        </button>
      </div>

      {activeTab === "workspace" && (
        <>
          {/* 1. CHAIR: CURRENTLY SERVING */}
          {currentTicket && (
            <div className="bg-slate-950 border border-amber-500/50 p-6 shadow-[0_0_30px_rgba(245,158,11,0.08)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
              <div className="flex items-center gap-3 mb-6 pl-4 border-b border-slate-800 pb-4">
                <UserCircle className="w-8 h-8 text-amber-500 animate-pulse" />
                <div>
                  <h2 className="text-xl font-serif font-bold text-amber-400 uppercase tracking-widest">
                    Actuellement en Fauteuil
                  </h2>
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                    Client Ref #{currentTicket.id}
                  </p>
                </div>
              </div>
              <div className="pl-4 flex flex-col md:flex-row justify-between md:items-end gap-6">
                <div className="border-l border-slate-800 pl-4 py-2">
                  <p className="text-xs uppercase text-slate-500 tracking-widest font-bold">
                    Nom du Client
                  </p>
                  <p className="text-3xl font-bold text-slate-100 uppercase">
                    {currentTicket.clientName}
                  </p>
                </div>

                {/* --- UPDATED BUTTONS FLEX CONTAINER --- */}
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                  {/* NEW PAUSE BUTTON */}
                  <Button
                    variant="outline"
                    onClick={() => handlePauseService(currentTicket.id)}
                    className="py-5 px-6 font-bold tracking-widest text-xs border-slate-700 text-slate-400 hover:text-amber-500 w-full sm:w-auto"
                  >
                    Mettre en Attente
                  </Button>

                  <Button
                    variant="success"
                    onClick={() => openCompletionModal(currentTicket.id)}
                    className="py-5 px-8 shadow-lg shadow-amber-500/20 font-bold tracking-[0.2em] w-full sm:w-auto"
                  >
                    <CheckCircle size={20} className="mr-2" />
                    Valider Coupe
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 2. THE QUEUE */}
          <div className="bg-slate-900 border border-slate-800 p-6 min-h-[400px]">
            <h2 className="text-lg font-serif font-bold text-slate-100 uppercase tracking-widest border-b border-slate-800 pb-4 mb-4">
              Salle D'Attente ({pendingTickets.length})
            </h2>
            {pendingTickets.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center justify-center opacity-50">
                <Clock className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                  Attente Vide
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTickets.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    className="bg-slate-950 border border-slate-800 p-4 hover:border-amber-500/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 bg-slate-900 border border-slate-700 text-slate-400 flex justify-center items-center font-mono font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
                          {ticket.clientName}
                        </h3>
                        <p className="text-slate-500 text-xs uppercase tracking-widest font-mono">
                          Ref: #{ticket.id} • Arrivé: {ticket.time}
                        </p>
                      </div>
                    </div>

                    <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleClientNoShow(ticket.id, ticket.clientName)
                        }
                        disabled={currentTicket != null}
                        className="text-red-500 hover:text-red-400 hover:bg-red-950/30 text-xs w-full sm:w-auto cursor-pointer"
                      >
                        Pas là
                      </Button>

                      <Button
                        variant="primary"
                        onClick={() => handleStartService(ticket.id)}
                        disabled={currentTicket != null}
                        className={`w-full sm:w-auto ${
                          currentTicket
                            ? "opacity-30 border-slate-800 text-slate-700"
                            : "text-slate-200"
                        }`}
                      >
                        <Play size={14} className="mr-2" /> Démarrer la coupe
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      {/* ============================================================== */}
      {/* VIEW 2: MY STATS (BARBER PERFORMANCE) */}
      {/* ============================================================== */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center bg-slate-900 border border-slate-800 p-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-slate-100 uppercase tracking-widest">
                Ma Caisse
              </h2>
              <p className="text-slate-500 text-xs uppercase mt-1 tracking-widest font-bold">
                Vue des gains réalisés et facturés
              </p>
            </div>
            <div className="flex bg-slate-950 p-1 border border-slate-800 mt-4 md:mt-0 w-full md:w-auto">
              {["Today", "Week", "Month", "Year"].map((period) => (
                <Button
                  key={period}
                  variant={
                    statsPeriod === period.toLowerCase() ? "primary" : "ghost"
                  }
                  onClick={() => setStatsPeriod(period.toLowerCase())}
                  className="flex-1 md:flex-none px-4 text-xs tracking-wider"
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              icon={DollarSign}
              label={`Revenus Caisse (${statsPeriod.toUpperCase()})`}
              value={
                isStatsLoading
                  ? "..."
                  : `DZD ${statsData.summary.totalRevenue.toFixed(2)}`
              }
              colorClass="text-amber-500"
              highlight={true}
            />

            {/* NOUVEAU : Pourboires (Ce qui appartient au Barbier) */}
            <StatCard
              icon={DollarSign}
              label={`Mes Pourboires (${statsPeriod.toUpperCase()})`}
              value={
                isStatsLoading
                  ? "..."
                  : `DZD ${statsData.summary.totalTips.toFixed(2)}`
              }
              colorClass="text-green-400"
              highlight={true}
            />

            <StatCard
              icon={Scissors}
              label={`Clients Coupés (${statsPeriod.toUpperCase()})`}
              value={isStatsLoading ? "..." : statsData.summary.totalClients}
              colorClass="text-slate-100"
            />
          </div>

          <DataTable
            title="Mes Factures Validées (Caisse Centrale)"
            headers={[
              { label: "Ref" },
              { label: "Client" },
              { label: "Prestation" },
              { label: "Pourboire", align: "right" },
              { label: "Prix Total", align: "right" },
            ]}
          >
            {isStatsLoading ? (
              <tr>
                <td
                  colSpan="4"
                  className="py-10 text-center animate-pulse text-amber-500"
                >
                  Calcul...
                </td>
              </tr>
            ) : statsData.history.length > 0 ? (
              statsData.history.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-slate-800/80 hover:bg-slate-800/40"
                >
                  <td className="px-6 py-4 font-mono font-bold text-slate-500 text-xs uppercase tracking-wider">
                    #{t.id}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-200 uppercase text-xs">
                    {t.client}
                  </td>
                  <td className="px-6 py-4 text-slate-300 italic text-xs">
                    {t.service}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-green-400 text-xs">
                    {t.tip > 0 ? `+ DZD ${Number(t.tip).toFixed(2)}` : "--"}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-amber-400">
                    DZD {Number(t.price).toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="text-center py-10 text-slate-600 font-bold uppercase tracking-widest text-xs"
                >
                  Aucune coupe pour cette période
                </td>
              </tr>
            )}
          </DataTable>
        </div>
      )}
      {/* 3. CHECKOUT MODAL */}
      <Modal
        isOpen={showServiceModal}
        onClose={() => !isProcessing && setShowServiceModal(false)}
      >
        <div className="p-8 max-h-[85vh] overflow-y-auto relative">
          <h2 className="text-2xl font-serif font-bold text-amber-500 mb-2 uppercase tracking-wider text-center">
            Service Finale
          </h2>
          <p className="text-xs uppercase text-slate-500 tracking-widest font-bold text-center border-b border-slate-800 pb-6 mb-6">
            Build Bill for Register
          </p>

          {/* STEP A: Select primary Service */}
          <div className="mb-8">
            <h3 className="text-sm font-bold tracking-widest uppercase text-slate-100 mb-4 bg-slate-900 py-2 px-3 border border-slate-800">
              1. Type de Coupe *
            </h3>
            {availableServices.length === 0 && (
              <p className="text-xs text-red-500 italic font-mono">
                ⚠️ No Services Found in DB.
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableServices.map((service) => {
                const isSelected = selectedService?.id === service.id;
                return (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`p-4 border transition-all text-left group flex flex-col justify-between min-h-[100px] ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                        : "border-slate-800 bg-slate-950 hover:border-slate-600"
                    }`}
                  >
                    <p className="font-bold text-slate-200 uppercase tracking-tight leading-tight">
                      {service.name}
                    </p>
                    <p
                      className={`text-xl font-mono mt-2 font-bold ${isSelected ? "text-amber-500" : "text-slate-500 group-hover:text-slate-400"}`}
                    >
                      ${Number(service.price).toFixed(2)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP B: Add Products */}
          <div className="mb-10">
            <h3 className="text-sm font-bold tracking-widest uppercase text-slate-100 mb-4 bg-slate-900 py-2 px-3 border border-slate-800">
              2. Vente de Produits (Opt.)
            </h3>
            {availableProducts.length === 0 && (
              <p className="text-xs text-slate-500 italic font-mono">
                No retail products logged.
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableProducts.map((product) => {
                const isSelected = selectedProducts.find(
                  (p) => p.id === product.id,
                );
                return (
                  <button
                    key={product.id}
                    onClick={() => handleToggleProduct(product)}
                    className={`p-3 border transition-all text-left flex items-center justify-between ${
                      isSelected
                        ? "border-green-500/50 bg-green-500/10 text-green-400"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                    }`}
                  >
                    <span className="font-bold uppercase tracking-tight text-xs truncate max-w-[70%]">
                      {product.name}
                    </span>
                    <span className="font-mono text-sm font-bold">
                      ${Number(product.salePrice).toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FINAL STEP: Summary & Submit */}
          <div className="pt-6 border-t-2 border-slate-800 flex justify-between items-end mb-6">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                Total Sending to Checkout:
              </p>
              {selectedService ? (
                <p className="text-4xl font-bold font-mono text-amber-500 leading-none">
                  DZD
                  {(
                    Number(selectedService.price) +
                    selectedProducts.reduce(
                      (sum, p) => sum + Number(p.salePrice),
                      0,
                    )
                  ).toFixed(2)}
                </p>
              ) : (
                <p className="text-3xl font-mono text-slate-700 leading-none">
                  DZD 0.00
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowServiceModal(false)}
              disabled={isProcessing}
              className="py-5 text-xs"
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleCompleteService}
              disabled={isProcessing || !selectedService}
              className="py-5 shadow-lg shadow-amber-500/20 text-xs"
            >
              {isProcessing ? "Transmitting..." : "Send To Register"}
            </Button>
          </div>
        </div>
      </Modal>
      {/* ... [Insert Modal from your previous code here] ... */}
    </div>
  );
}
