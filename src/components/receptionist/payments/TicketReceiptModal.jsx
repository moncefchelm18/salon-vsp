import React from "react";
import { Receipt, Coffee } from "lucide-react";
import Modal from "../../common/Modal";
import Button from "../../common/Button";

export default function TicketReceiptModal({ isOpen, onClose, ticketToView }) {
  if (!ticketToView) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col bg-slate-950 max-h-[90vh]">
        {/* Receipt Header */}
        <div className="px-6 pt-8 pb-6 border-b border-dashed border-slate-800 text-center shrink-0">
          <div className="w-10 h-10 bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-100 mb-1">
            Détail de Facture
          </h3>
          <p className="text-[10px] text-slate-600 font-mono">
            N° {ticketToView.id} —{" "}
            {new Date(ticketToView.createdAt).toLocaleString("fr-FR", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 px-4 py-3">
                <p className="text-[9px] uppercase font-bold tracking-widest text-slate-600 mb-1">
                  Client
                </p>
                <p className="font-bold text-slate-200 uppercase text-sm tracking-wide">
                  {ticketToView.clientName}
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 px-4 py-3">
                <p className="text-[9px] uppercase font-bold tracking-widest text-slate-600 mb-1">
                  Coiffeur
                </p>
                <p className="font-bold text-slate-200 uppercase text-sm tracking-wide">
                  {ticketToView.barber}
                </p>
              </div>
            </div>

            <div className="border border-slate-800">
              {/* Haircut */}
              <div className="flex justify-between items-start px-4 py-3 border-b border-slate-800/60">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-300">
                    Prestation Coiffure
                  </p>
                  <p className="text-[9px] text-slate-600 italic mt-0.5">
                    {ticketToView.service || "Non spécifié"}
                  </p>
                </div>
                <span className="font-mono font-bold text-slate-300 text-sm">
                  DZD{" "}
                  {(
                    ticketToView.price -
                    (ticketToView.cafeOrders?.reduce(
                      (acc, o) => acc + o.totalPrice,
                      0,
                    ) || 0)
                  ).toFixed(2)}
                </span>
              </div>

              {/* Café items */}
              {ticketToView.cafeOrders?.map((order) =>
                order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center px-4 py-3 border-b border-slate-800/60"
                  >
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-amber-500/80 flex items-center gap-1.5">
                        <Coffee size={9} className="text-amber-500" />
                        {item.name}
                      </p>
                      <p className="text-[9px] text-slate-600 font-mono mt-0.5">
                        {item.quantity} × DZD {item.price.toFixed(2)}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-amber-500/80 text-sm">
                      DZD {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                )),
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[9px] uppercase tracking-widest font-bold text-slate-600">
                  Sous-Total
                </span>
                <span className="font-mono font-bold text-slate-400 text-xs">
                  DZD {ticketToView.price.toFixed(2)}
                </span>
              </div>

              {ticketToView.tip > 0 && (
                <div className="flex justify-between items-center px-1">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-green-600">
                    Pourboire
                  </span>
                  <span className="font-mono font-bold text-green-400 text-xs">
                    + DZD {ticketToView.tip.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center bg-amber-500/8 border border-amber-500/20 px-5 py-4 mt-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500">
                  Total Payé
                </span>
                <span className="text-xl font-mono font-bold text-amber-400">
                  DZD{" "}
                  {(ticketToView.price + (ticketToView.tip || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-slate-800 shrink-0 bg-slate-950">
          <button
            onClick={onClose}
            className="w-full py-4 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 active:scale-[0.99] transition-all text-[9px] uppercase font-bold tracking-widest"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}
