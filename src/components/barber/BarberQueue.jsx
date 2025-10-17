"use client"

import { useState } from "react"
import { mockTickets, mockServices, mockProducts } from "../../lib/mockData"
import { CheckCircle, Clock, AlertCircle } from "lucide-react"

export default function BarberQueue({ barberName }) {
  const [tickets, setTickets] = useState(mockTickets)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedProducts, setSelectedProducts] = useState([])

  const barberTickets = tickets.filter((t) => t.barber === barberName)
  const currentTicket = barberTickets.find((t) => t.status === "in-progress")
  const pendingTickets = barberTickets.filter((t) => t.status === "pending")

  const handleStartService = (ticketId) => {
    setSelectedTicket(ticketId)
    setShowServiceModal(true)
  }

  const handleCompleteService = () => {
    if (!selectedTicket || !selectedService) {
      alert("Please select a service")
      return
    }

    setTickets(
      tickets.map((t) =>
        t.id === selectedTicket
          ? { ...t, status: "completed" }
          : t.id === pendingTickets[0]?.id
            ? { ...t, status: "in-progress" }
            : t,
      ),
    )

    setShowServiceModal(false)
    setSelectedTicket(null)
    setSelectedService(null)
    setSelectedProducts([])
  }

  const handleToggleProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((p) => p !== productId) : [...prev, productId],
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Service */}
      {currentTicket && (
        <div className="bg-gradient-to-r from-blue-900/30 to-blue-900/10 border border-blue-700 p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-serif font-bold text-blue-400">Currently Serving</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Client</p>
              <p className="text-lg font-semibold text-slate-100">{currentTicket.clientName}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Service</p>
              <p className="text-lg font-semibold text-slate-100">{currentTicket.service}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Time</p>
              <p className="text-lg font-semibold text-slate-100">{currentTicket.time}</p>
            </div>
          </div>
          <button
            onClick={() => handleStartService(currentTicket.id)}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Complete Service
          </button>
        </div>
      )}

      {/* Queue */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
        <h2 className="text-xl font-serif font-bold text-amber-400 mb-4">Queue ({pendingTickets.length})</h2>
        {pendingTickets.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No pending tickets</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTickets.map((ticket, index) => (
              <div
                key={ticket.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-amber-400/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-amber-400 text-slate-950 font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">
                        {index + 1}
                      </span>
                      <h3 className="text-lg font-semibold text-slate-100">{ticket.clientName}</h3>
                    </div>
                    <p className="text-slate-400 text-sm">{ticket.service}</p>
                  </div>
                  <button
                    onClick={() => handleStartService(ticket.id)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2 rounded"
                  >
                    Start Service
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service Modal */}
      {showServiceModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
            <div className="p-6">
              <h2 className="text-2xl font-serif font-bold text-amber-400 mb-6">Complete Service</h2>

              {/* Service Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-3">Select Service</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {mockServices.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service.id)}
                      className={`p-4 rounded border-2 transition-all text-left ${
                        selectedService === service.id
                          ? "border-amber-400 bg-amber-400/10"
                          : "border-slate-700 bg-slate-800 hover:border-slate-600"
                      }`}
                    >
                      <p className="font-semibold text-slate-100">{service.name}</p>
                      <p className="text-sm text-slate-400">
                        ${service.price} • {service.duration}min
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Products */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-3">Add Products (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {mockProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleToggleProduct(product.id)}
                      className={`p-4 rounded border-2 transition-all text-left ${
                        selectedProducts.includes(product.id)
                          ? "border-green-400 bg-green-400/10"
                          : "border-slate-700 bg-slate-800 hover:border-slate-600"
                      }`}
                    >
                      <p className="font-semibold text-slate-100">{product.name}</p>
                      <p className="text-sm text-slate-400">${product.price}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowServiceModal(false)}
                  className="flex-1 border border-slate-700 text-slate-300 hover:bg-slate-800 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteService}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded"
                >
                  Complete & Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
