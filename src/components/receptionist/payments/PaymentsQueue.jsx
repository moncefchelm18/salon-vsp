import React from "react";
import { Clock, CheckCircle, Coffee, CreditCard } from "lucide-react";

export default function PaymentsQueue({
  pendingPayments,
  isProcessing,
  onVoidPayment,
  onOpenPayModal,
}) {
  return (
    <section className="bg-slate-900 border border-slate-800">
      {/* Section Header */}
      <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-500">
              File d'Encaissement
            </h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mt-0.5">
              {pendingPayments.length} prestation
              {pendingPayments.length !== 1 ? "s" : ""} en attente
            </p>
          </div>
        </div>
        {/* Live pulse indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full bg-amber-500 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
            Live
          </span>
        </div>
      </div>

      <div className="p-6">
        {pendingPayments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 border border-dashed border-slate-800 bg-slate-950/50">
            <CheckCircle className="w-10 h-10 text-slate-600" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Aucune Prestation en Attente
            </p>
            <p className="text-[10px] text-slate-600 uppercase tracking-wider">
              Tous les tickets actifs sont réglés.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pendingPayments.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-slate-950 border border-slate-700/60 hover:border-amber-500/60 flex flex-col justify-between transition-all duration-300 shadow-[0_0_25px_rgba(245,158,11,0.04)] hover:shadow-[0_0_25px_rgba(245,158,11,0.12)] relative group"
              >
                {/* Ticket ID Badge */}
                <div className="absolute top-0 right-0 bg-slate-800 border-b border-l border-slate-700 text-slate-500 font-mono text-[9px] px-2.5 py-1 font-bold tracking-widest">
                  #{ticket.id}
                </div>

                {/* Top Content */}
                <div className="p-5 pb-0">
                  {/* Client Name */}
                  <h3 className="font-bold text-lg text-slate-100 uppercase tracking-tight truncate pr-10 mb-4">
                    {ticket.clientName}
                  </h3>

                  {/* Meta rows */}
                  <div className="space-y-2 pb-4 border-b border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-slate-600">
                        Coiffeur
                      </span>
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                        {ticket.barber}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-slate-600">
                        Service
                      </span>
                      <span className="text-xs text-slate-400 italic truncate pl-4 max-w-[55%] text-right">
                        {ticket.service}
                      </span>
                    </div>

                    {/* Café linked badge */}
                    {ticket.cafeOrders && ticket.cafeOrders.length > 0 && (
                      <div className="flex justify-between items-center pt-1.5 mt-1 border-t border-slate-800/60">
                        <span className="text-[9px] uppercase font-bold tracking-widest flex items-center gap-1.5 text-amber-500/80">
                          <Coffee size={10} /> Café Rattaché
                        </span>
                        <span className="text-[10px] font-mono font-bold text-amber-500/80">
                          + DZD{" "}
                          {ticket.cafeOrders
                            .reduce((sum, o) => sum + o.totalPrice, 0)
                            .toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Content */}
                <div className="p-5 pt-4">
                  {/* Price Block */}
                  <div className="flex items-center justify-between mb-4 bg-amber-500/8 border border-amber-500/20 px-4 py-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-amber-500/80">
                      Total Dû
                    </p>
                    <p className="text-2xl font-bold font-mono text-amber-400">
                      DZD {ticket.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onVoidPayment(ticket)}
                      disabled={isProcessing}
                      className="px-3 py-3 border border-red-900/50 bg-red-950/30 text-red-500 hover:bg-red-900/30 hover:border-red-700 active:scale-95 transition-all disabled:opacity-40 text-[9px] uppercase font-bold tracking-widest"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => onOpenPayModal(ticket)}
                      disabled={isProcessing}
                      className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all text-slate-950 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40 shadow-[0_4px_20px_rgba(245,158,11,0.25)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.4)]"
                    >
                      <CreditCard className="w-4 h-4" />
                      Encaisser
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
