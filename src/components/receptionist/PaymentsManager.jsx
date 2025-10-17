"use client";

import { useState, useMemo } from "react";
import { mockTickets, mockServices, mockBarbers } from "../../lib/mockData";
import {
  DollarSign,
  CreditCard,
  Search,
  CheckCircle,
  Ban,
  X,
  Clock,
} from "lucide-react";

export default function PaymentsManager() {
  // Main state for all of today's tickets, this is our "source of truth"
  const [tickets, setTickets] = useState(mockTickets);

  // State for the payment confirmation modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [ticketToPay, setTicketToPay] = useState(null);
  const [priceToPay, setPriceToPay] = useState(0);

  // State for filtering the history table
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBarber, setFilterBarber] = useState("all");

  // --- DERIVED DATA ---
  // Live queue of clients ready to pay
  const pendingPayments = tickets.filter(
    (ticket) => ticket.status === "ready-to-pay"
  );

  // Historical list of completed payments, with filtering applied
  const completedPaymentsHistory = useMemo(() => {
    return tickets
      .filter((ticket) => ticket.status === "completed")
      .filter((ticket) => {
        // Barber filter
        if (filterBarber !== "all" && ticket.barber !== filterBarber) {
          return false;
        }
        // Search filter
        if (
          searchTerm &&
          !ticket.clientName.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false;
        }
        return true;
      });
  }, [tickets, searchTerm, filterBarber]); // Recalculates when source data or filters change

  // --- HANDLERS ---
  const handleOpenPayModal = (ticket) => {
    const service = mockServices.find((s) => s.name === ticket.service);
    setTicketToPay(ticket);
    setPriceToPay(service ? service.price : 0);
    setShowPayModal(true);
  };

  const handleConfirmPayment = () => {
    if (!ticketToPay) return;
    const updatedTickets = tickets.map((t) =>
      t.id === ticketToPay.id ? { ...t, status: "completed" } : t
    );
    setTickets(updatedTickets);
    setShowPayModal(false);
  };

  // --- STATS ---
  const totalRevenueToday = completedPaymentsHistory.reduce((total, ticket) => {
    const service = mockServices.find((s) => s.name === ticket.service);
    return total + (service ? service.price : 0);
  }, 0);

  return (
    <div className="space-y-8">
      {/* --- SECTION 1: LIVE PAYMENT QUEUE --- */}
      <div className="bg-slate-900 border border-slate-800 p-6 ">
        <h2 className="text-xl font-serif font-bold text-amber-400 mb-4 flex items-center gap-3">
          <Clock className="w-6 h-6" />
          Clients Waiting for Payment ({pendingPayments.length})
        </h2>
        {pendingPayments.length === 0 ? (
          <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-3">
            <CheckCircle className="w-12 h-12" />
            <p className="font-medium text-lg">Payment queue is clear!</p>
            <p>
              Clients will appear here after the barber finishes their service.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingPayments.map((ticket) => {
              const service = mockServices.find(
                (s) => s.name === ticket.service
              );
              const price = service ? service.price : 0;
              return (
                <div
                  key={ticket.id}
                  className="bg-slate-800/50 border border-amber-500/30  p-4 flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-lg text-slate-100">
                        {ticket.clientName}
                      </p>
                      <p className="text-slate-400 text-sm font-mono">
                        #{ticket.id}
                      </p>
                    </div>
                    <p className="text-sm text-slate-300">
                      <span className="text-slate-500">From:</span>{" "}
                      {ticket.barber}
                    </p>
                    <p className="text-sm text-slate-300">
                      <span className="text-slate-500">Service:</span>{" "}
                      {ticket.service}
                    </p>
                  </div>
                  <div className="border-t border-slate-700 mt-4 pt-3 flex items-center justify-between">
                    <p className="text-lg text-amber-400 font-bold">Total:</p>
                    <p className="text-2xl font-bold font-mono text-amber-400">
                      ${price.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenPayModal(ticket)}
                    className="mt-4 w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-2  transition-all"
                  >
                    Process Payment
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- SECTION 2: TODAY'S TRANSACTION HISTORY --- */}
      <div className="bg-slate-900 border border-slate-800 ">
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-amber-400">
                Today's Completed Transactions
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Total Revenue from {completedPaymentsHistory.length} completed
                services:{" "}
                <span className="font-bold text-green-400">
                  ${totalRevenueToday.toFixed(2)}
                </span>
              </p>
            </div>
            {/* Filter controls */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute top-1/2 left-3 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-sm  px-3 py-2 pl-9 w-48"
                />
              </div>
              <select
                value={filterBarber}
                onChange={(e) => setFilterBarber(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-sm  px-3 py-2"
              >
                <option value="all">All Barbers</option>
                {mockBarbers.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50">
              {/* Table header remains the same */}
              <tr className="border-b border-slate-700">
                <th className="text-left py-4 px-6 text-slate-400 font-medium">
                  Ticket ID
                </th>
                <th className="text-left py-4 px-6 text-slate-400 font-medium">
                  Client Name
                </th>
                <th className="text-left py-4 px-6 text-slate-400 font-medium">
                  Barber
                </th>
                <th className="text-left py-4 px-6 text-slate-400 font-medium">
                  Service
                </th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">
                  Amount Paid
                </th>
              </tr>
            </thead>
            <tbody>
              {completedPaymentsHistory.length > 0 ? (
                completedPaymentsHistory.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-800">
                    <td className="py-4 px-6 text-slate-400 font-mono">
                      #{payment.id}
                    </td>
                    <td className="py-4 px-6 text-slate-100 font-medium">
                      {payment.clientName}
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      {payment.barber}
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      {payment.service}
                    </td>
                    <td className="py-4 px-6 text-right text-green-400 font-semibold font-mono">
                      $
                      {mockServices
                        .find((s) => s.name === payment.service)
                        ?.price.toFixed(2) || "0.00"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Ban className="w-8 h-8" />
                      <p>No completed payments match your filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal (same as dashboard) */}
      {showPayModal && ticketToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-500/30 w-full max-w-md  shadow-2xl">
            <button
              onClick={() => setShowPayModal(false)}
              className="absolute top-4 right-4 text-slate-400"
            >
              <X />
            </button>
            {/* Modal Content - same logic as before */}
            <div className="p-6 pt-8 text-center">
              <h3 className="text-2xl font-serif font-bold text-slate-100">
                Confirm Payment
              </h3>
              <p className="text-lg text-amber-400 font-bold font-mono my-4">
                ${priceToPay.toFixed(2)}
              </p>
              <button
                onClick={handleConfirmPayment}
                className="w-full bg-green-600 text-white font-bold py-3 "
              >
                Confirm Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
