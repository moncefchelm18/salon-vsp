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

  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Remises
  const [isNumpadOpen, setIsNumpadOpen] = useState(false);
  const [discountType, setDiscountType] = useState(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [numpadTarget, setNumpadTarget] = useState("");
  const [numpadValue, setNumpadValue] = useState("0");

  const [tipAmount, setTipAmount] = useState(0);

  // ── ÉTATS IMPRESSION THERMIQUE ──
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
    if (window.confirm("Vider la caisse en cours ?")) {
      setCart([]);
      setDiscountType(null);
      setDiscountValue(0);
      setSelectedBarber("");
      setTipAmount(0);
    }
  };

  // Sous-totaux
  const subTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  let discountAmount = 0;
  if (discountType === "percent")
    discountAmount = subTotal * (discountValue / 100);
  else if (discountType === "amount") discountAmount = discountValue;
  const finalTotal = Math.max(0, subTotal - discountAmount);

  // ── DÉTECTION DU CONTENU DU PANIER ──
  const serviceItems = cart.filter((i) => i.type === "service");
  const retailProducts = cart.filter((i) => i.type === "salon_product");
  const cafeItems = cart.filter((i) => i.type === "cafe_product");

  // RÈGLE MÉTIER : Un coiffeur est OBLIGATOIRE SEULEMENT SI :
  // 1. Il y a une prestation de coupe (service) dans le panier
  // OU 2. Un pourboire a été renseigné
  const isBarberRequired = serviceItems.length > 0 || tipAmount > 0;

  // --- CHECKOUT LOGIC & IMPRESSION ---
  const handleCheckout = async () => {
    if (cart.length === 0 && tipAmount === 0) return;

    if (isBarberRequired && !selectedBarber) {
      return toast.error(
        "Veuillez sélectionner le Coiffeur pour la coupe ou le pourboire.",
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

      // ── CAS A : UNIQUEMENT DES ARTICLES CAFÉ ──
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

        // Déclencher le ticket de caisse
        setPrintData({
          ticketId: `CMD-${res.data.id}`,
          clientName: "Client Comptoir",
          barber: "Cafétéria",
          service: "Vente Cafétéria",
          haircutPrice: 0,
          items: cafeItems.map((c) => ({
            name: c.name,
            price: c.price,
            quantity: c.quantity,
          })),
          discountAmount,
          tipAmount: 0,
          paidAmount: finalTotal,
          grandTotal: finalTotal,
        });
        setPrintTrigger((prev) => prev + 1);
      } else {
        // ── CAS B : VENTE SALON (PRODUITS, COUPES OU MIXTE) ──
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
          barberId: selectedBarber ? Number(selectedBarber) : undefined, // Backend assigne Boutique Salon automatiquement
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

        // Déclencher le ticket de caisse imprimé
        setPrintData({
          ticketId: res.data.ticket?.id || "DIRECT",
          queueNumber: res.data.ticket?.queueNumber || 0,
          clientName: "Client Comptoir",
          barber: activeBarberName,
          service:
            serviceItems.length > 0 ? serviceNameString : "Produits Boutique",
          haircutPrice: serviceItems.length > 0 ? finalSalonPrice : 0,
          items: [
            ...retailProducts.map((p) => ({
              name: `${p.name} (Boutique)`,
              price: p.price,
              quantity: p.quantity,
            })),
            ...cafeItems.map((c) => ({
              name: `${c.name} (Café)`,
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
        `Encaissement de DZD ${(finalTotal + tipAmount).toFixed(2)} validé ! Impression en cours...`,
      );

      // Reset
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

  // Afficheur Client Arrière (COM2)
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
    <div className="flex h-[calc(100vh-5rem)] -m-8 overflow-hidden bg-main">
      {/* ═══════════════════════════════════════════════════════
          GAUCHE : GRILLE DE MENU TACTILE
      ═══════════════════════════════════════════════════════ */}
      <div className="w-2/3 h-full flex flex-col border-r border-subtle">
        {/* Onglets (Prestations, Produits, Café) */}
        <div className="flex overflow-x-auto border-b border-subtle bg-surface p-3 gap-2 shrink-0 shadow-sm">
          {[
            { id: "services", label: "Prestations Coiffure" },
            { id: "products", label: "Produits Salon (Boutique)" },
            { id: "cafe", label: "Café & Snacks" },
          ].map((tab) => {
            const theme = TAB_COLORS[tab.id];
            const isActive = activeTab === tab.id;
            const Icon = theme.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-bold uppercase tracking-widest text-xs transition-all duration-200 border rounded-none ${
                  isActive ? theme.active : theme.base
                }`}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Grille des articles sans photo (style caisse tactile rapide) */}
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
                  onClick={() => handleAddProduct(item)}
                  className="bg-surface border border-subtle hover:border-brand hover:bg-brand/5 p-3.5 flex flex-col justify-between text-left transition-all active:scale-[0.98] shadow-sm group min-h-[90px] relative overflow-hidden rounded-none"
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
          DROITE : TICKET DE CAISSE (PANIER)
      ═══════════════════════════════════════════════════════ */}
      <div className="w-1/3 h-full flex flex-col bg-surface shadow-2xl z-10">
        {/* En-tête du Panier */}
        <div className="p-4 border-b border-subtle bg-main shrink-0 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-t-main uppercase tracking-widest leading-none">
              Vente Directe
            </h2>
            <button
              onClick={handleClearCart}
              disabled={cart.length === 0 && tipAmount === 0}
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-none shadow-md transition-colors flex items-center gap-2"
            >
              <XOctagon size={14} /> Vider
            </button>
          </div>

          {/* SÉLECTEUR DE COIFFEUR (OBLIGATOIRE UNIQUEMENT SI COUPE OU POURBOIRE) */}
          <div
            className={`p-2.5 border transition-colors rounded-none ${
              isBarberRequired
                ? "bg-amber-500/10 border-amber-500/40"
                : "bg-surface border-subtle"
            }`}
          >
            <label className="block text-[9px] font-bold uppercase mb-1 px-1">
              {isBarberRequired ? (
                <span className="text-amber-400 flex items-center gap-1 font-bold">
                  Coiffeur Assigné * (Requis pour la coupe / pourboire)
                </span>
              ) : (
                <span className="text-t-muted flex items-center gap-1">
                  <Store size={11} /> Coiffeur (Optionnel — Vente Boutique Salon
                  par défaut)
                </span>
              )}
            </label>

            <select
              value={selectedBarber}
              onChange={(e) => setSelectedBarber(e.target.value)}
              className="w-full bg-main border border-subtle text-t-main px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-brand rounded-none"
            >
              <option value="">
                {isBarberRequired
                  ? "-- Sélectionner un Coiffeur Obligatoire --"
                  : "-- Aucun (Vente Boutique 100% Salon) --"}
              </option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.poste ? `(Poste ${b.poste})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lignes d'articles dans le panier */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-main/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-t-muted opacity-50">
              <Banknote size={48} className="mb-4" />
              <span className="font-bold uppercase tracking-widest text-sm">
                Panier Vide
              </span>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="bg-surface border-2 border-subtle p-2 flex justify-between items-stretch shadow-sm rounded-none"
              >
                <div className="flex-1 pr-2 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[8px] font-bold uppercase px-1 py-0.2 ${
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
                    <p className="font-bold text-t-main text-xs uppercase tracking-wide leading-tight line-clamp-1">
                      {item.name}
                    </p>
                  </div>
                  <p className="text-brand font-mono text-sm font-bold mt-1">
                    {(item.price * item.quantity).toFixed(2)} DA
                  </p>
                </div>

                <div className="flex items-center bg-main border border-subtle shrink-0">
                  <button
                    onClick={() => handleUpdateQuantity(item, -1)}
                    className="w-10 h-10 flex items-center justify-center text-t-main bg-surface hover:bg-subtle border-r border-subtle active:scale-95 rounded-none"
                  >
                    {item.quantity === 1 ? (
                      <Trash2 size={16} className="text-red-500" />
                    ) : (
                      <Minus size={16} />
                    )}
                  </button>
                  <span className="font-mono font-bold text-t-main w-10 text-center text-base">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleUpdateQuantity(item, 1)}
                    className="w-10 h-10 flex items-center justify-center text-t-main bg-surface hover:bg-subtle border-l border-subtle active:scale-95 rounded-none"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Encaissement */}
        <div className="p-4 border-t-4 border-subtle bg-surface shrink-0">
          <div className="flex justify-between items-center mb-3">
            <div className="flex gap-2">
              {!discountType ? (
                <>
                  <button
                    onClick={() => {
                      setNumpadTarget("discount-percent");
                      setNumpadValue("0");
                      setIsNumpadOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-[10px] font-bold uppercase hover:bg-blue-500 active:scale-95 shadow-md rounded-none"
                  >
                    - Remise %
                  </button>
                  <button
                    onClick={() => {
                      setNumpadTarget("discount-amount");
                      setNumpadValue("0");
                      setIsNumpadOpen(true);
                    }}
                    className="px-4 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase hover:bg-slate-600 active:scale-95 shadow-md rounded-none"
                  >
                    - Remise DZD
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setDiscountType(null);
                    setDiscountValue(0);
                  }}
                  className="px-4 py-2 bg-red-600 text-white text-[10px] font-bold uppercase shadow-md hover:bg-red-500 flex items-center gap-1 rounded-none"
                >
                  <Trash2 size={12} /> Annuler Remise
                </button>
              )}
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-t-muted block">
                Sous-total
              </span>
              <span
                className={`font-mono font-bold text-sm ${
                  discountType ? "line-through text-t-muted" : "text-t-main"
                }`}
              >
                {subTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {discountType && (
            <div className="flex justify-between items-center bg-amber-500 text-white p-2 mb-3 shadow-inner rounded-none">
              <span className="text-[10px] uppercase font-bold tracking-widest">
                Remise{" "}
                {discountType === "percent" ? `(${discountValue}%)` : "(Fixe)"}
              </span>
              <span className="font-mono font-bold text-base">
                - {discountAmount.toFixed(2)}
              </span>
            </div>
          )}

          {/* Pourboires Coiffeur */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1 px-1">
              <span className="text-[9px] uppercase font-bold text-t-muted">
                Pourboire Coiffeur
              </span>
              {tipAmount > 0 && (
                <span className="font-mono font-bold text-green-500 text-xs">
                  + DZD {tipAmount.toFixed(2)}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTipAmount((prev) => prev + 100)}
                className="flex-1 py-2 bg-main border border-subtle hover:border-green-500 text-t-main hover:text-green-500 active:scale-95 text-[10px] uppercase font-bold rounded-none"
              >
                +100
              </button>
              <button
                onClick={() => setTipAmount((prev) => prev + 200)}
                className="flex-1 py-2 bg-main border border-subtle hover:border-green-500 text-t-main hover:text-green-500 active:scale-95 text-[10px] uppercase font-bold rounded-none"
              >
                +200
              </button>
              <button
                onClick={() => {
                  setNumpadTarget("tip");
                  setNumpadValue("0");
                  setIsNumpadOpen(true);
                }}
                className="flex-1 py-2 bg-main border border-subtle hover:border-brand text-t-main active:scale-95 text-[10px] uppercase font-bold rounded-none"
              >
                Autre
              </button>
              {tipAmount > 0 && (
                <button
                  onClick={() => setTipAmount(0)}
                  className="px-3 bg-red-600 text-white hover:bg-red-500 active:scale-95 shadow-md rounded-none"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Écran Digital LED */}
          <div className="bg-[#0a0a0a] p-4 border-4 border-slate-800 rounded-none flex justify-between items-center shadow-inner mb-4">
            <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              Total à Payer
            </span>
            <span className="text-3xl font-mono font-black text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.4)] tracking-wider">
              {(finalTotal + tipAmount).toFixed(2)}
            </span>
          </div>

          {/* Bouton d'encaissement avec impulsion thermique */}
          <Button
            variant="success"
            onClick={handleCheckout}
            disabled={(cart.length === 0 && tipAmount === 0) || isProcessing}
            className="w-full py-5 flex items-center justify-center gap-2 text-sm font-bold tracking-widest uppercase shadow-xl disabled:opacity-50 rounded-none"
          >
            <Banknote size={24} />
            {isProcessing ? "Encaissement..." : "ENCAISSER & IMPRIMER TICKET"}
          </Button>
        </div>
      </div>

      {/* ── MODALE NUMPAD ── */}
      <Modal isOpen={isNumpadOpen} onClose={() => setIsNumpadOpen(false)}>
        <div className="bg-slate-950 rounded-none overflow-hidden border-2 border-slate-800 shadow-2xl">
          <div className="px-6 py-5 border-b border-slate-800 text-center bg-slate-900/60">
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

      {/* ── MOTEUR D'IMPRESSION SILENCIEUSE 80MM ── */}
      <ThermalReceipt
        type="receipt"
        data={printData}
        printTrigger={printTrigger}
      />
    </div>
  );
}
