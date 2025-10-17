"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"
import BarberLogin from "./BarberLogin"
import BarberQueue from "./BarberQueue"

export default function BarberLayout() {
  const [selectedBarber, setSelectedBarber] = useState(null)
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("userEmail")
    setSelectedBarber(null)
    navigate("/")
  }

  if (!selectedBarber) {
    return <BarberLogin onSelectBarber={setSelectedBarber} />
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-amber-400">Sallon Picasso</h1>
            <p className="text-slate-400 text-sm">Barber: {selectedBarber}</p>
          </div>
          <button
            onClick={handleLogout}
            className="border border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent px-4 py-2 rounded flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <BarberQueue barberName={selectedBarber} />
      </main>
    </div>
  )
}
