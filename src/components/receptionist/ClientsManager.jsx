"use client";

import { useState } from "react";
import { mockTickets, mockBarbers } from "../../lib/mockData";
import { Plus, Users, Clock, CheckCircle } from "lucide-react";

export default function ClientsManager() {
  // This component now manages the day's tickets, not a persistent client list
  const [tickets, setTickets] = useState(mockTickets);

  // State for the new quick-add form
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [selectedBarber, setSelectedBarber] = useState("");

  const handleAddTicket = () => {
    if (!selectedBarber) {
      alert("Please assign a barber.");
      return;
    }

    // A ticket represents a client visit for the day
    const newTicket = {
      id: tickets.length + 1,
      clientName: clientName || "Walk-in Client", // Name is optional
      phone: clientPhone, // Phone is optional
      barber:
        mockBarbers.find((b) => b.id === Number.parseInt(selectedBarber))
          ?.name || "",
      status: "waiting",
      service: "",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setTickets([...tickets, newTicket]);

    // Reset form fields
    setClientName("");
    setClientPhone("");
    setSelectedBarber("");
  };

  // --- STATS FOR TODAY'S CLIENTS ---
  const stats = [
    {
      label: "Total Clients Today",
      value: tickets.length,
      icon: Users,
      color: "text-yellow-400",
    },
    {
      label: "Currently Waiting",
      value: tickets.filter(
        (t) => t.status === "waiting" || t.status === "in-progress"
      ).length,
      icon: Clock,
      color: "text-yellow-400",
    },
    {
      label: "Services Completed",
      value: tickets.filter((t) => t.status === "completed").length,
      icon: CheckCircle,
      color: "text-green-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* --- STAT CARDS FOR THE DAY --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-900 border border-slate-800 p-6 "
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-lg">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-100 mt-2">
                  {stat.value}
                </p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- ADD CLIENT TO QUEUE FORM --- */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6  self-start">
          <h2 className="text-xl font-serif font-bold text-amber-400 mb-4">
            Add Client to Queue
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Client Name (Optional)
              </label>
              <input
                placeholder="e.g., Jane Smith"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100  px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Phone Number (Optional)
              </label>
              <input
                placeholder="e.g., 555-1234"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100  px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Assign to Barber
              </label>
              <select
                value={selectedBarber}
                onChange={(e) => setSelectedBarber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100  px-3 py-2"
              >
                <option value="">Select barber...</option>
                {mockBarbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="pt-2">
              <button
                onClick={handleAddTicket}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold  px-3 py-2 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add to Queue
              </button>
            </div>
          </div>
        </div>

        {/* --- TODAY'S CLIENTS LIST --- */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 ">
          <h2 className="text-xl font-serif font-bold text-amber-400 mb-4">
            Today's Client Queue
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">
                    Ticket
                  </th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">
                    Client
                  </th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">
                    Phone
                  </th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">
                    Assigned Barber
                  </th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">
                    Time
                  </th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-slate-800 hover:bg-slate-800/50"
                  >
                    <td className="py-3 px-4 text-slate-100 font-medium">
                      #{ticket.id}
                    </td>
                    <td className="py-3 px-4 text-slate-100 font-medium">
                      {ticket.clientName}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {ticket.phone || "N/A"}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {ticket.barber}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{ticket.time}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 text-xs font-medium ${
                          ticket.status === "completed"
                            ? "bg-green-900/30 text-green-400"
                            : ticket.status === "in-progress"
                            ? "bg-blue-900/30 text-blue-400"
                            : "bg-yellow-900/30 text-yellow-400"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
