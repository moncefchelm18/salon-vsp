import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { RefreshCcw, PackageSearch, Clock, Play } from "lucide-react";
import api from "../../../utils/api";

import POSMenuGrid from "../../../features/cafe-pos/POSMenuGrid";
import POSCart from "../../../features/cafe-pos/POSCart";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import VirtualNumpad from "../../../features/cafe-pos/VirtualNumpad"; // Ensure you created this file!

export default function CafeCommandes() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);

  const [cart, setCart] = useState([]);
  const [heldOrders, setHeldOrders] = useState([]); // Array to store paused orders
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false); // NEW MODAL STATE

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- PRICE OVERRIDE MODAL STATES ---
  const [isNumpadOpen, setIsNumpadOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [numpadValue, setNumpadValue] = useState("0");

  const [discountType, setDiscountType] = useState(null); // 'percent' ou 'amount' ou null
  const [discountValue, setDiscountValue] = useState(0);
  const [numpadTarget, setNumpadTarget] = useState("price");

  const fetchMenu = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/cafe/menu");
      setCategories(res.data);
      if (res.data.length > 0) setActiveCategory(res.data[0].id);
    } catch (error) {
      toast.error("Erreur système.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // --- CART OPERATIONS ---
  const handleAddProduct = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      // Note: We save originalPrice so we know if the user applied a discount later
      return [
        ...prevCart,
        { ...product, quantity: 1, originalPrice: product.price },
      ];
    });
  };

  const handleUpdateQuantity = (productId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean),
    );
  };

  // --- PRICE OVERRIDE (NUMPAD LOGIC) ---
  const openPriceEditor = (item) => {
    setNumpadTarget("price");
    setEditingItem(item);
    setNumpadValue(item.price.toString());
    setIsNumpadOpen(true);
  };
  const openDiscountEditor = (type) => {
    setNumpadTarget(`discount-${type}`);
    setNumpadValue("0");
    setIsNumpadOpen(true);
  };

  const handleNumpadSubmit = () => {
    const val = parseFloat(numpadValue);
    if (isNaN(val) || val < 0) return toast.error("Valeur invalide");

    if (numpadTarget === "price") {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === editingItem.id ? { ...item, price: val } : item,
        ),
      );
      setEditingItem(null);
    } else if (numpadTarget === "discount-percent") {
      if (val > 100) return toast.error("La remise ne peut dépasser 100%");
      setDiscountType("percent");
      setDiscountValue(val);
    } else if (numpadTarget === "discount-amount") {
      setDiscountType("amount");
      setDiscountValue(val);
    }

    setIsNumpadOpen(false);
  };

  // --- HOLD ORDER LOGIC ---
  const handleHoldOrder = () => {
    if (cart.length === 0) return;

    // Create a structured Hold object
    const newHeldOrder = {
      holdId: Date.now(), // Unique ID
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      total: cart.reduce((s, i) => s + i.price * i.quantity, 0),
      items: [...cart],
    };

    setHeldOrders([...heldOrders, newHeldOrder]);
    setCart([]);
    toast.success("Commande mise en attente.");
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm("Vider la commande en cours ?")) {
      setCart([]);
      // Optional: If you were editing a price, you might want to close the numpad too
      setIsNumpadOpen(false);
      setEditingItem(null);
      setDiscountType(null);
      setDiscountValue(0);
    }
  };

  const handleRestoreRequest = () => {
    if (heldOrders.length === 0) return;
    if (cart.length > 0)
      return toast.error("Videz d'abord la commande actuelle !");

    // If only 1 order is on hold, restore it instantly (Fast UX)
    if (heldOrders.length === 1) {
      setCart(heldOrders[0].items);
      setHeldOrders([]);
    } else {
      // If multiple, open the selection modal
      setIsHoldModalOpen(true);
    }
  };

  const executeRestore = (orderToRestore) => {
    setCart(orderToRestore.items);
    // Remove the restored order from the held queue
    setHeldOrders(heldOrders.filter((o) => o.holdId !== orderToRestore.holdId));
    setIsHoldModalOpen(false);
  };

  const executeDiscardHold = (holdId) => {
    if (!window.confirm("Supprimer cette commande en attente définitivement ?"))
      return;
    setHeldOrders(heldOrders.filter((o) => o.holdId !== holdId));
    if (heldOrders.length === 1) setIsHoldModalOpen(false); // Close if empty
  };

  // --- CHECKOUT LOGIC ---
  const handleCheckout = async (shouldPrint, ticketId = null) => {
    if (cart.length === 0) return;

    setIsProcessing(true);
    try {
      // 1. Calculer le sous-total
      const subTotal = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      // 2. Appliquer la remise globale
      let finalTotal = subTotal;
      if (discountType === "percent") {
        finalTotal = subTotal - subTotal * (discountValue / 100);
      } else if (discountType === "amount") {
        finalTotal = Math.max(0, subTotal - discountValue);
      }

      await api.post("/cafe/orders", {
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalPrice: finalTotal, // <--- ENVOYER LE PRIX AVEC REMISE
        printReceipt: shouldPrint,
        ticketId: ticketId ? Number(ticketId) : null,
      });

      // ... (vos messages de succès)

      setCart([]);
      setDiscountType(null); // <--- RESET REMISE
      setDiscountValue(0); // <--- RESET REMISE
    } catch (error) {
      console.error(error);
      toast.error("Échec de l'enregistrement de la vente.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    /* ... Loading UI ... */ return (
      <div className="flex h-[calc(100vh-5rem)] -m-8 items-center justify-center bg-main text-brand">
        <RefreshCcw className="animate-spin w-10 h-10" />
      </div>
    );
  }
  if (categories.length === 0) {
    /* ... Empty UI ... */ return (
      <div className="flex h-[calc(100vh-5rem)] -m-8 flex-col items-center justify-center bg-main text-t-muted">
        <PackageSearch className="w-16 h-16 mb-4 opacity-20" />
        <p className="font-bold uppercase tracking-widest text-sm">Menu vide</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] -m-8 overflow-hidden bg-main">
      {/* LEFT SIDE: Menu Grid */}
      <div className="w-2/3 h-full overflow-hidden">
        <POSMenuGrid
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          onAddProduct={handleAddProduct}
        />
      </div>

      {/* RIGHT SIDE: Cart Ticket */}
      <div className="w-1/3 h-full overflow-hidden">
        <POSCart
          cart={cart}
          heldOrdersCount={heldOrders.length}
          onUpdateQuantity={handleUpdateQuantity}
          onItemClick={openPriceEditor}
          onCheckout={handleCheckout}
          onHoldOrder={handleHoldOrder}
          onRestoreOrder={handleRestoreRequest}
          onClearCart={handleClearCart}
          isProcessing={isProcessing}
          discountType={discountType}
          discountValue={discountValue}
          onApplyDiscount={openDiscountEditor}
          onRemoveDiscount={() => {
            setDiscountType(null);
            setDiscountValue(0);
          }}
        />
      </div>

      {/* --- PRICE OVERRIDE MODAL --- */}
      {/* --- NUMPAD MODAL (PRICE OVERRIDE & DISCOUNTS) --- */}
      <Modal isOpen={isNumpadOpen} onClose={() => setIsNumpadOpen(false)}>
        <div className="p-6">
          <h3 className="text-sm font-bold text-t-main uppercase tracking-widest text-center border-b border-subtle pb-4 mb-4">
            {numpadTarget === "price" && editingItem
              ? `Modifier Prix: ${editingItem.name}`
              : numpadTarget === "discount-percent"
                ? "Appliquer Remise Globale (%)"
                : "Appliquer Remise Globale (DZD)"}
          </h3>

          <VirtualNumpad
            value={numpadValue}
            onChange={setNumpadValue}
            onEnter={handleNumpadSubmit}
            onCancel={() => setIsNumpadOpen(false)}
          />

          {/* Afficher le prix original seulement si on modifie un article spécifique */}
          {numpadTarget === "price" && editingItem && (
            <p className="text-center text-[10px] text-t-muted font-bold uppercase tracking-tighter mt-4">
              Prix Original : DZD {editingItem.originalPrice.toFixed(2)}
            </p>
          )}
        </div>
      </Modal>

      {/* --- MODAL 2: HELD ORDERS MANAGER (NEW) --- */}
      <Modal isOpen={isHoldModalOpen} onClose={() => setIsHoldModalOpen(false)}>
        <div className="p-6 max-h-[80vh] flex flex-col">
          <h3 className="text-lg font-serif font-bold text-amber-500 uppercase tracking-widest text-center border-b border-subtle pb-4 mb-4 flex items-center justify-center gap-2">
            <Clock size={20} /> Commandes en Attente
          </h3>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {heldOrders.map((order, idx) => (
              <div
                key={order.holdId}
                className="bg-surface border border-subtle p-4 shadow-sm relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>

                <div className="flex justify-between items-start mb-3 border-b border-subtle/50 pb-2">
                  <div>
                    <p className="font-bold text-t-main text-sm uppercase tracking-wide">
                      Attente #{idx + 1}
                    </p>
                    <p className="text-[10px] text-t-muted font-mono mt-1">
                      Mise en pause à {order.time}
                    </p>
                  </div>
                  <p className="text-xl font-mono font-bold text-brand">
                    DZD {order.total.toFixed(2)}
                  </p>
                </div>

                {/* Mini preview of what is in the cart so the cashier remembers */}
                <div className="text-[10px] text-t-muted mb-4 uppercase tracking-wider leading-relaxed">
                  {order.items
                    .map((i) => `${i.quantity}x ${i.name}`)
                    .join(" • ")}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => executeDiscardHold(order.holdId)}
                    className="text-red-500 border-red-500/30 hover:bg-red-500/10 py-3 text-[10px]"
                  >
                    Supprimer
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => executeRestore(order)}
                    className="py-3 text-[10px] shadow-lg shadow-amber-500/10"
                  >
                    <Play size={14} className="mr-2" /> Reprendre l'encaissement
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-subtle">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setIsHoldModalOpen(false)}
            >
              Fermer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
