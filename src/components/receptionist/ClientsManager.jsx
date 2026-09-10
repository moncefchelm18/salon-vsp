import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Users,
  Clock,
  CheckCircle,
  RefreshCcw,
  Edit,
  CalendarDays,
  Crown,
  PlayCircle,
  Scissors,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";
import VirtualKeyboard from "../common/VirtualKeyboard";

// Imports UI
import StatCard from "../common/StatCard";
import Button from "../common/Button";
import DataTable from "../common/DataTable";
import StatusBadge from "../common/StatusBadge";
import Modal from "../common/Modal";
import ThermalReceipt from "../common/ThermalReceipt";

export default function ClientsManager() {
  const [tickets, setTickets] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [postes, setPostes] = useState([]);
  const [registeredClients, setRegisteredClients] = useState([]);

  // --- FORM STATES ---
  const [formMode, setFormMode] = useState("walkin"); // 'walkin' ou 'reservation'

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [selectedRegisteredClient, setSelectedRegisteredClient] = useState("");
  const [selectedBarber, setSelectedBarber] = useState("");

  const [reservationDate, setReservationDate] = useState("");
  const [reservationTime, setReservationTime] = useState("");
  const [selectedPoste, setSelectedPoste] = useState("");

  // Reassignment Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [ticketToEdit, setTicketToEdit] = useState(null);
  const [newBarberId, setNewBarberId] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- PRINT STATES ---
  const [printData, setPrintData] = useState(null);
  const [printTrigger, setPrintTrigger] = useState(0);

  const [showKeyboard, setShowKeyboard] = useState(false);
  const [focusedInput, setFocusedInput] = useState("clientName");
  const keyboardRef = useRef(null);

  const handleInputFocus = (inputName, currentValue) => {
    setFocusedInput(inputName);
    setShowKeyboard(true);
    if (keyboardRef.current) {
      keyboardRef.current.setInput(currentValue);
    }
  };

  const handleKeyboardChange = (inputVal) => {
    if (focusedInput === "clientName") {
      setClientName(inputVal);
    } else if (focusedInput === "clientPhone") {
      setClientPhone(inputVal);
    }
  };

  const handlePhysicalInputChange = (e, setter) => {
    const val = e.target.value;
    setter(val);
    if (keyboardRef.current) {
      keyboardRef.current.setInput(val);
    }
  };

  // --- DATA FETCHING ---
  const loadData = async () => {
    try {
      const [barbersRes, liveRes, historyRes, clientsRes, postesRes] =
        await Promise.all([
          api.get("/barbers"),
          api.get("/tickets/live"),
          api.get("/tickets/history"),
          api.get("/clients"),
          api.get("/postes"),
        ]);

      setBarbers(barbersRes.data);
      setRegisteredClients(clientsRes.data);
      setPostes(postesRes.data);

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

  // --- CREATION TICKET ---
  const handleAddTicket = async () => {
    let finalBarberId = selectedBarber;

    if (formMode === "reservation") {
      if (!reservationDate || !reservationTime)
        return toast.error("La date et l'heure du RDV sont obligatoires.");
      if (!selectedPoste) return toast.error("Veuillez assigner un Poste VIP.");

      const lePosteVip = postes.find((p) => p.id.toString() === selectedPoste);
      if (lePosteVip) {
        const leCoiffeurDuPoste = barbers.find(
          (b) => b.poste === lePosteVip.number,
        );
        if (leCoiffeurDuPoste) {
          finalBarberId = leCoiffeurDuPoste.id.toString();
        } else {
          return toast.error(
            `Erreur: Aucun coiffeur n'est assigné au Poste ${lePosteVip.number}.`,
          );
        }
      }
    } else {
      if (!selectedBarber)
        return toast.error("Veuillez sélectionner un barbier.");
    }

    setIsSubmitting(true);
    try {
      let fullDateTime = null;
      if (formMode === "reservation") {
        fullDateTime = new Date(
          `${reservationDate}T${reservationTime}:00`,
        ).toISOString();
      }

      const response = await api.post("/tickets", {
        clientName: clientName || "--",
        phone: clientPhone || null,
        barberId: Number(finalBarberId),
        clientId: selectedRegisteredClient
          ? Number(selectedRegisteredClient)
          : null,
        isReservation: formMode === "reservation",
        reservationDate: fullDateTime,
        posteId: selectedPoste ? Number(selectedPoste) : null,
      });

      const createdTicket = response.data;
      const assignedBarber = barbers.find(
        (b) => b.id === Number(finalBarberId),
      );

      setPrintData({
        id: createdTicket.id,
        queueNumber: createdTicket.queueNumber,
        clientName: createdTicket.clientName,
        barber: assignedBarber ? assignedBarber.name : "Coiffeur",
        poste: assignedBarber ? assignedBarber.poste : "--",
      });
      setPrintTrigger((prev) => prev + 1);

      toast.success(
        formMode === "reservation"
          ? "Réservation enregistrée !"
          : "Ticket généré et imprimé !",
      );

      setClientName("");
      setClientPhone("");
      setSelectedBarber("");
      setSelectedRegisteredClient("");
      setReservationDate("");
      setReservationTime("");
      setSelectedPoste("");
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur de création");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClientArrived = async (ticketId, clientName) => {
    if (!window.confirm(`Installer ${clientName} directement au poste ?`))
      return;
    setIsSubmitting(true);
    try {
      await api.patch(`/tickets/${ticketId}/arrive`);
      toast.success(`${clientName} est installé au poste !`);
      loadData();
    } catch (err) {
      toast.error("Erreur de transfert.");
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

  const openEditModal = (ticket) => {
    setTicketToEdit(ticket);
    const originalBarber = barbers.find((b) => b.name === ticket.barber);
    setNewBarberId(originalBarber ? originalBarber.id : "");
    setIsEditModalOpen(true);
  };

  // Dans ClientsManager.jsx -> handleReassignTicket

  const handleReassignTicket = async () => {
    if (!newBarberId)
      return toast.error("Veuillez sélectionner un nouveau barbier.");
    setIsSubmitting(true);
    try {
      const res = await api.put(`/tickets/${ticketToEdit.id}/reassign`, {
        barberId: newBarberId,
      });

      const updatedTicket = res.data.ticket;
      const newBarber = barbers.find(
        (b) => b.id.toString() === newBarberId.toString(),
      );

      // ── IMPRESSION AUTOMATIQUE DU TICKET MIS À JOUR ──
      setPrintData({
        id: updatedTicket.id,
        queueNumber: updatedTicket.queueNumber, // Garde le même numéro !
        clientName: updatedTicket.clientName,
        barber: newBarber ? newBarber.name : "Coiffeur",
        poste: newBarber ? newBarber.poste : "--", // Met à jour le nouveau poste
      });
      setPrintTrigger((prev) => prev + 1); // Déclenche l'imprimante thermique
      // ────────────────────────────────────────────────

      toast.success(
        `Client réassigné à ${newBarber?.name || "nouveau barbier"} ! Ticket réimprimé.`,
      );
      setIsEditModalOpen(false);
      setTicketToEdit(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur de réassignation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reservations = tickets.filter((t) => t.status === "reserved");
  const liveQueue = tickets.filter((t) => t.status !== "reserved");

  const barbersStatus = barbers.map((barber) => {
    const myTickets = tickets.filter((t) => t.barberId === barber.id);
    const isInProgress = myTickets.some((t) => t.status === "in-progress");
    const waitingCount = myTickets.filter((t) => t.status === "waiting").length;
    const completedToday = myTickets.filter(
      (t) => t.status === "completed",
    ).length;

    // MODIFIÉ : Le coiffeur est occupé s'il a quelqu'un en fauteuil OU s'il a du monde en attente !
    const isBusy = isInProgress || waitingCount > 0;

    return {
      ...barber,
      isBusy,
      waitingCount,
      completedToday,
    };
  });

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* ── 1. STAT CARDS DU HAUT (3 colonnes compactes) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Clients du Jour"
          value={tickets.length}
          icon={Users}
          colorClass="text-t-main"
        />
        <StatCard
          label="En Attente / En Cours"
          value={
            tickets.filter(
              (t) => t.status === "waiting" || t.status === "in-progress",
            ).length
          }
          icon={Clock}
          colorClass="text-brand"
        />
        <StatCard
          label="Réservations (À venir)"
          value={reservations.length}
          icon={Crown}
          colorClass="text-amber-500"
        />
      </div>

      {/* ── 2. BLOC CENTRAL : FORMULAIRE (GAUCHE) & BARBIERS LIVE (DROITE) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* FORMULAIRE GAUCHE (5 colonnes) */}
        <div className="lg:col-span-5 bg-surface border border-subtle p-5 shadow-sm relative min-w-0">
          {isSubmitting && (
            <div className="absolute inset-0 bg-surface/80 z-10 flex items-center justify-center backdrop-blur-[1px]">
              <RefreshCcw className="animate-spin text-brand" />
            </div>
          )}

          {/* Onglets Walk-in / Reservation */}
          <div className="flex gap-2 mb-4 border-b border-subtle pb-3">
            <button
              onClick={() => setFormMode("walkin")}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                formMode === "walkin"
                  ? "bg-brand text-white shadow-md"
                  : "bg-main text-t-muted hover:text-t-main border border-subtle"
              }`}
            >
              Passage (Walk-In)
            </button>
            <button
              onClick={() => setFormMode("reservation")}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors flex justify-center items-center gap-1.5 ${
                formMode === "reservation"
                  ? "bg-amber-500 text-white shadow-md"
                  : "bg-main text-t-muted hover:text-t-main border border-subtle"
              }`}
            >
              <Crown size={14} /> VIP / RDV
            </button>
          </div>

          <div className="space-y-3">
            {/* Sélection / Saisie Client */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-t-muted mb-1">
                Identification
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
                    setClientPhone(c.phone || "");
                  } else {
                    setClientName("");
                    setClientPhone("");
                  }
                }}
                className="w-full bg-main border border-subtle text-t-main px-3 py-2.5 focus:outline-none focus:border-brand font-bold uppercase text-[10px] mb-2"
              >
                <option value="">-- Client Non Enregistré --</option>
                {registeredClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </option>
                ))}
              </select>

              {!selectedRegisteredClient && (
                <div className="flex gap-2">
                  <input
                    placeholder="Nom (Ex: Amine)"
                    value={clientName}
                    onFocus={() => handleInputFocus("clientName", clientName)}
                    onChange={(e) =>
                      handlePhysicalInputChange(e, setClientName)
                    }
                    className="w-1/2 bg-main border border-subtle text-t-main px-3 py-2 focus:outline-none focus:border-brand text-xs font-bold"
                  />
                  <input
                    placeholder="Tél (Optionnel)"
                    value={clientPhone}
                    onFocus={() => handleInputFocus("clientPhone", clientPhone)}
                    onChange={(e) =>
                      handlePhysicalInputChange(e, setClientPhone)
                    }
                    className="w-1/2 bg-main border border-subtle text-t-main px-3 py-2 focus:outline-none focus:border-brand text-xs font-mono"
                  />
                </div>
              )}
            </div>

            {/* Choix du coiffeur (Walk-in) */}
            {formMode === "walkin" && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-t-muted mb-1">
                  Barbier Assigné *
                </label>
                <select
                  value={selectedBarber}
                  onChange={(e) => setSelectedBarber(e.target.value)}
                  className="w-full bg-main border border-subtle text-t-main px-3 py-2.5 focus:outline-none focus:border-brand font-bold uppercase tracking-wider text-xs"
                >
                  <option value="">-- Sélectionner Coiffeur --</option>
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.poste ? `(Poste ${b.poste})` : "(Sans Poste)"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Champs Spécifiques VIP */}
            {formMode === "reservation" && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 space-y-3 animate-in fade-in duration-150">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5 border-b border-amber-500/20 pb-1.5">
                  <CalendarDays size={13} /> Planification Rendez-vous
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-amber-500/80 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={reservationDate}
                      onChange={(e) => setReservationDate(e.target.value)}
                      className="w-full bg-surface border border-amber-500/50 text-t-main px-2 py-1.5 text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-amber-500/80 mb-1">
                      Heure *
                    </label>
                    <input
                      type="time"
                      value={reservationTime}
                      onChange={(e) => setReservationTime(e.target.value)}
                      className="w-full bg-surface border border-amber-500/50 text-t-main px-2 py-1.5 text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase text-amber-500/80 mb-1">
                    Poste Réservé *
                  </label>
                  <select
                    value={selectedPoste}
                    onChange={(e) => setSelectedPoste(e.target.value)}
                    className="w-full bg-surface border border-amber-500/50 text-t-main px-2 py-2 text-[10px] font-bold uppercase focus:outline-none"
                  >
                    <option value="">-- Assigner un Poste --</option>
                    {postes.map((p) => {
                      const barberOccupant = barbers.find(
                        (b) => b.poste === p.number,
                      );
                      return (
                        <option key={p.id} value={p.id}>
                          {p.isVip ? "⭐ " : ""}Poste N°{p.number}{" "}
                          {p.description ? `(${p.description})` : ""}{" "}
                          {barberOccupant
                            ? `[${barberOccupant.name}]`
                            : "[VIDE]"}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-subtle">
              <Button
                variant={formMode === "reservation" ? "primary" : "success"}
                fullWidth
                onClick={handleAddTicket}
                disabled={isSubmitting}
                className={`py-3.5 shadow-md ${
                  formMode === "reservation"
                    ? "bg-amber-500 hover:bg-amber-400 text-white"
                    : ""
                }`}
              >
                {isSubmitting
                  ? "Traitement..."
                  : formMode === "reservation"
                    ? "Enregistrer Réservation"
                    : "Générer Ticket"}
              </Button>
            </div>
          </div>
        </div>

        {/* BARBIERS EN DIRECT DROITE (7 colonnes, grille compacte avec ascenseur) */}
        <div className="lg:col-span-7 bg-surface border border-subtle p-5 shadow-sm flex flex-col justify-between min-w-0">
          <div className="flex justify-between items-center mb-3 border-b border-subtle pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-t-muted flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full bg-brand opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 bg-brand"></span>
              </span>
              Disponibilité en direct ({barbersStatus.length} barbiers)
            </h3>
            <span className="text-[10px] text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-0.5 font-bold uppercase tracking-wider">
              {barbersStatus.filter((b) => !b.isBusy).length} Libre(s)
            </span>
          </div>

          {/* Grille responsive scrollable verticalement si plus de 6-8 barbiers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 overflow-y-auto max-h-[305px] pr-1">
            {barbersStatus.map((b) => (
              <div
                key={b.id}
                className="bg-main border border-subtle p-2.5 flex flex-col justify-between relative overflow-hidden group shadow-sm"
              >
                <div
                  className={`absolute top-0 left-0 w-full h-1 ${
                    b.isBusy ? "bg-red-500" : "bg-green-500"
                  }`}
                />

                <div className="flex items-center gap-2.5">
                  <div className="relative shrink-0">
                    {b.image ? (
                      <img
                        src={b.image}
                        alt={b.name}
                        className={`w-9 h-9 rounded-full object-cover border-2 shrink-0 ${b.isBusy ? "border-red-500" : "border-green-500"} shadow-sm transition-all`}
                      />
                    ) : (
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 shrink-0 shadow-sm ${b.isBusy ? "bg-red-950 border-red-500" : "bg-green-950 border-green-500"}`}
                      >
                        <span
                          className={`text-sm font-black uppercase ${b.isBusy ? "text-red-500" : "text-green-500"}`}
                        >
                          {b.name ? b.name.charAt(0) : "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-t-main text-xs uppercase truncate">
                      {b.name}
                    </p>
                    <p className="text-[9px] text-t-muted font-bold uppercase">
                      Poste {b.poste || "?"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-subtle/50">
                  <span
                    className={`text-[9px] font-bold uppercase ${
                      b.waitingCount > 0 ? "text-amber-500" : "text-t-muted"
                    }`}
                  >
                    {b.waitingCount} Attente
                  </span>
                  <span
                    className={`text-[8px] font-bold uppercase px-1.5 py-0.5 border ${
                      b.isBusy
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-green-500/10 text-green-500 border-green-500/20"
                    }`}
                  >
                    {b.isBusy ? "Occupé" : "Libre"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. BLOC DU BAS : TOUS LES TABLEAUX EN PLEINE LARGEUR (100% WIDTH) ── */}
      <div className="w-full space-y-6 min-w-0">
        {/* Table Réservations VIP (si existantes) */}
        {reservations.length > 0 && (
          <div className="bg-surface border-2 border-amber-500 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-500 text-white px-3 py-1 font-bold text-[10px] uppercase tracking-widest shadow-sm">
              Accès Prioritaire
            </div>
            <div className="p-4 border-b border-amber-500/30 bg-amber-500/5">
              <h3 className="font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                <Crown size={18} /> Rendez-vous &amp; VIP
              </h3>
            </div>

            <DataTable
              headers={[
                { label: "Client" },
                { label: "Coiffeur" },
                { label: "Date & Heure" },
                { label: "Poste VIP" },
                { label: "Actions", align: "right" },
              ]}
            >
              {reservations.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b border-subtle hover:bg-amber-500/5"
                >
                  <td className="px-6 py-4 text-t-main font-bold uppercase text-sm">
                    {ticket.clientName}
                  </td>
                  <td className="px-6 py-4 text-t-muted uppercase text-xs font-bold">
                    {ticket.barber}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-amber-600">
                    {new Date(ticket.reservationDate).toLocaleDateString(
                      "fr-FR",
                    )}{" "}
                    à{" "}
                    {new Date(ticket.reservationDate).toLocaleTimeString(
                      "fr-FR",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-brand">
                    Poste {ticket.poste || "?"}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <Button
                      variant="danger"
                      onClick={() =>
                        handleCancelTicket(ticket.id, ticket.clientName)
                      }
                      className="py-1.5 px-3 text-xs"
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="success"
                      onClick={() =>
                        handleClientArrived(ticket.id, ticket.clientName)
                      }
                      className="py-1.5 px-3 text-xs shadow-md flex items-center gap-1"
                    >
                      <PlayCircle size={14} /> Installé
                    </Button>
                  </td>
                </tr>
              ))}
            </DataTable>
          </div>
        )}

        {/* Table de la File d'Attente (Sans RDV) - 100% de la largeur */}
        <div className="bg-surface border border-subtle min-w-0">
          <div className="p-4 border-b border-subtle flex justify-between items-center">
            <h3 className="font-bold text-t-main uppercase tracking-widest flex items-center gap-2">
              <Users size={18} className="text-brand" /> File d'attente (Sans
              RDV)
            </h3>
            <span className="text-[10px] font-mono text-t-muted font-bold">
              {liveQueue.length} clients enregistrés
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-brand animate-pulse uppercase tracking-widest text-sm font-bold">
              Synchronisation...
            </div>
          ) : (
            <DataTable
              headers={[
                { label: "N° Passage" },
                { label: "Client" },
                { label: "Téléphone" },
                { label: "Coiffeur" },
                { label: "Poste" },
                { label: "Arrivée" },
                { label: "Statut" },
                { label: "Actions", align: "right" },
              ]}
            >
              {liveQueue.length > 0 ? (
                liveQueue.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-subtle hover:bg-brand/5 transition-colors"
                  >
                    <td className="px-6 py-4 text-brand font-mono font-bold text-sm uppercase">
                      #{ticket.queueNumber || ticket.id}
                    </td>
                    <td className="px-6 py-4 text-t-main font-bold uppercase tracking-tight text-xs">
                      {ticket.clientName}
                    </td>
                    <td className="px-6 py-4 text-t-muted tracking-wider font-mono text-[10px]">
                      {ticket.phone || "-"}
                    </td>
                    <td className="px-6 py-4 text-brand uppercase text-[10px] font-bold tracking-widest">
                      {ticket.barber}
                    </td>
                    <td className="px-6 py-4 text-brand font-mono font-bold text-xs uppercase">
                      {ticket.poste
                        ? ticket.poste
                            .toString()
                            .toLowerCase()
                            .includes("poste")
                          ? ticket.poste
                          : `Poste ${ticket.poste}`
                        : "--"}
                    </td>
                    <td className="px-6 py-4 text-t-muted font-mono text-xs">
                      {ticket.time}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      {ticket.status === "waiting" && (
                        <Button
                          variant="secondary"
                          onClick={() => openEditModal(ticket)}
                          className="py-1.5 px-2.5 text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white"
                          title="Changer de barbier"
                        >
                          <Edit size={14} className="mr-1" /> Transférer
                        </Button>
                      )}
                      {["waiting", "in-progress"].includes(ticket.status) && (
                        <Button
                          variant="danger"
                          onClick={() =>
                            handleCancelTicket(ticket.id, ticket.clientName)
                          }
                          className="py-1.5 px-2.5 text-[10px]"
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
                    colSpan="8"
                    className="text-center py-12 text-t-muted font-bold uppercase tracking-widest text-xs border border-subtle border-dashed m-4"
                  >
                    Aucun ticket en attente
                  </td>
                </tr>
              )}
            </DataTable>
          )}
        </div>
      </div>

      {/* --- MODAL DE RÉASSIGNATION --- */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <div className="p-8">
          <h3 className="text-xl font-serif font-bold text-brand mb-2 uppercase tracking-wider text-center">
            Changer de Barbier
          </h3>
          <p className="text-[10px] text-t-muted font-bold uppercase tracking-widest text-center border-b border-subtle pb-4 mb-6">
            Client: {ticketToEdit?.clientName} (Ref #{ticketToEdit?.id})
          </p>

          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-t-muted mb-2">
              Transférer à :
            </label>
            <select
              value={newBarberId}
              onChange={(e) => setNewBarberId(e.target.value)}
              className="w-full bg-main border border-subtle text-t-main px-4 py-4 focus:outline-none focus:border-brand font-bold uppercase tracking-widest text-xs"
            >
              <option value="">-- Sélectionner un Barbier --</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {ticketToEdit?.barber === b.name ? "(Actuel)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 mt-8 pt-6 border-t border-subtle">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
              className="py-4 font-bold text-xs"
            >
              Annuler
            </Button>
            <Button
              variant="success"
              fullWidth
              onClick={handleReassignTicket}
              disabled={isSubmitting || !newBarberId}
              className="py-4 font-bold shadow-lg text-xs"
            >
              Confirmer Transfert
            </Button>
          </div>
        </div>
      </Modal>

      {/* Impression Thermique */}
      <ThermalReceipt
        type="queue"
        data={printData}
        printTrigger={printTrigger}
      />

      {/* Clavier Virtuel Tactile */}
      <VirtualKeyboard
        isOpen={showKeyboard}
        onClose={() => setShowKeyboard(false)}
        value={focusedInput === "clientName" ? clientName : clientPhone}
        onChange={handleKeyboardChange}
        label={
          focusedInput === "clientName"
            ? "Saisie tactile : Nom du Client"
            : "Saisie tactile : Téléphone"
        }
      />
    </div>
  );
}
