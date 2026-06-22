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
} from "lucide-react";
import api from "../../../utils/api";

import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import VirtualNumpad from "../../../features/cafe-pos/VirtualNumpad";

// Palette de couleurs pour les onglets
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

  // Remises (Discount)
  const [isNumpadOpen, setIsNumpadOpen] = useState(false);
  const [discountType, setDiscountType] = useState(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [numpadTarget, setNumpadTarget] = useState("");
  const [numpadValue, setNumpadValue] = useState("0");

  const [tipAmount, setTipAmount] = useState(0); // Montant du pourboire

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
          })), // Map salePrice to price
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
    if (cart.length === 0) return;
    if (window.confirm("Vider la caisse en cours ?")) {
      setCart([]);
      setDiscountType(null);
      setDiscountValue(0);
      setSelectedBarber("");
      setTipAmount(0); // <-- NOUVEAU
    }
  };

  const subTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  let discountAmount = 0;
  if (discountType === "percent")
    discountAmount = subTotal * (discountValue / 100);
  else if (discountType === "amount") discountAmount = discountValue;
  const finalTotal = Math.max(0, subTotal - discountAmount);

  // --- CHECKOUT LOGIC (Moteur de routage intelligent) ---
  const handleCheckout = async () => {
    // On bloque si TOUT est vide (Panier + Pourboire)
    if (cart.length === 0 && tipAmount === 0) return;

    const salonItems = cart.filter(
      (i) => i.type === "service" || i.type === "salon_product",
    );
    const cafeItems = cart.filter((i) => i.type === "cafe_product");

    // RÈGLES MÉTIER : Un coiffeur est OBLIGATOIRE si on vend une PRESTATION/PRODUIT ou si on donne un POURBOIRE
    if ((salonItems.length > 0 || tipAmount > 0) && !selectedBarber) {
      return toast.error(
        "Veuillez sélectionner le Barbier (ou Boutique) pour enregistrer la prestation ou le pourboire.",
      );
    }

    setIsProcessing(true);
    try {
      // S'il y a des articles du Salon OU s'il y a un Pourboire
      if (salonItems.length > 0 || tipAmount > 0) {
        // Si le panier est vide mais qu'il y a un pourboire, le nom du service sera juste "Pourboire"
        const serviceNameString =
          salonItems.length > 0
            ? salonItems.map((i) => `${i.quantity}x ${i.name}`).join(" + ")
            : "Pourboire Unique";

        const salonSubTotal = salonItems.reduce(
          (s, i) => s + i.price * i.quantity,
          0,
        );
        const finalSalonPrice = Math.max(0, salonSubTotal - discountAmount);

        await api.post("/tickets/manual-pay", {
          clientName: "Client Comptoir",
          phone: "",
          barberId: Number(selectedBarber),
          serviceName: serviceNameString,
          totalPrice: finalSalonPrice,
          additionalCafeItems: cafeItems,
          tip: tipAmount,
          paidAmount: finalTotal + tipAmount, // L'argent réel (Produits + Pourboire)
        });
      } else {
        // --- ROUTE 2 : Juste un café (Aucun salon, aucun pourboire) ---
        await api.post("/cafe/orders", {
          totalPrice: finalTotal,
          items: cafeItems.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        });
      }

      toast.success(
        `Encaissement de DZD ${(finalTotal + tipAmount).toFixed(2)} réussi !`,
      );
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
      // <-- NOUVEAU
      setTipAmount(val);
    }
    setIsNumpadOpen(false);
  };

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
          GAUCHE : GRILLE DE MENU TACTILE UNIFIÉE
      ═══════════════════════════════════════════════════════ */}
      <div className="w-2/3 h-full flex flex-col border-r border-subtle">
        {/* TABS (Services, Produits, Café) */}
        <div className="flex overflow-x-auto border-b border-subtle bg-surface p-3 gap-2 shrink-0 shadow-sm">
          {[
            { id: "services", label: "Prestations Coiffure" },
            { id: "products", label: "Produits Salon" },
            { id: "cafe", label: "Café & Snacks" },
          ].map((tab) => {
            const theme = TAB_COLORS[tab.id];
            const isActive = activeTab === tab.id;
            const Icon = theme.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-bold uppercase tracking-widest text-xs transition-all duration-200 border ${
                  isActive ? theme.active : theme.base
                }`}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* GRID ITEMS */}
        <div className="flex-1 overflow-y-auto p-6 bg-main">
          {activeGridItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-t-muted opacity-50">
              <PackageSearch size={48} className="mb-4" />
              <span className="font-bold uppercase tracking-widest">
                Rien à afficher
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {activeGridItems.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleAddProduct(item)}
                  className="bg-surface border border-subtle hover:border-brand hover:shadow-lg flex flex-col items-center p-4 transition-all active:scale-95 shadow-sm group"
                >
                  <div className="w-full aspect-square bg-main border border-subtle mb-4 p-2 flex justify-center items-center group-hover:border-brand/50 transition-colors">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-t-muted font-bold text-[10px] uppercase opacity-50">
                        Sans Img
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-t-main text-xs text-center leading-tight mb-2 uppercase tracking-wide group-hover:text-brand">
                    {item.name}
                  </h3>
                  <p className="bg-main border border-subtle w-full text-center py-2 text-brand font-mono font-bold text-base mt-auto">
                    {item.price.toFixed(2)} DA
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          DROITE : TICKET DE CAISSE (CART)
      ═══════════════════════════════════════════════════════ */}
      <div className="w-1/3 h-full flex flex-col bg-surface shadow-2xl z-10">
        {/* En-tête du Panier & Coiffeur */}
        <div className="p-4 border-b border-subtle bg-main shrink-0 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-t-main uppercase tracking-widest leading-none">
              Vente Directe
            </h2>
            <button
              onClick={handleClearCart}
              disabled={cart.length === 0}
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-none shadow-md transition-colors flex items-center gap-2"
            >
              <XOctagon size={14} /> Vider
            </button>
          </div>

          {/* SÉLECTEUR DE COIFFEUR (Obligatoire si prestation/produit salon) */}
          <div className="bg-surface border border-subtle p-2">
            <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1 px-1">
              Coiffeur (Requis pour Prestation & Pourboire)
            </label>
            <select
              value={selectedBarber}
              onChange={(e) => setSelectedBarber(e.target.value)}
              className="w-full bg-main border border-subtle text-t-main px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-brand"
            >
              <option value="">-- Sélectionner --</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lignes de commande */}
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
                className="bg-surface border-2 border-subtle p-2 flex justify-between items-stretch shadow-sm"
              >
                <div className="flex-1 pr-2 flex flex-col justify-center">
                  <p className="font-bold text-t-main text-xs uppercase tracking-wide leading-tight line-clamp-2">
                    {item.name}
                  </p>
                  <p className="text-brand font-mono text-sm font-bold mt-1">
                    {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center bg-main border border-subtle shrink-0">
                  <button
                    onClick={() => handleUpdateQuantity(item, -1)}
                    className="w-10 h-10 flex items-center justify-center text-t-main bg-surface hover:bg-subtle border-r border-subtle active:scale-95"
                  >
                    {item.quantity === 1 ? (
                      <Trash2 size={16} className="text-red-600" />
                    ) : (
                      <Minus size={16} />
                    )}
                  </button>
                  <span className="font-mono font-bold text-t-main w-10 text-center text-base">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleUpdateQuantity(item, 1)}
                    className="w-10 h-10 flex items-center justify-center text-t-main bg-surface hover:bg-subtle border-l border-subtle active:scale-95"
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
                  className="px-4 py-2 bg-red-600 text-white text-[10px] font-bold uppercase shadow-md hover:bg-red-500 flex items-center gap-1"
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
                className={`font-mono font-bold text-sm ${discountType ? "line-through text-t-muted" : "text-t-main"}`}
              >
                {subTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {discountType && (
            <div className="flex justify-between items-center bg-amber-500 text-white p-2 mb-3 shadow-inner">
              <span className="text-[10px] uppercase font-bold tracking-widest">
                Remise{" "}
                {discountType === "percent" ? `(${discountValue}%)` : "(Fixe)"}
              </span>
              <span className="font-mono font-bold text-base">
                - {discountAmount.toFixed(2)}
              </span>
            </div>
          )}

          {/* ÉCRAN LED POS */}
          <div className="bg-[#0a0a0a] p-4 border-4 border-slate-800 rounded-sm flex justify-between items-center shadow-inner mb-4">
            <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              Total Net
            </span>
            <span className="text-3xl font-mono font-black text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.4)] tracking-wider">
              {(finalTotal + tipAmount).toFixed(2)}
            </span>
          </div>
          {/* --- NOUVEAU BLOC : POURBOIRE --- */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1 px-1">
              <span className="text-[9px] uppercase font-bold text-t-muted">
                Ajouter un Pourboire
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
                className="flex-1 py-2 bg-main border border-subtle hover:border-green-500 text-t-main hover:text-green-500 active:scale-95 transition-all text-[10px] uppercase font-bold tracking-widest"
              >
                +100
              </button>
              <button
                onClick={() => setTipAmount((prev) => prev + 200)}
                className="flex-1 py-2 bg-main border border-subtle hover:border-green-500 text-t-main hover:text-green-500 active:scale-95 transition-all text-[10px] uppercase font-bold tracking-widest"
              >
                +200
              </button>
              <button
                onClick={() => {
                  setNumpadTarget("tip");
                  setNumpadValue("0");
                  setIsNumpadOpen(true);
                }}
                className="flex-1 py-2 bg-main border border-subtle hover:border-brand text-t-main active:scale-95 transition-all text-[10px] uppercase font-bold tracking-widest"
              >
                Autre
              </button>
              {tipAmount > 0 && (
                <button
                  onClick={() => setTipAmount(0)}
                  className="px-3 bg-red-600 text-white hover:bg-red-500 active:scale-95 transition-all shadow-md"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>

          {/* ÉCRAN LED POS ... */}
          <Button
            variant="success"
            onClick={handleCheckout}
            disabled={(cart.length === 0 && tipAmount === 0) || isProcessing}
            className="w-full py-5 flex items-center justify-center gap-2 text-sm font-bold tracking-widest uppercase shadow-xl disabled:opacity-50"
          >
            <Banknote size={24} />
            {isProcessing ? "Traitement..." : "ENCAISSER MAINTENANT"}
          </Button>
        </div>
      </div>

      {/* --- NUMPAD MODAL --- */}
      <Modal isOpen={isNumpadOpen} onClose={() => setIsNumpadOpen(false)}>
        <div className="bg-slate-950 rounded-xl overflow-hidden border-2 border-slate-800 shadow-2xl">
          <div className="px-6 py-5 border-b border-slate-800 text-center bg-slate-900/60">
            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500">
              Saisir la Remise
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
    </div>
  );
}
