import React from "react";
import {
  Trash2,
  Plus,
  Minus,
  Banknote,
  PauseCircle,
  ListRestart,
  Printer,
  XOctagon,
} from "lucide-react";

import Button from "../../components/common/Button";

export default function POSCart({
  cart,
  heldOrdersCount,
  onUpdateQuantity,
  onItemClick,
  onCheckout,
  onHoldOrder,
  onRestoreOrder,
  onClearCart,
  isProcessing,
  discountType,
  discountValue,
  onApplyDiscount,
  onRemoveDiscount,
}) {
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

  return (
    <div className="flex flex-col h-full bg-surface border-l border-subtle shadow-2xl z-10">
      {/* --- CART HEADER & HOLD CONTROLS (Boutons Solides) --- */}
      <div className="p-4 border-b border-subtle bg-main shrink-0 flex flex-col xl:flex-row justify-between xl:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-t-main uppercase tracking-widest leading-none">
            Ticket
          </h2>
          <p className="text-xs text-t-muted font-bold uppercase tracking-widest mt-1">
            {cart.length} Ligne(s)
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          {heldOrdersCount > 0 && (
            <button
              onClick={onRestoreOrder}
              className="flex-1 xl:flex-none flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-none shadow-md transition-colors relative"
            >
              <ListRestart size={16} className="mr-2" /> Rappeler
              <span className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] animate-pulse shadow-lg border-2 border-surface">
                {heldOrdersCount}
              </span>
            </button>
          )}

          <button
            onClick={onClearCart}
            disabled={cart.length === 0}
            className="flex-1 xl:flex-none flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:bg-slate-600 rounded-none shadow-md transition-colors"
            title="Vider la commande (Annuler)"
          >
            <XOctagon size={16} className="mr-2 xl:mr-0" />{" "}
            <span className="xl:hidden">Vider</span>
          </button>

          <button
            onClick={onHoldOrder}
            disabled={cart.length === 0}
            className="flex-1 xl:flex-none flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:bg-slate-600 rounded-none shadow-md transition-colors"
            title="Mettre en attente"
          >
            <PauseCircle size={16} className="mr-2 xl:mr-0" />{" "}
            <span className="xl:hidden">Attente</span>
          </button>
        </div>
      </div>

      {/* --- CART ITEMS LIST --- */}
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
              key={item.id}
              className="bg-surface border-2 border-subtle p-2 flex justify-between items-stretch shadow-sm"
            >
              {/* Product Info (Clickable for Price Edit) */}
              <div
                className="flex-1 pr-2 cursor-pointer hover:bg-main active:bg-subtle p-2 transition-colors flex flex-col justify-center"
                onClick={() => onItemClick(item)}
              >
                <p className="font-bold text-t-main text-sm uppercase tracking-wide leading-tight line-clamp-2">
                  {item.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-brand font-mono text-base font-bold">
                    {(item.price * item.quantity).toFixed(2)}
                  </p>
                  {item.originalPrice && item.price !== item.originalPrice && (
                    <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 uppercase font-bold">
                      Modifié
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Controls (Tactile Solid Buttons) */}
              <div className="flex flex-col sm:flex-row items-center bg-main border border-subtle shrink-0">
                <button
                  onClick={() => onUpdateQuantity(item.id, -1)}
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-t-main bg-surface hover:bg-subtle border-b sm:border-b-0 sm:border-r border-subtle active:scale-95 transition-transform"
                >
                  {item.quantity === 1 ? (
                    <Trash2 size={18} className="text-red-600" />
                  ) : (
                    <Minus size={18} />
                  )}
                </button>
                <span className="font-mono font-bold text-t-main w-10 sm:w-12 text-center text-base sm:text-lg">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.id, 1)}
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-t-main bg-surface hover:bg-subtle border-t sm:border-t-0 sm:border-l border-subtle active:scale-95 transition-transform"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- CART CHECKOUT FOOTER --- */}
      <div className="p-4 border-t-4 border-subtle bg-surface shrink-0">
        {/* LIGNE 1 : SOUS-TOTAL ET BOUTONS REMISE */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-2">
            {!discountType ? (
              <>
                <button
                  onClick={() => onApplyDiscount("percent")}
                  className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase hover:bg-blue-500 active:scale-95 transition-all shadow-md rounded-none"
                >
                  - Remise %
                </button>
                <button
                  onClick={() => onApplyDiscount("amount")}
                  className="px-5 py-2.5 bg-slate-700 text-white text-xs font-bold uppercase hover:bg-slate-600 active:scale-95 transition-all shadow-md rounded-none"
                >
                  - Remise DZD
                </button>
              </>
            ) : (
              <button
                onClick={onRemoveDiscount}
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase flex items-center gap-2 shadow-md hover:bg-red-500"
              >
                <Trash2 size={14} /> Annuler Remise
              </button>
            )}
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-t-muted block leading-none">
              Sous-total
            </span>
            <span
              className={`font-mono font-bold text-base ${discountType ? "line-through text-t-muted" : "text-t-main"}`}
            >
              {subTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* LIGNE 2 : AFFICHAGE DE LA REMISE */}
        {discountType && (
          <div className="flex justify-between items-center bg-amber-500 text-white p-2 mb-3 shadow-inner">
            <span className="text-xs uppercase font-bold tracking-widest">
              Remise{" "}
              {discountType === "percent" ? `(${discountValue}%)` : "(Fixe)"}
            </span>
            <span className="font-mono font-bold text-lg">
              - {discountAmount.toFixed(2)}
            </span>
          </div>
        )}

        {/* --- ÉCRAN LED POS (LE TOTAL DIGITAL) --- */}
        <div className="bg-[#0a0a0a] p-4 border-4 border-slate-800 rounded-sm flex justify-between items-center shadow-inner mb-4">
          <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">
            Total
          </span>
          {/* Texte vert fluo avec un léger effet lumineux (drop-shadow) pour simuler un vrai écran de caisse */}
          <span className="text-4xl font-mono font-black text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.4)] tracking-wider">
            {finalTotal.toFixed(2)}
          </span>
        </div>

        {/* --- SIDE-BY-SIDE BUTTONS (Boutons d'encaissement massifs) --- */}
        <div className="flex gap-3">
          {/* Button 1: Fast Cash */}
          <Button
            variant="success" // Force le vert pour l'encaissement principal
            onClick={() => onCheckout(false)}
            disabled={cart.length === 0 || isProcessing}
            className="flex-1 py-5 flex flex-col items-center justify-center gap-2 text-xs font-bold tracking-widest uppercase shadow-xl leading-none h-auto disabled:opacity-50"
          >
            <Banknote size={24} />
            {isProcessing ? "..." : "ENCAISSER (ESPÈCES)"}
          </Button>

          {/* Button 2: Print */}
          <button
            onClick={() => onCheckout(true)}
            disabled={cart.length === 0 || isProcessing}
            className="flex-1 py-5 flex flex-col items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase bg-slate-800 text-white hover:bg-slate-700 transition-colors leading-none h-auto disabled:opacity-50 border-2 border-slate-700 shadow-md"
          >
            <Printer size={20} />
            Imprimer Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
