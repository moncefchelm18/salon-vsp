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

export default function POSCart({
  cart,
  heldOrdersCount,
  onUpdateQuantity,
  onItemClick,
  onCheckout,
  onPrintOnly, // <-- NOUVELLE ACTION POUR IMPRIMER SEUL
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
    <div className="flex flex-col h-full bg-surface border-l border-subtle shadow-2xl z-10 select-none">
      {/* ── HEADER DU PANIER AVEC ATTENTE, RAPPELER & VIDER ── */}
      <div className="p-3 border-b border-subtle bg-main shrink-0 flex justify-between items-center gap-2">
        <div>
          <h2 className="text-lg font-bold text-t-main uppercase tracking-widest leading-none">
            Ticket
          </h2>
          <p className="text-[10px] text-t-muted font-bold uppercase tracking-widest mt-1">
            {cart.length} Ligne(s)
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {heldOrdersCount > 0 && (
            <button
              type="button"
              onClick={onRestoreOrder}
              className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase rounded-none shadow-md relative transition-colors"
              title="Rappeler une commande en attente"
            >
              <ListRestart size={13} className="mr-1" /> Rappeler
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] animate-pulse border border-white">
                {heldOrdersCount}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onHoldOrder}
            disabled={cart.length === 0}
            className="flex items-center px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] uppercase rounded-none shadow-md disabled:opacity-40 transition-colors"
            title="Mettre en attente"
          >
            <PauseCircle size={13} className="mr-1" /> Attente
          </button>

          <button
            type="button"
            onClick={onClearCart}
            disabled={cart.length === 0}
            className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-none shadow-md disabled:opacity-40 transition-colors"
            title="Vider la commande (Annuler)"
          >
            <XOctagon size={15} />
          </button>
        </div>
      </div>

      {/* ── LISTE DES ARTICLES DANS LE PANIER ── */}
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
              key={item.id}
              className="bg-surface border border-subtle p-2 flex justify-between items-center shadow-sm rounded-none"
            >
              {/* Clic pour ajuster prix/remise si besoin */}
              <div
                className="flex-1 pr-2 cursor-pointer hover:bg-main/50 p-1 transition-colors flex flex-col justify-center min-w-0"
                onClick={() => onItemClick(item)}
              >
                <p className="font-bold text-t-main text-xs uppercase tracking-wide leading-tight truncate">
                  {item.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-brand font-mono text-xs font-bold">
                    {(item.price * item.quantity).toFixed(2)} DA
                  </p>
                  {item.originalPrice && item.price !== item.originalPrice && (
                    <span className="text-[8px] bg-amber-500 text-white px-1 py-0.2 uppercase font-bold rounded-none">
                      Modifié
                    </span>
                  )}
                </div>
              </div>

              {/* Contrôles de quantité tactiles */}
              <div className="flex items-center bg-main border border-subtle shrink-0">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.id, -1)}
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
                  onClick={() => onUpdateQuantity(item.id, 1)}
                  className="w-8 h-8 flex items-center justify-center text-t-main hover:bg-subtle active:scale-95 rounded-none"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── FOOTER DE CAISSE : REMISES, TOTAL LED & LES 3 BOUTONS ── */}
      <div className="p-3 border-t-2 border-subtle bg-surface shrink-0 space-y-2.5">
        {/* Ligne Remise & Sous-total */}
        <div className="flex justify-between items-center">
          <div className="flex gap-1.5">
            {!discountType ? (
              <>
                <button
                  type="button"
                  onClick={() => onApplyDiscount("percent")}
                  className="px-2.5 py-1 bg-blue-600 text-white text-[9px] font-bold uppercase hover:bg-blue-500 active:scale-95 shadow-md rounded-none"
                >
                  - Remise %
                </button>
                <button
                  type="button"
                  onClick={() => onApplyDiscount("amount")}
                  className="px-2.5 py-1 bg-slate-700 text-white text-[9px] font-bold uppercase hover:bg-slate-600 active:scale-95 shadow-md rounded-none"
                >
                  - Remise DZD
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onRemoveDiscount}
                className="px-2.5 py-1 bg-red-600 text-white text-[9px] font-bold uppercase flex items-center gap-1 shadow-md hover:bg-red-500 rounded-none"
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

        {/* Bandeau Remise */}
        {discountType && (
          <div className="flex justify-between items-center bg-amber-500 text-white p-1.5 shadow-inner rounded-none">
            <span className="text-[10px] uppercase font-bold tracking-widest">
              Remise{" "}
              {discountType === "percent" ? `(${discountValue}%)` : "(Fixe)"}
            </span>
            <span className="font-mono font-bold text-sm">
              - {discountAmount.toFixed(2)} DA
            </span>
          </div>
        )}

        {/* Écran Digital LED */}
        <div className="bg-[#0a0a0a] p-3 border-2 border-slate-800 rounded-none flex justify-between items-center shadow-inner">
          <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
            Total Net
          </span>
          <span className="text-2xl font-mono font-black text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.4)] tracking-wider">
            {finalTotal.toFixed(2)} DA
          </span>
        </div>

        {/* ═══════════════════════════════════════════════════════
            LES 3 BOUTONS ERGONOMIQUES (EXACTEMENT COMME SALON POS)
        ═══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-12 gap-1.5 h-14">
          {/* 1. GRAND BOUTON PRINCIPAL GAUCHE : ENCAISSER & TICKET (8 Cols) */}
          <button
            type="button"
            onClick={() => onCheckout(true)}
            disabled={cart.length === 0 || isProcessing}
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
              onClick={() => onCheckout(false)}
              disabled={cart.length === 0 || isProcessing}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[9px] uppercase tracking-tighter flex items-center justify-center gap-1.5 rounded-none shadow-sm disabled:opacity-40 cursor-pointer active:scale-[0.98]"
              title="Encaisser dans le tiroir sans imprimer de ticket"
            >
              <Banknote size={13} className="text-green-400" />
              <span>Encaisser</span>
            </button>

            {/* Imprimer SEUL (sans encaisser) */}
            <button
              type="button"
              onClick={onPrintOnly}
              disabled={cart.length === 0}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[9px] uppercase tracking-tighter flex items-center justify-center gap-1.5 rounded-none shadow-sm disabled:opacity-40 cursor-pointer active:scale-[0.98]"
              title="Imprimer un ticket provisoire sans toucher à la caisse"
            >
              <Printer size={13} className="text-amber-400" />
              <span>Ticket</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
