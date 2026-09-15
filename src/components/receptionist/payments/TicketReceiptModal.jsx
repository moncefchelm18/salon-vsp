import React, { useState, useMemo } from "react";
import { Receipt, Coffee, Printer, Tag, Scissors } from "lucide-react";
import Modal from "../../common/Modal";
import Button from "../../common/Button";
import ThermalReceipt from "../../common/ThermalReceipt";

export default function TicketReceiptModal({ isOpen, onClose, ticketToView }) {
  const [printTrigger, setPrintTrigger] = useState(0);

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

    const haircutGrossPrice =
      ticketToView.originalPrice != null
        ? ticketToView.originalPrice
        : ticketToView.price;
    const discount = ticketToView.discountAmount || 0;

    // Le prix payé pour la partie Salon
    const salonNetPrice = ticketToView.price;

    // Le prix total du ticket entier
    const grandTotal = salonNetPrice + cafeTotal;
    const tip = ticketToView.tip || 0;

    return {
      ticketId: ticketToView.id,
      queueNumber: ticketToView.queueNumber || ticketToView.id,
      clientName: ticketToView.clientName,
      barber: ticketToView.barber,
      service: ticketToView.service,
      haircutPrice: haircutGrossPrice,
      items: compiledCafeItems,
      cafeTotal: cafeTotal,
      discountAmount: discount,
      salonNetPrice: salonNetPrice,
      tipAmount: tip,
      paidAmount: grandTotal + tip,
      unpaidDebt: ticketToView.unpaidAmount || 0,
      grandTotal: grandTotal,
    };
  }, [ticketToView]);

  if (!ticketToView || !printPayload) return null;

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
              Détail de la Facture
            </h3>
            <p className="text-[10px] text-slate-500 font-mono font-bold tracking-widest">
              FACTURE #{printPayload.ticketId} — TICKET #
              {printPayload.queueNumber}
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
                    {printPayload.clientName}
                  </p>
                </div>
                <div className="bg-slate-900 border-2 border-slate-800 p-4">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">
                    Coiffeur
                  </p>
                  <p className="font-bold text-slate-200 uppercase text-sm tracking-wide">
                    {printPayload.barber}
                  </p>
                </div>
              </div>

              {/* 1. ESPACE COIFFURE */}
              <div className="border border-brand/40 bg-brand/5 shadow-inner">
                <div className="px-4 py-3 border-b border-brand/20 bg-brand/10">
                  <span className="text-xs font-bold text-brand uppercase tracking-widest flex items-center gap-2">
                    <Scissors size={14} /> Pôle Coiffure (Salon)
                  </span>
                </div>

                <div className="flex justify-between items-start px-4 py-3 border-b border-brand/20">
                  <div>
                    <p className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                      {printPayload.service || "Non spécifié"}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-slate-300 text-sm">
                    DZD {printPayload.haircutPrice.toFixed(2)}
                  </span>
                </div>

                {printPayload.discountAmount > 0 && (
                  <div className="flex justify-between items-center px-4 py-2.5 bg-red-500/10 text-red-400">
                    <span className="text-[10px] font-bold uppercase flex items-center gap-1.5">
                      <Tag size={12} /> Remise
                    </span>
                    <span className="font-mono font-bold text-xs">
                      - DZD {printPayload.discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center px-4 py-3 bg-brand/10">
                  <span className="text-xs font-bold text-brand uppercase tracking-widest">
                    Net Coiffure
                  </span>
                  <span className="text-base font-bold font-mono text-brand">
                    DZD {printPayload.salonNetPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* 2. ESPACE CAFÉTÉRIA (Seulement s'il y a des consos) */}
              {printPayload.items.length > 0 && (
                <div className="border border-slate-800 bg-slate-900/40">
                  <div className="px-4 py-3 border-b border-slate-800 bg-slate-900">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                      <Coffee size={14} /> Pôle Cafétéria
                    </span>
                  </div>

                  {printPayload.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center px-4 py-2.5 border-b border-slate-800"
                    >
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-300">
                          {item.name}
                        </p>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                          {item.quantity} × DZD {item.price.toFixed(2)}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-slate-300 text-sm">
                        DZD {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}

                  <div className="flex justify-between items-center px-4 py-2 bg-slate-900">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Sous-Total Café
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-400">
                      DZD {printPayload.cafeTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* 3. SYNTHÈSE GLOBALE */}
              <div className="space-y-2 mt-6">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
                    Total Global du Ticket (Coiffure + Café)
                  </span>
                  <span className="font-mono font-bold text-slate-400 text-sm">
                    DZD {printPayload.grandTotal.toFixed(2)}
                  </span>
                </div>

                {printPayload.tipAmount > 0 && (
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-500">
                      + Pourboire Coiffeur (Inclus)
                    </span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      + DZD {printPayload.tipAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center bg-[#0a0a0a] p-4 border-4 border-slate-800 rounded-sm mt-4 shadow-inner">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                    Total Perçu en Caisse
                  </span>
                  <span className="text-2xl font-mono font-black text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.4)] tracking-wider">
                    DZD {printPayload.paidAmount.toFixed(2)}
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
              className="py-4 font-bold text-xs uppercase tracking-widest"
            >
              Fermer
            </Button>
            <Button
              variant="success"
              onClick={() => setPrintTrigger((prev) => prev + 1)}
              className="py-4 font-bold flex justify-center items-center gap-2 text-xs uppercase tracking-widest shadow-md"
            >
              <Printer size={15} /> Ré-imprimer
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
