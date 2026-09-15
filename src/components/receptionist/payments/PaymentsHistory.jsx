import React, { useMemo } from "react";
import { Search, Receipt, Ban, Eye, Gift, Coins, Tag } from "lucide-react";
import DataTable from "../../common/DataTable";

export default function PaymentsHistory({
  completedPaymentsHistory,
  searchTerm,
  setSearchTerm,
  filterBarber,
  setFilterBarber,
  barbers,
  onViewTicket,
  onOpenPostTip,
}) {
  // ── CALCULS COMPTABLES DÉTAILLÉS EN TEMPS RÉEL ──
  const { totalNetServices, totalTips, totalDiscounts, totalPhysicalCash } =
    useMemo(() => {
      let net = 0;
      let tips = 0;
      let discounts = 0;

      completedPaymentsHistory.forEach((t) => {
        net += Number(t.price || 0);
        tips += Number(t.tip || 0);
        discounts += Number(t.discountAmount || 0);
      });

      return {
        totalNetServices: net,
        totalTips: tips,
        totalDiscounts: discounts,
        totalPhysicalCash: net + tips, // L'argent total qui est physiquement entré dans le tiroir
      };
    }, [completedPaymentsHistory]);

  return (
    <section className="bg-slate-900 border border-slate-800">
      {/* Section Header */}
      <div className="px-6 py-5 border-b border-slate-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4" />
            Transactions du Jour
          </h2>

          {/* ── BANDEAU COMPTABLE ULTRA-DÉTAILLÉ (FINI LES ERREURS) ── */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. TOTAL RÉEL DANS LE TIROIR */}
            <div className="flex items-center gap-2 bg-green-950/40 border-2 border-green-500/50 px-3.5 py-1.5 shadow-sm">
              <Coins size={14} className="text-green-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">
                Total Encaissé (Tiroir) :
              </span>
              <span className="font-mono font-black text-green-400 text-base">
                DZD {totalPhysicalCash.toFixed(2)}
              </span>
            </div>

            {/* 2. DÉTAIL DES PRESTATIONS NETTES */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">
                Prestations :
              </span>
              <span className="font-mono font-bold text-amber-400 text-xs">
                DZD {totalNetServices.toFixed(2)}
              </span>
            </div>

            {/* 3. DÉTAIL DES POURBOIRES */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5">
              <Gift size={12} className="text-emerald-400" />
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">
                Pourboires :
              </span>
              <span className="font-mono font-bold text-emerald-400 text-xs">
                + DZD {totalTips.toFixed(2)}
              </span>
            </div>

            {/* 4. DÉTAIL DES REMISES (S'affiche s'il y a eu au moins une remise) */}
            {totalDiscounts > 0 && (
              <div className="flex items-center gap-1.5 bg-red-950/30 border border-red-500/30 px-3 py-1.5 text-red-400">
                <Tag size={12} className="text-red-400" />
                <span className="text-[9px] uppercase font-bold tracking-wider text-red-400/90">
                  Remises Salon :
                </span>
                <span className="font-mono font-bold text-xs">
                  - DZD {totalDiscounts.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Filtres de recherche */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full xl:w-auto">
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
          { label: "N° Passage" },
          { label: "N° Facture" },
          { label: "Heure" },
          { label: "Client" },
          { label: "Coiffeur" },
          { label: "Prestation" },
          { label: "Pourboire", align: "right" },
          { label: "Net (Salon)", align: "right" }, // Précision "Salon"
          { label: "Actions", align: "right" },
        ]}
      >
        {completedPaymentsHistory.length > 0 ? (
          completedPaymentsHistory.map((payment) => {
            let cafeTotal = 0;
            payment.cafeOrders?.forEach((o) => (cafeTotal += o.totalPrice));

            // Le Net Salon = Le prix total payé - le total du café
            const salonNetPrice = payment.price;
            const originalHaircut = payment.originalPrice ?? payment.price;
            const discount = payment.discountAmount || 0;

            return (
              <tr
                key={payment.id}
                className="border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors group"
              >
                <td className="py-4 px-5 text-amber-500 font-mono font-bold text-sm uppercase">
                  #{payment.queueNumber || payment.id}
                </td>
                <td className="py-4 px-5 text-slate-500 font-mono font-bold text-[10px]">
                  F-{payment.id}
                </td>
                <td className="py-4 px-5 text-slate-400 font-mono text-[10px]">
                  {new Date(payment.createdAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="py-4 px-5 text-slate-200 font-bold text-xs uppercase tracking-wide">
                  {payment.clientName}
                </td>
                <td className="py-4 px-5 text-slate-400 font-bold text-[9px] uppercase tracking-widest">
                  {payment.barber}
                </td>
                <td className="py-4 px-5 text-slate-400 italic text-xs">
                  {payment.service || "—"}
                  {/* Indicateur discret s'il y a du café */}
                  {cafeTotal > 0 && (
                    <span className="block text-[9px] text-amber-500/70 not-italic font-bold mt-0.5">
                      + Consos Café liées
                    </span>
                  )}
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

                <td className="py-4 px-5 text-right">
                  {discount > 0 ? (
                    <div className="flex flex-col items-end leading-tight">
                      <span className="text-slate-500 line-through text-[9px] font-mono">
                        DZD {originalHaircut.toFixed(2)}
                      </span>
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        DZD {salonNetPrice.toFixed(2)}
                      </span>
                      <span className="text-red-400 text-[9px] font-bold">
                        (- DZD {discount.toFixed(2)})
                      </span>
                    </div>
                  ) : (
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      DZD {salonNetPrice.toFixed(2)}
                    </span>
                  )}
                </td>

                <td className="py-4 px-5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onViewTicket(payment)}
                      className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => onOpenPostTip(payment)}
                      className="p-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-all"
                    >
                      <Gift size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan="8" className="py-16 bg-slate-950/30 text-center">
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
