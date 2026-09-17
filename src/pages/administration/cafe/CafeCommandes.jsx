import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { RefreshCcw, PackageSearch, Clock, Play } from "lucide-react";
import api from "../../../utils/api";

import POSMenuGrid from "../../../features/cafe-pos/POSMenuGrid";
import POSCart from "../../../features/cafe-pos/POSCart";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import VirtualNumpad from "../../../features/cafe-pos/VirtualNumpad";
import ThermalReceipt from "../../../components/common/ThermalReceipt";

export default function CafeCommandes() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("picasso_cafe_cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [heldOrders, setHeldOrders] = useState(() => {
    const savedHeld = localStorage.getItem("picasso_cafe_held_orders");
    return savedHeld ? JSON.parse(savedHeld) : [];
  });
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Remises & Numpad
  const [isNumpadOpen, setIsNumpadOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [numpadValue, setNumpadValue] = useState("0");
  const [discountType, setDiscountType] = useState(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [numpadTarget, setNumpadTarget] = useState("price");

  // Impression Thermique 80mm
  const [printData, setPrintData] = useState(null);
  const [printType, setPrintType] = useState("receipt");
  const [printTrigger, setPrintTrigger] = useState(0);

  const fetchMenu = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/cafe/menu");
      setCategories(res.data);
      if (res.data.length > 0) setActiveCategory(res.data[0].id);
    } catch (error) {
      toast.error("Erreur de synchronisation du menu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    localStorage.setItem("picasso_cafe_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(
      "picasso_cafe_held_orders",
      JSON.stringify(heldOrders),
    );
  }, [heldOrders]);

  // Opérations Panier
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

  // Numpad & Remise
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

  // Gestion des attentes
  const handleHoldOrder = () => {
    if (cart.length === 0) return;

    const holdId = Date.now();
    const timeString = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const subTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

    const newHeldOrder = {
      holdId,
      time: timeString,
      total: subTotal,
      items: [...cart],
    };

    setHeldOrders([...heldOrders, newHeldOrder]);

    // Impression ticket préparation table
    setPrintType("order");
    setPrintData({
      ticketId: `TABLE-${holdId.toString().slice(-4)}`,
      clientName: `Commande Table (${timeString})`,
      items: cart.map((i) => ({
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      grandTotal: subTotal,
    });
    setPrintTrigger((prev) => prev + 1);

    setCart([]);
    toast.success("Commande mise en attente & Ticket de table imprimé !");
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm("Vider la commande en cours ?")) {
      setCart([]);
      setIsNumpadOpen(false);
      setEditingItem(null);
      setDiscountType(null);
      setDiscountValue(0);
    }
  };

  const handleRestoreRequest = () => {
    if (heldOrders.length === 0) return;
    if (cart.length > 0)
      return toast.error("Videz ou finalisez d'abord la commande actuelle !");

    if (heldOrders.length === 1) {
      setCart(heldOrders[0].items);
      setHeldOrders([]);
    } else {
      setIsHoldModalOpen(true);
    }
  };

  const executeRestore = (orderToRestore) => {
    setCart(orderToRestore.items);
    setHeldOrders(heldOrders.filter((o) => o.holdId !== orderToRestore.holdId));
    setIsHoldModalOpen(false);
  };

  const executeDiscardHold = (holdId) => {
    if (!window.confirm("Supprimer cette commande en attente définitivement ?"))
      return;
    const remaining = heldOrders.filter((o) => o.holdId !== holdId);
    setHeldOrders(remaining);
    if (remaining.length === 0) setIsHoldModalOpen(false);
  };

  // ── IMPRESSION SEULE (SANS TOUCHER À LA CAISSE) ──
  const handlePrintOnly = () => {
    if (cart.length === 0) return toast.error("Le panier est vide.");

    const subTotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    let discountAmount = 0;
    if (discountType === "percent") {
      discountAmount = subTotal * (discountValue / 100);
    } else if (discountType === "amount") {
      discountAmount = discountValue;
    }

    const finalTotal = Math.max(0, subTotal - discountAmount);

    setPrintType("receipt");
    setPrintData({
      ticketId: "NOTE-CAFE",
      clientName: "Client Comptoir (Note)",
      items: cart.map((i) => ({
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      grandTotal: finalTotal,
      discountAmount,
      paidAmount: finalTotal,
    });
    setPrintTrigger((prev) => prev + 1);
    toast.success("Impression de la note seule envoyée !");
  };

  // ── ENCAISSEMENT : AVEC OU SANS IMPRESSION ──
  const handleCheckout = async (shouldPrint = true, ticketId = null) => {
    if (cart.length === 0) return;

    setIsProcessing(true);
    try {
      const subTotal = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      let discountAmount = 0;
      if (discountType === "percent") {
        discountAmount = subTotal * (discountValue / 100);
      } else if (discountType === "amount") {
        discountAmount = discountValue;
      }

      const finalTotal = Math.max(0, subTotal - discountAmount);

      const res = await api.post("/cafe/orders", {
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalPrice: finalTotal,
        printReceipt: shouldPrint,
        ticketId: ticketId ? Number(ticketId) : null,
      });

      if (shouldPrint) {
        setPrintType("receipt");
        setPrintData({
          ticketId: res.data.id,
          clientName: "Client Comptoir",
          items: cart.map((i) => ({
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          grandTotal: finalTotal,
          discountAmount,
          paidAmount: finalTotal,
        });
        setPrintTrigger((prev) => prev + 1);
      }

      toast.success(
        shouldPrint
          ? `Vente de DZD ${finalTotal.toFixed(2)} validée avec reçu !`
          : `Vente de DZD ${finalTotal.toFixed(2)} enregistrée en caisse !`,
      );

      setCart([]);
      setDiscountType(null);
      setDiscountValue(0);
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          "Échec de l'enregistrement de la vente.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Synchronisation Afficheur Client (COM2)
  useEffect(() => {
    const subTotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    let discountAmount = 0;
    if (discountType === "percent")
      discountAmount = subTotal * (discountValue / 100);
    else if (discountType === "amount") discountAmount = discountValue;

    const finalTotal =
      cart.length > 0 ? Math.max(0, subTotal - discountAmount) : 0;

    api
      .post("/settings/customer-display", { amount: finalTotal })
      .catch(() => {});
  }, [cart, discountType, discountValue]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] -m-8 items-center justify-center bg-main text-brand">
        <RefreshCcw className="animate-spin w-10 h-10" />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex h-[calc(100vh-5rem)] -m-8 flex-col items-center justify-center bg-main text-t-muted">
        <PackageSearch className="w-16 h-16 mb-4 opacity-20" />
        <p className="font-bold uppercase tracking-widest text-sm">Menu vide</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] -m-8 overflow-hidden bg-main select-none">
      {/* CÔTÉ GAUCHE : Grille tactile du Menu */}
      <div className="w-2/3 h-full overflow-hidden">
        <POSMenuGrid
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          onAddProduct={handleAddProduct}
        />
      </div>

      {/* CÔTÉ DROIT : Ticket de Caisse avec les 3 boutons */}
      <div className="w-1/3 h-full overflow-hidden">
        <POSCart
          cart={cart}
          heldOrdersCount={heldOrders.length}
          onUpdateQuantity={handleUpdateQuantity}
          onItemClick={openPriceEditor}
          onCheckout={handleCheckout}
          onPrintOnly={handlePrintOnly}
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

      {/* MODALE DU NUMPAD */}
      <Modal isOpen={isNumpadOpen} onClose={() => setIsNumpadOpen(false)}>
        <div className="p-6 bg-slate-950 rounded-none">
          <h3 className="text-sm font-bold text-t-main uppercase tracking-widest text-center border-b border-subtle pb-4 mb-4">
            {numpadTarget === "price" && editingItem
              ? `Modifier Prix : ${editingItem.name}`
              : numpadTarget === "discount-percent"
                ? "Appliquer Remise (%)"
                : "Appliquer Remise (DZD)"}
          </h3>

          <VirtualNumpad
            value={numpadValue}
            onChange={setNumpadValue}
            onEnter={handleNumpadSubmit}
            onCancel={() => setIsNumpadOpen(false)}
          />
        </div>
      </Modal>

      {/* MODALE DES COMMANDES EN ATTENTE */}
      <Modal isOpen={isHoldModalOpen} onClose={() => setIsHoldModalOpen(false)}>
        <div className="p-6 bg-slate-950 max-h-[80vh] flex flex-col rounded-none">
          <h3 className="text-sm font-serif font-bold text-amber-500 uppercase tracking-widest text-center border-b border-subtle pb-3 mb-4 flex items-center justify-center gap-2">
            <Clock size={16} /> Commandes en Attente ({heldOrders.length})
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {heldOrders.map((order, idx) => (
              <div
                key={order.holdId}
                className="bg-surface border border-subtle p-3.5 shadow-sm relative overflow-hidden rounded-none"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />

                <div className="flex justify-between items-start mb-2 border-b border-subtle/50 pb-1.5">
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

                <div className="text-[9px] text-t-muted mb-3 uppercase truncate">
                  {order.items
                    ?.map((i) => `${i.quantity}x ${i.name}`)
                    .join(" • ")}
                </div>

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
                    <Play size={12} /> Reprendre la Commande
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

      {/* MOTEUR D'IMPRESSION SILENCIEUX 80MM */}
      <ThermalReceipt
        type={printType}
        data={printData}
        printTrigger={printTrigger}
      />
    </div>
  );
}
