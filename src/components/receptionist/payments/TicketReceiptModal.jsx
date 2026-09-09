import React, { useState, useMemo } from "react";
import { Receipt, Coffee, Printer, Tag } from "lucide-react";
import Modal from "../../common/Modal";
import Button from "../../common/Button";
import ThermalReceipt from "../../common/ThermalReceipt";

export default function TicketReceiptModal({ isOpen, onClose, ticketToView }) {
  const [printTrigger, setPrintTrigger] = useState(0);

  // FIX CRITIQUE 2 : Utiliser useMemo pour que l'objet ne soit pas recréé à l'infini
  const printPayload = useMemo(() => {
    if (!ticketToView) return null;

    const compiledCafeItems = [];
    let cafeTotal = 0;

    ticketToView.cafeOrders?.forEach((order) => {
      cafeTotal += order.totalPrice;
      order.items?.forEach((item) => {
        compiledCafeItems.push({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        });
      });
    });

    // On calcule le prix brut de la coiffure.
    // S'il existe dans la BDD (nouveau système) on le prend, sinon on le déduit (ancien système).
    const calculatedHaircutPrice =
      ticketToView.originalPrice != null
        ? ticketToView.originalPrice
        : ticketToView.price - cafeTotal;

    return {
      ticketId: ticketToView.id,
      clientName: ticketToView.clientName,
      barber: ticketToView.barber,
      service: ticketToView.service,
      haircutPrice: calculatedHaircutPrice,
      items: compiledCafeItems,
      discountAmount: ticketToView.discountAmount || 0,
      tipAmount: ticketToView.tip || 0,
      paidAmount: ticketToView.price,
      unpaidDebt: ticketToView.unpaidAmount || 0,
      grandTotal: ticketToView.price + (ticketToView.tip || 0),
    };
  }, [ticketToView]);

  if (!ticketToView) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="flex flex-col bg-slate-950 max-h-[90vh]">
          {/* Header */}
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

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 border-2 border-slate-800 p-4">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">
                    Client
                  </p>
                  <p className="font-bold text-slate-200 uppercase text-sm tracking-wide">
                    {ticketToView.clientName}
                  </p>
                </div>
                <div className="bg-slate-900 border-2 border-slate-800 p-4">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">
                    Coiffeur
                  </p>
                  <p className="font-bold text-slate-200 uppercase text-sm tracking-wide">
                    {ticketToView.barber}
                  </p>
                </div>
              </div>

              <div className="border border-slate-800">
                {/* PRESTATION COIFFURE (AVEC AFFICHAGE PRIX ORIGINAL) */}
                <div className="flex justify-between items-start px-4 py-3 border-b border-slate-800/60">
                  <div>
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                      Prestation Coiffure
                    </p>
                    <p className="text-[9px] text-slate-600 italic mt-0.5">
                      {ticketToView.service || "Non spécifié"}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    {/* On affiche la valeur issue de notre Memo */}
                    <span className="font-mono font-bold text-slate-300 text-sm">
                      DZD {printPayload.haircutPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* NOUVEAU : AFFICHAGE DE LA REMISE SI ELLE EXISTE */}
                {ticketToView.discountAmount > 0 && (
                  <div className="flex justify-between items-center px-4 py-2.5 bg-red-500/10 border-b border-red-500/20 text-red-400">
                    <span className="text-[10px] font-bold uppercase flex items-center gap-1.5">
                      <Tag size={12} /> Remise Accordée
                    </span>
                    <span className="font-mono font-bold text-xs">
                      - DZD {ticketToView.discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}

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
                    Total Net Facturé
                  </span>
                  <span className="font-mono font-bold text-slate-400 text-xs">
                    DZD {ticketToView.price.toFixed(2)}
                  </span>
                </div>

                {ticketToView.tip > 0 && (
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-green-600">
                      Pourboire (Inclus)
                    </span>
                    <span className="font-mono font-bold text-green-400 text-xs">
                      + DZD {ticketToView.tip.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center bg-[#0a0a0a] p-4 border-4 border-slate-800 rounded-sm mt-4 shadow-inner">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                    Total Payé
                  </span>
                  <span className="text-2xl font-mono font-black text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.4)] tracking-wider">
                    DZD{" "}
                    {(ticketToView.price + (ticketToView.tip || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-4 border-t border-slate-800 shrink-0 bg-slate-950 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="py-4 font-bold"
            >
              Fermer
            </Button>

            <Button
              variant="success"
              onClick={() => setPrintTrigger((prev) => prev + 1)}
              className="py-4 font-bold flex justify-center items-center gap-2"
            >
              <Printer size={16} /> Ré-imprimer
            </Button>
          </div>
        </div>
      </Modal>

      <ThermalReceipt
        type="receipt"
        data={printPayload}
        printTrigger={printTrigger}
      />
    </>
  );
}
