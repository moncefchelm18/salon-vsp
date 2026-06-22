"use client";

import { useState } from "react";
import { mockBarbers } from "../../lib/mockData";
import { AlertCircle } from "lucide-react";

export default function BarberLogin({ onSelectBarber }) {
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    setError("");

    if (!selectedBarber) {
      setError("Please select a barber");
      return;
    }

    if (!pin || pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }

    const barber = mockBarbers.find((b) => b.id === selectedBarber);
    if (barber && barber.pin === pin) {
      onSelectBarber(barber.name);
    } else {
      setError("Invalid PIN");
      setPin("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="bg-slate-900 border border-slate-800 shadow-2xl w-full max-w-md rounded-lg">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl font-bold text-amber-400 mb-2">
              Sallon Picasso
            </h1>
            <p className="text-slate-400 text-sm tracking-wide">BARBER LOGIN</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Select Your Name
              </label>
              <div className="space-y-2">
                {mockBarbers.map((barber) => (
                  <button
                    key={barber.id}
                    onClick={() => {
                      setSelectedBarber(barber.id);
                      setPin("");
                      setError("");
                    }}
                    className={`w-full p-3 rounded border-2 transition-all text-left font-medium ${
                      selectedBarber === barber.id
                        ? "border-amber-400 bg-amber-400/10 text-amber-400"
                        : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    {barber.name}
                  </button>
                ))}
              </div>
            </div>

            {selectedBarber && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Enter PIN
                </label>
                <input
                  type="password"
                  placeholder="Enter 4-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.slice(0, 4))}
                  maxLength={4}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded px-3 py-2"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 rounded flex gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={!selectedBarber}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold py-2 mt-6 rounded disabled:opacity-50"
            >
              Login
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center mb-3">
              Demo PINs:
            </p>
            <div className="space-y-1 text-xs text-slate-400">
              <p>Marco: 1234</p>
              <p>Antonio: 5678</p>
              <p>Giuseppe: 9012</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
