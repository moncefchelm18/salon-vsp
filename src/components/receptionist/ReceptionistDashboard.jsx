"use client";

import { useState } from "react";
import { mockBarbers, mockTickets, mockServices } from "../../lib/mockData";
import {
  Users,
  Clock,
  CheckCircle,
  DollarSign,
  Plus,
  CreditCard,
  X,
} from "lucide-react";

export default function ReceptionistDashboard() {
  const [tickets, setTickets] = useState(mockTickets);
  const [selectedBarber, setSelectedBarber] = useState("");
  const [clientName, setClientName] = useState("");

  // --- PAYMENT MODAL STATE ---
  const [showPayModal, setShowPayModal] = useState(false);
  const [ticketToPay, setTicketToPay] = useState(null);
  const [priceToPay, setPriceToPay] = useState(0);

  // --- CALCULATE REVENUE ---
  const totalRevenueToday = tickets
    .filter((ticket) => ticket.status === "completed")
    .reduce((total, ticket) => {
      const service = mockServices.find((s) => s.name === ticket.service);
      return total + (service ? service.price : 0);
    }, 0);

  // --- HANDLERS ---
  const handleCreateTicket = () => {
    if (!selectedBarber) {
      alert("Please select a barber.");
      return;
    }

    const newTicket = {
      id: tickets.length > 0 ? Math.max(...tickets.map((t) => t.id)) + 1 : 101,
      clientName: clientName || "Walk-in Client",
      service: "", // Set by barber later
      barber:
        mockBarbers.find((b) => b.id === Number.parseInt(selectedBarber))
          ?.name || "",
      status: "waiting",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setTickets([...tickets, newTicket]);
    setClientName("");
    setSelectedBarber("");
  };

  // Open modal and calculate price
  const handleOpenPayModal = (ticket) => {
    const service = mockServices.find((s) => s.name === ticket.service);
    // In a real app, you'd also add product prices here
    const total = service ? service.price : 0;

    setTicketToPay(ticket);
    setPriceToPay(total);
    setShowPayModal(true);
  };

  // Confirm payment and update status
  const handleConfirmPayment = () => {
    if (!ticketToPay) return;

    const updatedTickets = tickets.map((t) =>
      t.id === ticketToPay.id ? { ...t, status: "completed" } : t
    );

    setTickets(updatedTickets);
    setShowPayModal(false);
    setTicketToPay(null);
    setPriceToPay(0);
  };

  // --- UI HELPERS ---
  const getStatusStyle = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-900/50 text-green-400 border border-green-800";
      case "in-progress":
        return "bg-blue-900/50 text-blue-400 border border-blue-800";
      case "waiting":
        return "bg-slate-700 text-slate-300 border border-slate-600";
      case "ready-to-pay":
        return "bg-amber-900/50 text-amber-400 border border-amber-800 animate-pulse";
      default:
        return "bg-slate-700 text-slate-300";
    }
  };

  const stats = [
    {
      label: "Total Barbers",
      value: mockBarbers.length,
      icon: Users,
      color: "text-yellow-400",
    },
    {
      label: "Waiting/In-Service",
      value: tickets.filter((t) =>
        ["waiting", "in-progress"].includes(t.status)
      ).length,
      icon: Clock,
      color: "text-yellow-400",
    },
    {
      label: "Pending Payments",
      value: tickets.filter((t) => t.status === "ready-to-pay").length,
      icon: CreditCard,
      color: "text-amber-400 border-amber-400",
    },
    {
      label: "Today's Revenue",
      value: `$${totalRevenueToday.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-400",
    },
    // Add a stat for pending payments
  ];

  return (
    <div className="space-y-8 relative">
      {/* Stats Grid - Updated to 4 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`bg-slate-900 border ${
              stat.label === "Pending Payments" && stat.value > 0
                ? "border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                : "border-slate-800"
            } p-6  transition-all`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">
                  {stat.label}
                </p>
                <p
                  className={`text-3xl font-bold mt-2 ${
                    stat.label === "Pending Payments" && stat.value > 0
                      ? "text-amber-400"
                      : "text-slate-100"
                  }`}
                >
                  {stat.value}
                </p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Barber Status Grid */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 ">
          <h2 className="text-xl font-serif font-bold text-amber-400 mb-4">
            Barber Status
          </h2>
          {/* The main changes are in this div's class */}
          <div className="grid grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-2">
            {mockBarbers.map((barber) => {
              const activeTicket = tickets.find(
                (t) => t.barber === barber.name && t.status === "in-progress"
              );
              const isBusy = !!activeTicket;

              return (
                // The classes on this div are changed for a vertical layout
                <div
                  key={barber.id}
                  className={`flex flex-col items-center text-center gap-2 p-4  border transition-colors ${
                    isBusy
                      ? "bg-slate-800/30 border-slate-700"
                      : "bg-slate-800/80 border-slate-600"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={barber.image}
                      alt={barber.name}
                      // Increased image size for better visual appeal
                      className="w-20 h-20 rounded-full object-cover border-4 border-slate-600"
                    />
                    <div
                      className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-slate-800 ${
                        isBusy ? "bg-orange-500" : "bg-green-500"
                      }`}
                    ></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-slate-100">
                      {barber.name}
                    </h3>
                    {isBusy ? (
                      <p className="text-xs text-orange-300">Serving</p>
                    ) : (
                      <p className="text-xs font-semibold text-green-400">
                        Available
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Ticket Form */}
        <div className="bg-slate-900 border border-slate-800 p-6  h-fit">
          <h2 className="text-xl font-serif font-bold text-amber-400 mb-4">
            Quick Add (Walk-in)
          </h2>
          <div className="space-y-4">
            <input
              placeholder="Client Name (Optional)"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100  px-3 py-3 focus:border-amber-500 focus:outline-none transition-colors placeholder:text-slate-500"
            />
            <select
              value={selectedBarber}
              onChange={(e) => setSelectedBarber(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 
               px-3 py-3 focus:border-amber-500 focus:outline-none transition-colors appearance-none"
            >
              <option value="" className="text-slate-500">
                Assign Barber *
              </option>
              {mockBarbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleCreateTicket}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2 shadow-[0_0_10px_rgba(212,175,55,0.2)]"
            >
              <Plus className="w-5 h-5" />
              Print Ticket to Queue
            </button>
          </div>
        </div>
      </div>

      {/* Today's Tickets Table with Actions */}
      <div className="bg-slate-900 border border-slate-800  overflow-hidden">
        <div className="p-6 border-b border-slate-800 bg-slate-800/50">
          <h2 className="text-xl font-serif font-bold text-amber-400">
            Live Flow
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-800/80">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Service Performed</th>
                <th className="px-6 py-4">Barber</th>
                <th className="px-6 py-4">Time In</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {[...tickets]
                .sort((a, b) => b.id - a.id)
                .map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-slate-400">
                      #{ticket.id}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-100">
                      {ticket.clientName}
                    </td>
                    <td className="px-6 py-4 text-slate-300 italic">
                      {ticket.service || "--"}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {ticket.barber}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{ticket.time}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1  text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(
                          ticket.status
                        )}`}
                      >
                        {ticket.status.replace(/-/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {ticket.status === "ready-to-pay" && (
                        <button
                          onClick={() => handleOpenPayModal(ticket)}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold py-2 px-4  flex items-center gap-2 ml-auto shadow-[0_0_10px_rgba(212,175,55,0.3)] transition-all active:scale-95"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Quick Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- PAYMENT MODAL --- */}
      {showPayModal && ticketToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/30 w-full max-w-md  shadow-2xl animate-in zoom-in-95 duration-200 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowPayModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 pt-8 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 bg-amber-900/30 mb-4">
                <DollarSign className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-slate-100 mb-1">
                Confirm Payment
              </h3>
              <p className="text-sm text-slate-400 mb-6">
                Ticket #{ticketToPay.id}
              </p>

              <div className="bg-slate-800 p-4 text-left mb-6 space-y-2 border border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Client:</span>
                  <span className="text-slate-100 font-medium">
                    {ticketToPay.clientName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Barber:</span>
                  <span className="text-slate-100 font-medium">
                    {ticketToPay.barber}
                  </span>
                </div>
                <div className="border-t border-slate-700 my-2 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-100">
                      {ticketToPay.service}
                    </span>
                    <span className="text-slate-100 font-mono">
                      ${priceToPay.toFixed(2)}
                    </span>
                  </div>
                  {/* Future: Add product list here */}
                </div>
                <div className="border-t border-slate-600 pt-3 mt-3 flex justify-between items-center">
                  <span className="text-lg font-bold text-amber-400">
                    Total to Pay
                  </span>
                  <span className="text-2xl font-bold text-amber-400 font-mono">
                    ${priceToPay.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowPayModal(false)}
                  className="py-3 px-4 bg-transparent border border-slate-600 text-slate-300  hover:bg-slate-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPayment}
                  className="py-3 px-4 bg-green-600 hover:bg-green-500 text-white  transition-colors font-bold shadow-[0_0_10px_rgba(22,163,74,0.3)]"
                >
                  Confirm Paid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
