import React from "react";
import { Search, Receipt, Ban, Eye, Gift } from "lucide-react";
import DataTable from "../../common/DataTable";

export default function PaymentsHistory({
  completedPaymentsHistory,
  totalRevenueToday,
  searchTerm,
  setSearchTerm,
  filterBarber,
  setFilterBarber,
  barbers,
  onViewTicket,
  onOpenPostTip,
}) {
  return (
    <section className="bg-slate-900 border border-slate-800">
      {/* Section Header */}
      <div className="px-6 py-5 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2 mb-1">
            <Receipt className="w-3.5 h-3.5" />
            Transactions du Jour
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
              Total Caisse :
            </span>
            <span className="font-mono font-bold text-green-400 text-base border border-green-900/50 bg-green-950/20 px-3 py-0.5">
              DZD {totalRevenueToday.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-600 absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-60 bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2.5 pl-8 rounded-none focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600 font-mono"
            />
          </div>
          <select
            value={filterBarber}
            onChange={(e) => setFilterBarber(e.target.value)}
            className="w-full sm:w-44 bg-slate-950 border border-slate-800 text-xs text-slate-300 px-3 py-2.5 rounded-none focus:outline-none focus:border-amber-500 transition-colors appearance-none font-bold uppercase tracking-wide cursor-pointer"
          >
            <option value="all">Tous les Coiffeurs</option>
            {barbers.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        headers={[
          { label: "Réf." },
          { label: "Client" },
          { label: "Coiffeur" },
          { label: "Prestation" },
          { label: "Pourboire", align: "right" },
          { label: "Montant", align: "right" },
          { label: "Actions", align: "right" },
        ]}
      >
        {completedPaymentsHistory.length > 0 ? (
          completedPaymentsHistory.map((payment) => (
            <tr
              key={payment.id}
              className="border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors group"
            >
              <td className="py-4 px-5 text-slate-600 font-mono font-bold text-[10px]">
                #{payment.id}
              </td>
              <td className="py-4 px-5 text-slate-200 font-bold text-xs uppercase tracking-wide">
                {payment.clientName}
              </td>
              <td className="py-4 px-5 text-slate-400 font-bold text-[9px] uppercase tracking-widest">
                {payment.barber}
              </td>
              <td className="py-4 px-5 text-slate-400 italic text-xs">
                {payment.service || "—"}
              </td>
              <td className="py-4 px-5 text-right font-mono font-bold text-[10px]">
                {payment.tip > 0 ? (
                  <span className="text-green-400">
                    + DZD {payment.tip.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-slate-700">—</span>
                )}
              </td>
              <td className="py-4 px-5 text-right font-mono font-bold text-amber-400 text-sm">
                DZD {(payment.price || 0).toFixed(2)}
              </td>
              <td className="py-4 px-5 text-right">
                <div className="flex items-center justify-end gap-1">
                  {/* Utilisation de boutons secondaires solides au lieu de ghosts */}
                  <button
                    onClick={() => onViewTicket(payment)}
                    title="Voir les détails"
                    className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white active:scale-95 transition-all"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => onOpenPostTip(payment)}
                    title="Ajouter un pourboire"
                    className="p-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white active:scale-95 transition-all"
                  >
                    <Gift size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="7" className="py-16 bg-slate-950/30 text-center">
              <Ban className="w-7 h-7 text-slate-800 mx-auto mb-3" />
              <p className="font-bold uppercase tracking-widest text-[10px] text-slate-600">
                Aucun paiement enregistré aujourd'hui.
              </p>
            </td>
          </tr>
        )}
      </DataTable>
    </section>
  );
}
