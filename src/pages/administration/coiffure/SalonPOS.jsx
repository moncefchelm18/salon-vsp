import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  RefreshCcw,
  PackageSearch,
  Scissors,
  Package,
  Coffee,
  Trash2,
  Plus,
  Minus,
  Banknote,
  XOctagon,
  Printer,
  Store,
  PauseCircle,
  ListRestart,
  Clock,
  Play,
} from "lucide-react";
import api from "../../../utils/api";

import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import VirtualNumpad from "../../../features/cafe-pos/VirtualNumpad";
import ThermalReceipt from "../../../components/common/ThermalReceipt";

const TAB_COLORS = {
  services: {
    base: "text-blue-600 bg-blue-500/10 border-blue-500/20",
    active: "bg-blue-600 text-white border-blue-600 shadow-md",
    icon: Scissors,
  },
  products: {
    base: "text-purple-600 bg-purple-500/10 border-purple-500/20",
    active: "bg-purple-600 text-white border-purple-600 shadow-md",
    icon: Package,
  },
  cafe: {
    base: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    active: "bg-amber-500 text-white border-amber-500 shadow-md",
    icon: Coffee,
  },
};

export default function SalonPOS() {
  const [activeTab, setActiveTab] = useState("services");

  const [catalog, setCatalog] = useState({
    services: [],
    products: [],
    cafe: [],
  });
  const [barbers, setBarbers] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState("");

  // Panier & Commandes en attente (Persistées en local)
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("vsp_salon_cart");
    return saved ? JSON.parse(saved) : [];
  });

  const [heldOrders, setHeldOrders] = useState(() => {
    const saved = localStorage.getItem("vsp_salon_held_orders");
    return saved ? JSON.parse(saved) : [];
  });
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Remises & Numpad
  const [isNumpadOpen, setIsNumpadOpen] = useState(false);
  const [discountType, setDiscountType] = useState(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [numpadTarget, setNumpadTarget] = useState("");
  const [numpadValue, setNumpadValue] = useState("0");

  const [tipAmount, setTipAmount] = useState(0);

  // Impression Thermique 80mm
  const [printData, setPrintData] = useState(null);
  const [printTrigger, setPrintTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [srvRes, prodRes, cafeRes, barberRes] = await Promise.all([
          api.get("/services"),
          api.get("/products"),
          api.get("/cafe/products"),
          api.get("/barbers"),
        ]);

        setCatalog({
          services: srvRes.data.map((i) => ({ ...i, type: "service" })),
          products: prodRes.data.map((i) => ({
            ...i,
            type: "salon_product",
            price: i.salePrice,
          })),
          cafe: cafeRes.data
            .filter((i) => i.canSell)
            .map((i) => ({ ...i, type: "cafe_product" })),
        });
        setBarbers(barberRes.data);
      } catch (error) {
        toast.error("Erreur de chargement du catalogue.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sauvegarde automatique du panier et des attentes
  useEffect(() => {
    localStorage.setItem("vsp_salon_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("vsp_salon_held_orders", JSON.stringify(heldOrders));
  }, [heldOrders]);

  const handleAddProduct = (item) => {
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.id === item.id && i.type === item.type,
      );
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.type === item.type
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (item, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === item.id && i.type === item.type) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean),
    );
  };

  const handleClearCart = () => {
    if (cart.length === 0 && tipAmount === 0) return;
    if (window.confirm("Vider la vente en cours ?")) {
      setCart([]);
      setDiscountType(null);
      setDiscountValue(0);
      setSelectedBarber("");
      setTipAmount(0);
    }
  };

  // ── GESTION DE LA MISE EN ATTENTE (HOLD / RECALL) ──
  const handleHoldOrder = () => {
    if (cart.length === 0 && tipAmount === 0) return;

    const timeString = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newHold = {
      holdId: Date.now(),
      time: timeString,
      items: [...cart],
      selectedBarber,
      discountType,
      discountValue,
      tipAmount,
      total: finalTotal + tipAmount,
    };

    setHeldOrders([...heldOrders, newHold]);
    setCart([]);
    setDiscountType(null);
    setDiscountValue(0);
    setSelectedBarber("");
    setTipAmount(0);
    toast.success("Vente mise en attente !");
  };

  const handleRestoreRequest = () => {
    if (heldOrders.length === 0) return;
    if (cart.length > 0)
      return toast.error("Videz ou finalisez d'abord la vente actuelle !");

    if (heldOrders.length === 1) {
      executeRestore(heldOrders[0]);
    } else {
      setIsHoldModalOpen(true);
    }
  };

  const executeRestore = (order) => {
    setCart(order.items || []);
    setSelectedBarber(order.selectedBarber || "");
    setDiscountType(order.discountType || null);
    setDiscountValue(order.discountValue || 0);
    setTipAmount(order.tipAmount || 0);

    setHeldOrders(heldOrders.filter((h) => h.holdId !== order.holdId));
    setIsHoldModalOpen(false);
    toast.success("Vente rappelée !");
  };

  const executeDiscardHold = (holdId) => {
    if (!window.confirm("Supprimer définitivement cette attente ?")) return;
    const remaining = heldOrders.filter((h) => h.holdId !== holdId);
    setHeldOrders(remaining);
    if (remaining.length === 0) setIsHoldModalOpen(false);
  };

  // ── CALCULS FINANCIERS ──
  const subTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  let discountAmount = 0;
  if (discountType === "percent")
    discountAmount = subTotal * (discountValue / 100);
  else if (discountType === "amount") discountAmount = discountValue;
  const finalTotal = Math.max(0, subTotal - discountAmount);

  const serviceItems = cart.filter((i) => i.type === "service");
  const retailProducts = cart.filter((i) => i.type === "salon_product");
  const cafeItems = cart.filter((i) => i.type === "cafe_product");

  // Règle métier : Coiffeur requis SEULEMENT si coupe ou pourboire
  const isBarberRequired = serviceItems.length > 0 || tipAmount > 0;

  // ── IMPRESSION SEULE (SANS ENCAISSER / SANS TOUCHER À LA CAISSE) ──
  const handlePrintOnly = () => {
    if (cart.length === 0) return toast.error("Le panier est vide.");

    const selectedBarberObj = barbers.find(
      (b) => b.id.toString() === selectedBarber?.toString(),
    );

    setPrintData({
      ticketId: "NOTE-PROVISOIRE",
      clientName: "Client Comptoir (Note)",
      barber: selectedBarberObj ? selectedBarberObj.name : "Salon VSP",
      service:
        serviceItems.length > 0
          ? serviceItems.map((s) => s.name).join(" + ")
          : "Note Produits",
      haircutPrice: serviceItems.reduce((s, i) => s + i.price * i.quantity, 0),
      items: [
        ...retailProducts.map((p) => ({
          name: p.name,
          price: p.price,
          quantity: p.quantity,
        })),
        ...cafeItems.map((c) => ({
          name: c.name,
          price: c.price,
          quantity: c.quantity,
        })),
      ],
      discountAmount,
      tipAmount,
      paidAmount: finalTotal + tipAmount,
      grandTotal: finalTotal + tipAmount,
    });
    setPrintTrigger((prev) => prev + 1);
    toast.success("Impression de la note seule envoyée !");
  };

  // ── ENCAISSEMENT : AVEC OU SANS IMPRESSION ──
  const handleCheckout = async (shouldPrint = true) => {
    if (cart.length === 0 && tipAmount === 0) return;

    if (isBarberRequired && !selectedBarber) {
      return toast.error(
        "Veuillez assigner un coiffeur pour la coupe ou le pourboire.",
      );
    }

    setIsProcessing(true);
    try {
      const selectedBarberObj = barbers.find(
        (b) => b.id.toString() === selectedBarber?.toString(),
      );
      const activeBarberName = selectedBarberObj
        ? selectedBarberObj.name
        : "Boutique Salon";

      let ticketRef = "DIRECT";

      // CAS 1 : UNIQUEMENT DES BOISSONS CAFÉ
      if (
        serviceItems.length === 0 &&
        retailProducts.length === 0 &&
        tipAmount === 0 &&
        cafeItems.length > 0
      ) {
        const res = await api.post("/cafe/orders", {
          totalPrice: finalTotal,
          items: cafeItems.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        });
        ticketRef = `CMD-${res.data.id}`;
      } else {
        // CAS 2 : COIFFURE, PRODUITS BOUTIQUE OU MIXTE
        const serviceNameString =
          [
            ...serviceItems.map((s) => `${s.quantity}x ${s.name}`),
            ...retailProducts.map((p) => `${p.quantity}x ${p.name}`),
          ].join(" + ") || "Vente Comptoir";

        const salonSubTotal = [...serviceItems, ...retailProducts].reduce(
          (s, i) => s + i.price * i.quantity,
          0,
        );
        const finalSalonPrice = Math.max(0, salonSubTotal - discountAmount);

        const res = await api.post("/tickets/manual-pay", {
          clientName: "Client Comptoir",
          phone: "",
          barberId: selectedBarber ? Number(selectedBarber) : undefined,
          serviceName: serviceNameString,
          totalPrice: finalSalonPrice,
          originalPrice: salonSubTotal,
          discountAmount,
          additionalCafeItems: cafeItems,
          additionalSalonProducts: retailProducts.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            quantity: p.quantity,
          })),
          tip: tipAmount,
          paidAmount: finalTotal + tipAmount,
        });

        ticketRef = res.data.ticket?.id || "DIRECT";
      }

      // IMPRESSION THERMIQUE SI DEMANDÉE
      if (shouldPrint) {
        setPrintData({
          ticketId: ticketRef,
          clientName: "Client Comptoir",
          barber: activeBarberName,
          service:
            serviceItems.length > 0
              ? serviceItems.map((s) => s.name).join(" + ")
              : "Produits Boutique",
          haircutPrice:
            serviceItems.length > 0
              ? Math.max(
                  0,
                  serviceItems.reduce((s, i) => s + i.price * i.quantity, 0) -
                    discountAmount,
                )
              : 0,
          items: [
            ...retailProducts.map((p) => ({
              name: p.name,
              price: p.price,
              quantity: p.quantity,
            })),
            ...cafeItems.map((c) => ({
              name: c.name,
              price: c.price,
              quantity: c.quantity,
            })),
          ],
          discountAmount,
          tipAmount,
          paidAmount: finalTotal + tipAmount,
          grandTotal: finalTotal + tipAmount,
        });
        setPrintTrigger((prev) => prev + 1);
      }

      toast.success(
        shouldPrint
          ? `Vente de DZD ${(finalTotal + tipAmount).toFixed(2)} encaissée avec reçu !`
          : `Vente de DZD ${(finalTotal + tipAmount).toFixed(2)} encaissée en caisse !`,
      );

      // Réinitialisation
      setCart([]);
      setDiscountType(null);
      setDiscountValue(0);
      setSelectedBarber("");
      setTipAmount(0);
    } catch (error) {
      toast.error(error.response?.data?.message || "Échec de l'encaissement.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNumpadSubmit = () => {
    const val = parseFloat(numpadValue);
    if (isNaN(val) || val < 0) return toast.error("Valeur invalide");

    if (numpadTarget === "discount-percent") {
      if (val > 100) return toast.error("Max 100%");
      setDiscountType("percent");
      setDiscountValue(val);
    } else if (numpadTarget === "discount-amount") {
      setDiscountType("amount");
      setDiscountValue(val);
    } else if (numpadTarget === "tip") {
      setTipAmount(val);
    }
    setIsNumpadOpen(false);
  };

  // Synchronisation Afficheur Client Arrière (COM2)
  useEffect(() => {
    const totalToDisplay =
      cart.length > 0 || tipAmount > 0 ? finalTotal + tipAmount : 0;
    api
      .post("/settings/customer-display", { amount: totalToDisplay })
      .catch(() => {});
  }, [cart, finalTotal, tipAmount]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] -m-8 items-center justify-center bg-main text-brand">
        <RefreshCcw className="animate-spin w-10 h-10" />
      </div>
    );
  }

  const activeGridItems = catalog[activeTab] || [];

  return (
    <div className="flex h-[calc(100vh-5rem)] -m-8 overflow-hidden bg-main select-none">
      {/* ═══════════════════════════════════════════════════════
          GAUCHE : GRILLE DE MENU TACTILE (2/3)
      ═══════════════════════════════════════════════════════ */}
      <div className="w-2/3 h-full flex flex-col border-r border-subtle">
        {/* Onglets */}
        <div className="flex overflow-x-auto border-b border-subtle bg-surface p-3 gap-2 shrink-0 shadow-sm hide-scrollbar">
          {[
            { id: "services", label: "Prestations Coiffure" },
            { id: "products", label: "Produits Boutique" },
            { id: "cafe", label: "Café & Snacks" },
          ].map((tab) => {
            const theme = TAB_COLORS[tab.id];
            const isActive = activeTab === tab.id;
            const Icon = theme.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-bold uppercase tracking-widest text-xs transition-all duration-200 border rounded-none cursor-pointer ${
                  isActive ? theme.active : theme.base
                }`}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Grille tactile des articles */}
        <div className="flex-1 overflow-y-auto p-4 bg-main">
          {activeGridItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-t-muted opacity-50">
              <PackageSearch size={40} className="mb-2" />
              <span className="font-bold uppercase tracking-widest text-xs">
                Aucun article disponible
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {activeGridItems.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  type="button"
                  onClick={() => handleAddProduct(item)}
                  className="bg-surface border border-subtle hover:border-brand hover:bg-brand/5 p-3.5 flex flex-col justify-between text-left transition-all active:scale-[0.98] shadow-sm group min-h-[92px] relative overflow-hidden rounded-none cursor-pointer"
                >
                  <div
                    className={`absolute top-0 left-0 w-1.5 h-full ${
                      item.type === "service"
                        ? "bg-blue-500"
                        : item.type === "salon_product"
                          ? "bg-purple-500"
                          : "bg-amber-500"
                    }`}
                  />

                  <div className="pl-1.5">
                    <span className="text-[9px] font-bold uppercase text-t-muted block mb-1">
                      {item.type === "service"
                        ? "Coupe"
                        : item.type === "salon_product"
                          ? "Boutique"
                          : "Café"}
                    </span>
                    <h3 className="font-bold text-t-main text-xs uppercase leading-tight line-clamp-2 group-hover:text-brand">
                      {item.name}
                    </h3>
                  </div>

                  <div className="pl-1.5 mt-2 pt-2 border-t border-subtle/50 flex justify-between items-end w-full">
                    <span className="text-brand font-mono font-bold text-base">
                      {Number(item.price).toFixed(2)} DA
                    </span>
                    <span className="text-[8px] font-bold uppercase text-t-muted bg-main px-1.5 py-0.5 border border-subtle">
                      +
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          DROITE : TICKET DE CAISSE (PANIER 1/3)
      ═══════════════════════════════════════════════════════ */}
      <div className="w-1/3 h-full flex flex-col bg-surface shadow-2xl z-10">
        {/* Header avec Attente, Rappeler et Vider */}
        <div className="p-3 border-b border-subtle bg-main shrink-0 space-y-2.5">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-t-main uppercase tracking-widest leading-none">
              Vente Directe
            </h2>

            {/* BOUTONS D'ATTENTE & VIDER (STYLE CAFÉ POS) */}
            <div className="flex items-center gap-1.5">
              {heldOrders.length > 0 && (
                <button
                  type="button"
                  onClick={handleRestoreRequest}
                  className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase rounded-none shadow-md relative"
                  title="Rappeler une vente en attente"
                >
                  <ListRestart size={13} className="mr-1" /> Rappeler
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] animate-pulse border border-white">
                    {heldOrders.length}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handleHoldOrder}
                disabled={cart.length === 0 && tipAmount === 0}
                className="flex items-center px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] uppercase rounded-none shadow-md disabled:opacity-40"
                title="Mettre en attente"
              >
                <PauseCircle size={13} className="mr-1" /> Attente
              </button>

              <button
                type="button"
                onClick={handleClearCart}
                disabled={cart.length === 0 && tipAmount === 0}
                className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-none shadow-md disabled:opacity-40"
                title="Vider le panier"
              >
                <XOctagon size={15} />
              </button>
            </div>
          </div>

          {/* SÉLECTEUR DE COIFFEUR */}
          <div
            className={`p-2 border transition-colors rounded-none ${
              isBarberRequired
                ? "bg-amber-500/10 border-amber-500/40"
                : "bg-surface border-subtle"
            }`}
          >
            <label className="block text-[8px] font-bold uppercase mb-1 px-0.5">
              {isBarberRequired ? (
                <span className="text-amber-400 flex items-center gap-1 font-bold">
                  Coiffeur Assigné * (Requis pour la coupe)
                </span>
              ) : (
                <span className="text-t-muted flex items-center gap-1">
                  <Store size={10} /> Coiffeur (Facultatif — Vente Boutique
                  Salon)
                </span>
              )}
            </label>

            <select
              value={selectedBarber}
              onChange={(e) => setSelectedBarber(e.target.value)}
              className="w-full bg-main border border-subtle text-t-main px-2.5 py-1.5 text-xs font-bold uppercase focus:outline-none focus:border-brand rounded-none"
            >
              <option value="">
                {isBarberRequired
                  ? "-- Choisir un Coiffeur Obligatoire --"
                  : "-- Aucun (Vente Boutique 100% Salon) --"}
              </option>
              {barbers
                .filter((b) => b.isPresent !== false)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.poste ? `(Poste ${b.poste})` : ""}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Lignes du panier */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 bg-main/40">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-t-muted opacity-40">
              <Banknote size={44} className="mb-2" />
              <span className="font-bold uppercase tracking-widest text-xs">
                Panier Vide
              </span>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="bg-surface border border-subtle p-2 flex justify-between items-center shadow-sm rounded-none"
              >
                <div className="flex-1 pr-2 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span
                      className={`text-[7px] font-bold uppercase px-1 ${
                        item.type === "service"
                          ? "bg-blue-500/20 text-blue-400"
                          : item.type === "salon_product"
                            ? "bg-purple-500/20 text-purple-400"
                            : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {item.type === "service"
                        ? "Coupe"
                        : item.type === "salon_product"
                          ? "Boutique"
                          : "Café"}
                    </span>
                    <p className="font-bold text-t-main text-xs uppercase truncate">
                      {item.name}
                    </p>
                  </div>
                  <p className="text-brand font-mono text-xs font-bold">
                    {(item.price * item.quantity).toFixed(2)} DA
                  </p>
                </div>

                <div className="flex items-center bg-main border border-subtle shrink-0">
                  <button
                    type="button"
                    onClick={() => handleUpdateQuantity(item, -1)}
                    className="w-8 h-8 flex items-center justify-center text-t-main hover:bg-subtle active:scale-95 rounded-none"
                  >
                    {item.quantity === 1 ? (
                      <Trash2 size={13} className="text-red-500" />
                    ) : (
                      <Minus size={13} />
                    )}
                  </button>
                  <span className="font-mono font-bold text-t-main w-8 text-center text-xs">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateQuantity(item, 1)}
                    className="w-8 h-8 flex items-center justify-center text-t-main hover:bg-subtle active:scale-95 rounded-none"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Caisse & Boutons d'Action */}
        <div className="p-3 border-t-2 border-subtle bg-surface shrink-0 space-y-2.5">
          {/* Remises & Sous-total */}
          <div className="flex justify-between items-center">
            <div className="flex gap-1.5">
              {!discountType ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setNumpadTarget("discount-percent");
                      setNumpadValue("0");
                      setIsNumpadOpen(true);
                    }}
                    className="px-2.5 py-1 bg-blue-600 text-white text-[9px] font-bold uppercase rounded-none hover:bg-blue-500"
                  >
                    % Remise
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNumpadTarget("discount-amount");
                      setNumpadValue("0");
                      setIsNumpadOpen(true);
                    }}
                    className="px-2.5 py-1 bg-slate-700 text-white text-[9px] font-bold uppercase rounded-none hover:bg-slate-600"
                  >
                    DA Remise
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType(null);
                    setDiscountValue(0);
                  }}
                  className="px-2.5 py-1 bg-red-600 text-white text-[9px] font-bold uppercase rounded-none flex items-center gap-1"
                >
                  <Trash2 size={11} /> Annuler ({discountAmount.toFixed(0)} DA)
                </button>
              )}
            </div>
            <span className="font-mono text-xs text-t-muted">
              Sous-total:{" "}
              <strong className="text-t-main">{subTotal.toFixed(2)}</strong>
            </span>
          </div>

          {/* Pourboires Coiffeur */}
          <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-subtle/50">
            <span className="text-[9px] font-bold uppercase text-t-muted shrink-0">
              Tips Coiffeur :
            </span>
            <div className="flex gap-1 flex-1 justify-end">
              <button
                type="button"
                onClick={() => setTipAmount((p) => p + 100)}
                className="px-2 py-1 bg-main border border-subtle text-[9px] font-bold rounded-none hover:text-green-500"
              >
                +100
              </button>
              <button
                type="button"
                onClick={() => setTipAmount((p) => p + 200)}
                className="px-2 py-1 bg-main border border-subtle text-[9px] font-bold rounded-none hover:text-green-500"
              >
                +200
              </button>
              <button
                type="button"
                onClick={() => {
                  setNumpadTarget("tip");
                  setNumpadValue("0");
                  setIsNumpadOpen(true);
                }}
                className="px-2 py-1 bg-main border border-subtle text-[9px] font-bold rounded-none hover:text-brand"
              >
                Autre
              </button>
              {tipAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setTipAmount(0)}
                  className="p-1 bg-red-600 text-white rounded-none"
                  title="Effacer pourboire"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Écran Digital LED */}
          <div className="bg-[#0a0a0a] p-3 border-2 border-slate-800 rounded-none flex justify-between items-center shadow-inner">
            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              Total Net
            </span>
            <span className="text-2xl font-mono font-black text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.4)] tracking-wider">
              {(finalTotal + tipAmount).toFixed(2)} DA
            </span>
          </div>

          {/* ═══════════════════════════════════════════════════════
              LES 3 BOUTONS ERGONOMIQUES (PRINCIPAL + 2 SECONDAIRES)
          ═══════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-12 gap-1.5 h-14">
            {/* 1. GRAND BOUTON PRINCIPAL GAUCHE : ENCAISSER & TICKET (8 Cols) */}
            <button
              type="button"
              onClick={() => handleCheckout(true)}
              disabled={(cart.length === 0 && tipAmount === 0) || isProcessing}
              className="col-span-8 bg-green-600 hover:bg-green-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 rounded-none cursor-pointer active:scale-[0.98] transition-all"
              title="Encaisser en espèces et imprimer le ticket thermique 80mm"
            >
              <Banknote size={18} />
              <Printer size={15} />
              <span>{isProcessing ? "..." : "ENCAISSER & TICKET"}</span>
            </button>

            {/* 2 & 3. DEUX BOUTONS SECONDAIRES EMPILÉS À DROITE (4 Cols) */}
            <div className="col-span-4 flex flex-col gap-1.5">
              {/* Encaisser SEUL (sans ticket) */}
              <button
                type="button"
                onClick={() => handleCheckout(false)}
                disabled={
                  (cart.length === 0 && tipAmount === 0) || isProcessing
                }
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[9px] uppercase tracking-tighter flex items-center justify-center gap-1.5 rounded-none shadow-sm disabled:opacity-40"
                title="Encaisser dans le tiroir sans imprimer de ticket"
              >
                <Banknote size={13} className="text-green-400" />
                <span>Encaisser</span>
              </button>

              {/* Imprimer SEUL (sans encaisser) */}
              <button
                type="button"
                onClick={handlePrintOnly}
                disabled={cart.length === 0}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[9px] uppercase tracking-tighter flex items-center justify-center gap-1.5 rounded-none shadow-sm disabled:opacity-40"
                title="Imprimer un ticket provisoire sans toucher à la caisse"
              >
                <Printer size={13} className="text-amber-400" />
                <span>Ticket</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALE NUMPAD ── */}
      <Modal isOpen={isNumpadOpen} onClose={() => setIsNumpadOpen(false)}>
        <div className="bg-slate-950 rounded-none overflow-hidden border-2 border-slate-800 shadow-2xl">
          <div className="px-6 py-4 border-b border-slate-800 text-center bg-slate-900/60">
            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500">
              {numpadTarget === "tip"
                ? "Saisir le Pourboire"
                : "Saisir la Remise"}
            </h3>
          </div>
          <div className="p-6 bg-slate-950">
            <VirtualNumpad
              value={numpadValue}
              onChange={setNumpadValue}
              onEnter={handleNumpadSubmit}
              onCancel={() => setIsNumpadOpen(false)}
            />
          </div>
        </div>
      </Modal>

      {/* ── MODALE DES COMMANDES EN ATTENTE ── */}
      <Modal isOpen={isHoldModalOpen} onClose={() => setIsHoldModalOpen(false)}>
        <div className="p-6 bg-slate-950 max-h-[80vh] flex flex-col rounded-none">
          <h3 className="text-sm font-serif font-bold text-amber-500 uppercase tracking-widest text-center border-b border-subtle pb-3 mb-4 flex items-center justify-center gap-2">
            <Clock size={16} /> Ventes en Attente ({heldOrders.length})
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {heldOrders.map((order, idx) => (
              <div
                key={order.holdId}
                className="bg-surface border border-subtle p-3.5 shadow-sm relative overflow-hidden rounded-none"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />

                <div className="flex justify-between items-start mb-2 border-b border-subtle/40 pb-1.5">
                  <div>
                    <p className="font-bold text-t-main text-xs uppercase">
                      Attente #{idx + 1}
                    </p>
                    <p className="text-[9px] text-t-muted font-mono">
                      Mise en pause à {order.time}
                    </p>
                  </div>
                  <p className="text-base font-mono font-bold text-brand">
                    DZD {order.total.toFixed(2)}
                  </p>
                </div>

                <p className="text-[9px] text-t-muted uppercase truncate mb-3">
                  {order.items
                    ?.map((i) => `${i.quantity}x ${i.name}`)
                    .join(" • ")}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => executeDiscardHold(order.holdId)}
                    className="py-2 text-[9px] text-red-500 border-red-500/30 hover:bg-red-500/10 rounded-none"
                  >
                    Supprimer
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => executeRestore(order)}
                    className="py-2 text-[9px] rounded-none shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Play size={12} /> Reprendre la Vente
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-subtle">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setIsHoldModalOpen(false)}
              className="py-2.5 text-xs font-bold rounded-none"
            >
              Fermer
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── MOTEUR D'IMPRESSION SILENCIEUX 80MM ── */}
      <ThermalReceipt
        type="receipt"
        data={printData}
        printTrigger={printTrigger}
      />
    </div>
  );
}
