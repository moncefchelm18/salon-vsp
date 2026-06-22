import { useState, useEffect } from "react";
import {
  Plus,
  Users,
  Clock,
  CheckCircle,
  RefreshCcw,
  Edit,
} from "lucide-react"; // <-- Add Edit icon
import { toast } from "react-hot-toast";
import api from "../../utils/api";

// Imports from the common folder
import StatCard from "../common/StatCard";
import Button from "../common/Button";
import DataTable from "../common/DataTable";
import StatusBadge from "../common/StatusBadge";
import Modal from "../common/Modal"; // <-- Add Modal import

export default function ClientsManager() {
  const [tickets, setTickets] = useState([]);
  const [barbers, setBarbers] = useState([]);

  // Create Form States
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [selectedBarber, setSelectedBarber] = useState("");

  // Reassignment Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [ticketToEdit, setTicketToEdit] = useState(null);
  const [newBarberId, setNewBarberId] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [registeredClients, setRegisteredClients] = useState([]);
  const [selectedRegisteredClient, setSelectedRegisteredClient] = useState("");

  // --- DATA FETCHING ---
  const loadData = async () => {
    try {
      const [barbersRes, liveRes, historyRes, clientsRes] = await Promise.all([
        api.get("/barbers"),
        api.get("/tickets/live"),
        api.get("/tickets/history"),
        api.get("/clients"),
      ]);

      setBarbers(barbersRes.data);
      setRegisteredClients(clientsRes.data);

      const normalizedHistory = historyRes.data.map((t) => ({
        ...t,
        time: new Date(t.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

      const combinedTickets = [...liveRes.data, ...normalizedHistory].sort(
        (a, b) => b.id - a.id,
      );
      setTickets(combinedTickets);
    } catch (error) {
      toast.error("Échec du chargement des données.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const syncInterval = setInterval(loadData, 5000);
    return () => clearInterval(syncInterval);
  }, []);

  // --- ACTIONS ---
  const handleAddTicket = async () => {
    if (!selectedBarber)
      return toast.error("Veuillez sélectionner un barbier.");
    setIsSubmitting(true);
    try {
      await api.post("/tickets", {
        clientName: clientName || "Client Sans RDV",
        phone: clientPhone || null,
        barberId: Number(selectedBarber),
        clientId: selectedRegisteredClient
          ? Number(selectedRegisteredClient)
          : null, // <-- NOUVEAU
      });

      toast.success("Ticket généré !");
      setClientName("");
      setClientPhone("");
      setSelectedBarber("");
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur de création");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelTicket = async (ticketId, clientName) => {
    if (window.confirm(`Confirmer l'annulation pour ${clientName} ?`)) {
      try {
        await api.delete(`/tickets/${ticketId}`);
        toast.success(`Ticket de ${clientName} annulé.`);
        loadData();
      } catch (err) {
        toast.error("Erreur lors de l'annulation.");
      }
    }
  };

  // --- REASSIGNMENT ACTIONS ---
  const openEditModal = (ticket) => {
    setTicketToEdit(ticket);
    // Find the original barber ID from our fetched barbers list to pre-select it
    const originalBarber = barbers.find((b) => b.name === ticket.barber);
    setNewBarberId(originalBarber ? originalBarber.id : "");
    setIsEditModalOpen(true);
  };

  const handleReassignTicket = async () => {
    if (!newBarberId)
      return toast.error("Veuillez sélectionner un nouveau barbier.");
    setIsSubmitting(true);

    try {
      await api.put(`/tickets/${ticketToEdit.id}/reassign`, {
        barberId: newBarberId,
      });
      toast.success("Client réassigné avec succès.");
      setIsEditModalOpen(false);
      setTicketToEdit(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur de réassignation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ... (Stat Cards stay the same) ... */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Clients du Jour"
          value={tickets.length}
          icon={Users}
          colorClass="text-slate-100"
        />
        <StatCard
          label="En Attente / En Cours"
          value={
            tickets.filter(
              (t) => t.status === "waiting" || t.status === "in-progress",
            ).length
          }
          icon={Clock}
          colorClass="text-amber-500"
        />
        <StatCard
          label="Prestations Terminées"
          value={tickets.filter((t) => t.status === "completed").length}
          icon={CheckCircle}
          colorClass="text-green-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ... (Add Form stays the same) ... */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 self-start h-fit relative">
          {isSubmitting && (
            <div className="absolute inset-0 bg-slate-900/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
              <RefreshCcw className="animate-spin text-amber-500" />
            </div>
          )}
          <h2 className="text-xl font-serif font-bold text-amber-400 mb-6 uppercase tracking-widest">
            Nouveau Client
          </h2>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Type de Client
              </label>
              <select
                value={selectedRegisteredClient}
                onChange={(e) => {
                  setSelectedRegisteredClient(e.target.value);
                  if (e.target.value) {
                    const c = registeredClients.find(
                      (c) => c.id.toString() === e.target.value,
                    );
                    setClientName(c.name);
                  } else {
                    setClientName("");
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 px-4 py-3 focus:border-amber-500 focus:outline-none transition-colors appearance-none rounded-none font-bold uppercase text-[10px] mb-3"
              >
                <option value="">
                  -- Client de passage (Non enregistré) --
                </option>
                {registeredClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </option>
                ))}
              </select>

              {!selectedRegisteredClient && (
                <>
                  <input
                    placeholder="Saisir un nom manuel (Ex: Amine)"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 px-4 py-3 focus:border-amber-500 focus:outline-none transition-colors rounded-none placeholder:text-slate-600 mb-3"
                  />
                  <input
                    placeholder="Téléphone (Opt.)"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 px-4 py-3 focus:border-amber-500 focus:outline-none transition-colors rounded-none placeholder:text-slate-600"
                  />
                </>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Barbier Assigné *
              </label>
              <select
                value={selectedBarber}
                onChange={(e) => setSelectedBarber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 px-4 py-3 focus:border-amber-500 focus:outline-none transition-colors appearance-none rounded-none font-bold uppercase tracking-widest text-[10px]"
              >
                <option value="">Sélectionner...</option>
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="pt-4 border-t border-slate-800">
              <Button
                variant="primary"
                fullWidth
                onClick={handleAddTicket}
                disabled={isSubmitting}
                className="py-4 shadow-lg shadow-amber-500/10"
              >
                {isSubmitting ? (
                  "Traitement..."
                ) : (
                  <>
                    <Plus className="w-5 h-5" /> Imprimer Ticket
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* --- TABLE: CLIENTS LOG --- */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="p-12 text-center text-amber-500 animate-pulse uppercase tracking-widest text-sm font-bold">
              Synchronisation...
            </div>
          ) : (
            <DataTable
              headers={[
                { label: "Réf" },
                { label: "Client" },
                { label: "Téléphone" },
                { label: "Assigné à" },
                { label: "Arrivée" },
                { label: "Statut" },
                { label: "Actions", align: "right" },
              ]}
            >
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4 text-slate-500 font-mono font-bold text-xs uppercase">
                      #{ticket.id}
                    </td>
                    <td className="px-6 py-4 text-slate-100 font-bold uppercase tracking-tight text-xs">
                      {ticket.clientName}
                    </td>
                    <td className="px-6 py-4 text-slate-400 tracking-wider font-mono text-[10px]">
                      {ticket.phone || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-300 uppercase text-[10px] font-bold tracking-widest">
                      {ticket.barber}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                      {ticket.time}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={ticket.status} />
                    </td>

                    {/* --- ACTION BUTTONS --- */}
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      {ticket.status === "waiting" && (
                        <Button
                          variant="outline"
                          onClick={() => openEditModal(ticket)}
                          className="py-2 px-3 text-[10px]"
                          title="Réassigner à un autre barbier"
                        >
                          <Edit size={12} />
                        </Button>
                      )}

                      {["waiting", "in-progress"].includes(ticket.status) && (
                        <Button
                          variant="ghost"
                          onClick={() =>
                            handleCancelTicket(ticket.id, ticket.clientName)
                          }
                          className="text-red-500 hover:text-red-400 hover:bg-red-950/20 py-2 px-3 text-[10px]"
                        >
                          Annuler
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-12 text-slate-500 font-bold uppercase tracking-widest text-xs"
                  >
                    Aucun ticket aujourd'hui
                  </td>
                </tr>
              )}
            </DataTable>
          )}
        </div>
      </div>

      {/* --- REASSIGNMENT MODAL --- */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <div className="p-8">
          <h3 className="text-xl font-serif font-bold text-amber-500 mb-2 uppercase tracking-wider text-center">
            Changer de Barbier
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center border-b border-slate-800 pb-4 mb-6">
            Client: {ticketToEdit?.clientName} (Ref #{ticketToEdit?.id})
          </p>

          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Transférer à :
            </label>
            <select
              value={newBarberId}
              onChange={(e) => setNewBarberId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 px-4 py-4 focus:border-amber-500 focus:outline-none transition-colors appearance-none rounded-none font-bold uppercase tracking-widest text-xs"
            >
              <option value="">-- Sélectionner un Barbier --</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {ticketToEdit?.barber === b.name ? "(Actuel)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 mt-8 pt-6 border-t border-slate-800">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
              className="py-4 text-xs"
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleReassignTicket}
              disabled={isSubmitting || !newBarberId}
              className="py-4 shadow-lg text-xs"
            >
              Confirmer Transfert
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
