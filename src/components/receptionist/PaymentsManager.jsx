import { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

import Button from "../common/Button";

// --- SOUS-COMPOSANTS DÉCOUPÉS ---
import PaymentsQueue from "./payments/PaymentsQueue";
import PaymentsHistory from "./payments/PaymentsHistory";
import CheckoutModal from "./payments/CheckoutModal";
import TicketReceiptModal from "./payments/TicketReceiptModal";

export default function PaymentsManager() {
  const [tickets, setTickets] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // States pour la modale de facturation
  const [showPayModal, setShowPayModal] = useState(false);
  const [ticketToPay, setTicketToPay] = useState(null);
  const [priceToPay, setPriceToPay] = useState(0);

  const [discountType, setDiscountType] = useState(null);
  const [discountValue, setDiscountValue] = useState(0);

  // States menu café
  const [showPOSModal, setShowPOSModal] = useState(false);
  const [cafeCategories, setCafeCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [addedCafeItems, setAddedCafeItems] = useState([]);

  // States Numpad
  const [showNumpadModal, setShowNumpadModal] = useState(false);
  const [numpadValue, setNumpadValue] = useState("0");
  const [tipAmount, setTipAmount] = useState(0);
  const [numpadTarget, setNumpadTarget] = useState("price");
  const [ticketForPostTip, setTicketForPostTip] = useState(null);

  // States reçus / historique
  const [showViewModal, setShowViewModal] = useState(false);
  const [ticketToView, setTicketToView] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBarber, setFilterBarber] = useState("all");

  // States Crédit Client
  const [registeredClients, setRegisteredClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [paidAmountInput, setPaidAmountInput] = useState("0");
  const [isCreatingNewClient, setIsCreatingNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  // States Vente Manuelle Directe
  const [availableServices, setAvailableServices] = useState([]);
  const [manualBarberId, setManualBarberId] = useState("");
  const [manualService, setManualService] = useState(null);
  const [manualClientName, setManualClientName] = useState("Client de passage");
  const [manualPhone, setManualPhone] = useState("");

  const loadData = async () => {
    try {
      const [
        barberRes,
        liveRes,
        historyRes,
        cafeMenuRes,
        clientRes,
        servicesRes,
      ] = await Promise.all([
        api.get("/barbers"),
        api.get("/tickets/live"),
        api.get("/tickets/history"),
        api.get("/cafe/menu"),
        api.get("/clients"),
        api.get("/services"),
      ]);

      setBarbers(barberRes.data);
      setCafeCategories(cafeMenuRes.data);
      setRegisteredClients(clientRes.data);
      setAvailableServices(servicesRes.data);
      if (cafeMenuRes.data.length > 0)
        setActiveCategory(cafeMenuRes.data[0].id);

      const combined = [...liveRes.data, ...historyRes.data].sort(
        (a, b) => b.id - a.id,
      );
      setTickets(combined);
    } catch (error) {
      toast.error("Échec de synchronisation de la caisse.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const pendingPayments = tickets.filter((t) => t.status === "ready-to-pay");

  const completedPaymentsHistory = useMemo(() => {
    return tickets
      .filter((t) => t.status === "completed")
      .filter((ticket) => {
        if (filterBarber !== "all" && ticket.barber !== filterBarber)
          return false;
        if (
          searchTerm &&
          !ticket.clientName.toLowerCase().includes(searchTerm.toLowerCase())
        )
          return false;
        return true;
      });
  }, [tickets, searchTerm, filterBarber]);

  const totalRevenueToday = completedPaymentsHistory.reduce(
    (total, ticket) => total + (ticket.price || 0),
    0,
  );

  // --- ACTIONS ---
  const handleOpenPayModal = (ticket) => {
    setTicketToPay(ticket);
    setPriceToPay(ticket.price || 0);
    setDiscountType(null);
    setDiscountValue(0);
    setAddedCafeItems([]);
    setTipAmount(0);
    setShowPOSModal(false);
    setShowPayModal(true);
    setIsPartialPayment(false);
    setSelectedClientId(ticket.clientId ? ticket.clientId.toString() : "");
    setPaidAmountInput("0");
  };

  const handleOpenManualPayModal = () => {
    setManualBarberId("");
    setManualService(null);
    setManualClientName("Client de passage");
    setManualPhone("");
    handleOpenPayModal({
      id: 0,
      clientName: "Client de passage",
      barber: "",
      barberId: "",
      service: "",
      price: 0,
      status: "ready-to-pay",
      cafeOrders: [],
    });
  };

  const handleVoidPayment = async (ticket) => {
    if (
      window.confirm(
        `Annuler la facture de ${ticket.clientName} ? Cette action enregistrera une perte de DZD ${ticket.price.toFixed(2)}.`,
      )
    ) {
      setIsProcessing(true);
      try {
        await api.delete(`/tickets/${ticket.id}`);
        toast.success(`Facture annulée.`);
        loadData();
      } catch (error) {
        toast.error("Impossible d'annuler.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleAddCafeItemFromTouchMenu = (product) => {
    setAddedCafeItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing)
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ];
    });
    toast.success(`${product.name} ajouté`, { id: "pos-add" });
  };

  const handleRemoveCafeItem = (id) =>
    setAddedCafeItems((prev) => prev.filter((item) => item.id !== id));

  const handleUpdateCafeItemQuantity = (id, delta) => {
    setAddedCafeItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean),
    );
  };

  const calculatedGrandTotal = useMemo(() => {
    const existingCafeTotal =
      ticketToPay?.cafeOrders?.reduce(
        (sum, order) => sum + order.totalPrice,
        0,
      ) || 0;
    const directDrinksTotal = addedCafeItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const subTotal = priceToPay + existingCafeTotal + directDrinksTotal;

    let discountAmount = 0;
    if (discountType === "percent")
      discountAmount = subTotal * (discountValue / 100);
    else if (discountType === "amount") discountAmount = discountValue;

    return Math.max(0, subTotal - discountAmount) + tipAmount;
  }, [
    priceToPay,
    ticketToPay,
    addedCafeItems,
    discountType,
    discountValue,
    tipAmount,
  ]);

  const handleConfirmPayment = async () => {
    if (!ticketToPay) return;
    if (ticketToPay.id === 0) {
      if (!manualBarberId)
        return toast.error("Veuillez sélectionner un coiffeur.");
      if (!manualService)
        return toast.error("Veuillez sélectionner une prestation.");
    }
    setIsProcessing(true);
    try {
      const existingCafeTotal =
        ticketToPay?.cafeOrders?.reduce(
          (sum, order) => sum + order.totalPrice,
          0,
        ) || 0;
      const directDrinksTotal = addedCafeItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      const subTotal = priceToPay + existingCafeTotal + directDrinksTotal;

      let discountAmount = 0;
      if (discountType === "percent")
        discountAmount = subTotal * (discountValue / 100);
      else if (discountType === "amount") discountAmount = discountValue;

      const finalGrandTotalWithoutTip = Math.max(0, subTotal - discountAmount);
      const finalHaircutPrice = Math.max(
        0,
        finalGrandTotalWithoutTip - existingCafeTotal - directDrinksTotal,
      );
      const actualPaid = isPartialPayment
        ? parseFloat(paidAmountInput)
        : finalGrandTotalWithoutTip;

      const payload = {
        totalPrice: finalHaircutPrice,
        additionalCafeItems: addedCafeItems,
        tip: tipAmount,
        clientId:
          isPartialPayment && selectedClientId
            ? Number(selectedClientId)
            : undefined,
        paidAmount: actualPaid,
      };

      if (ticketToPay.id === 0) {
        await api.post("/tickets/manual-pay", {
          ...payload,
          clientName: manualClientName,
          phone: manualPhone,
          barberId: Number(manualBarberId),
          serviceName: manualService.name,
        });
      } else {
        await api.patch(`/tickets/${ticketToPay.id}/pay`, payload);
      }

      toast.success(
        `Encaissement de DZD ${calculatedGrandTotal.toFixed(2)} validé !`,
      );
      setShowPayModal(false);
      setTicketToPay(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur d'encaissement.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickCreateClient = async () => {
    if (!newClientName.trim()) return toast.error("Nom du client obligatoire.");
    setIsProcessing(true);
    try {
      const res = await api.post("/clients", {
        name: newClientName,
        phone: newClientPhone,
      });
      setRegisteredClients((prev) =>
        [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSelectedClientId(res.data.id.toString());
      setIsCreatingNewClient(false);
      setNewClientName("");
      setNewClientPhone("");
      toast.success("Client enregistré !");
    } catch (error) {
      toast.error("Erreur de création.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNumpadSubmit = async () => {
    const val = parseFloat(numpadValue);
    if (isNaN(val) || val < 0) return toast.error("Montant invalide");

    if (numpadTarget === "discount-percent") {
      if (val > 100) return toast.error("La remise ne peut dépasser 100%");
      setDiscountType("percent");
      setDiscountValue(val);
      setShowNumpadModal(false);
    } else if (numpadTarget === "discount-amount") {
      setDiscountType("amount");
      setDiscountValue(val);
      setShowNumpadModal(false);
    } else if (numpadTarget === "tip") {
      setTipAmount(val);
      setShowNumpadModal(false);
    } else if (numpadTarget === "paid-amount") {
      if (val > calculatedGrandTotal)
        return toast.error("Le montant payé ne peut dépasser le total.");
      setPaidAmountInput(val.toString());
      setShowNumpadModal(false);
    } else if (numpadTarget === "post-tip") {
      setIsProcessing(true);
      try {
        await api.patch(`/tickets/${ticketForPostTip.id}/tip`, {
          tipAmount: val,
        });
        toast.success(`Pourboire ajouté.`);
        setShowNumpadModal(false);
        setTicketForPostTip(null);
        loadData();
      } catch (err) {
        toast.error("Erreur d'ajout");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="space-y-8 p-1">
      {/* ── SECTION 1 : FILE D'ATTENTE EN COURS ── */}
      <PaymentsQueue
        pendingPayments={pendingPayments}
        isProcessing={isProcessing}
        onVoidPayment={handleVoidPayment}
        onOpenPayModal={handleOpenPayModal}
      />

      {/* ── BOUTON VENTE MANUELLE DIRECTE ── */}
      <div className="flex justify-end p-4 bg-slate-900 border border-slate-800">
        <Button
          variant="success"
          onClick={handleOpenManualPayModal}
          className="py-4 px-8 font-bold text-xs shadow-lg shadow-green-500/10 animate-pulse"
        >
          <Plus size={16} className="mr-2" /> Vente Directe / Facturer sans
          ticket
        </Button>
      </div>

      {/* ── SECTION 2 : HISTORIQUE ── */}
      <PaymentsHistory
        completedPaymentsHistory={completedPaymentsHistory}
        totalRevenueToday={totalRevenueToday}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterBarber={filterBarber}
        setFilterBarber={setFilterBarber}
        barbers={barbers}
        onViewTicket={(ticket) => {
          setTicketToView(ticket);
          setShowViewModal(true);
        }}
        onOpenPostTip={(ticket) => {
          setTicketForPostTip(ticket);
          setNumpadTarget("post-tip");
          setNumpadValue("0");
          setShowNumpadModal(true);
        }}
      />

      {/* ── MODALE CHECKOUT (LA GÉANTE) ── */}
      <CheckoutModal
        isOpen={showPayModal}
        onClose={() => !isProcessing && setShowPayModal(false)}
        isProcessing={isProcessing}
        ticketToPay={ticketToPay}
        manualBarberId={manualBarberId}
        setManualBarberId={setManualBarberId}
        barbers={barbers}
        manualService={manualService}
        setManualService={setManualService}
        availableServices={availableServices}
        setPriceToPay={setPriceToPay}
        manualClientName={manualClientName}
        setManualClientName={setManualClientName}
        manualPhone={manualPhone}
        setManualPhone={setManualPhone}
        priceToPay={priceToPay}
        addedCafeItems={addedCafeItems}
        handleUpdateCafeItemQuantity={handleUpdateCafeItemQuantity}
        handleRemoveCafeItem={handleRemoveCafeItem}
        discountType={discountType}
        discountValue={discountValue}
        setDiscountType={setDiscountType}
        setDiscountValue={setDiscountValue}
        handleOpenNumpad={(target) => {
          setNumpadTarget(target);
          setNumpadValue("0");
          setShowNumpadModal(true);
        }}
        tipAmount={tipAmount}
        setTipAmount={setTipAmount}
        isPartialPayment={isPartialPayment}
        setIsPartialPayment={setIsPartialPayment}
        setPaidAmountInput={setPaidAmountInput}
        isCreatingNewClient={isCreatingNewClient}
        setIsCreatingNewClient={setIsCreatingNewClient}
        selectedClientId={selectedClientId}
        setSelectedClientId={setSelectedClientId}
        registeredClients={registeredClients}
        newClientName={newClientName}
        setNewClientName={setNewClientName}
        newClientPhone={newClientPhone}
        setNewClientPhone={setNewClientPhone}
        handleQuickCreateClient={handleQuickCreateClient}
        paidAmountInput={paidAmountInput}
        calculatedGrandTotal={calculatedGrandTotal}
        handleConfirmPayment={handleConfirmPayment}
        // Sous-modales du checkout
        showPOSModal={showPOSModal}
        setShowPOSModal={setShowPOSModal}
        cafeCategories={cafeCategories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        handleAddCafeItemFromTouchMenu={handleAddCafeItemFromTouchMenu}
        showNumpadModal={showNumpadModal}
        setShowNumpadModal={setShowNumpadModal}
        numpadTarget={numpadTarget}
        numpadValue={numpadValue}
        setNumpadValue={setNumpadValue}
        handleNumpadSubmit={handleNumpadSubmit}
      />

      {/* ── MODALE TICKET (REÇU) ── */}
      <TicketReceiptModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        ticketToView={ticketToView}
      />
    </div>
  );
}
