"use client";

import { useState } from "react";
import logoImage from "../images/logo.png";

export default function LoginForm({ onSubmit, isLoading }) {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!email || !pin) {
      setError("Please fill in all fields");
      return;
    }

    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }

    onSubmit(email, pin);
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="font-serif text-5xl font-bold text-amber-400 mb-2">
          Sallon Picasso
        </h1>
        <p className="text-slate-400 text-sm tracking-wide">
          LUXURY BARBERSHOP MANAGEMENT
        </p>
        <img
          src={logoImage}
          alt="Sallon Picasso Logo"
          className="mx-auto mt-4 w-24 h-24"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 shadow-2xl ">
        <div className="p-8">
          <h2 className="text-2xl font-serif font-bold text-slate-100 mb-6 text-center">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500  px-3 py-2"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                PIN
              </label>
              <input
                type="password"
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.slice(0, 4))}
                maxLength={4}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500  px-3 py-2"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-2  text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold py-2 mt-6  disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center mb-3">
              Demo Credentials:
            </p>
            <div className="space-y-2 text-xs text-slate-400">
              <p>
                <span className="text-amber-400">Receptionist:</span>{" "}
                receptionist@gmail.com / 0000
              </p>
              <p>
                <span className="text-amber-400">Barber:</span>{" "}
                barbers@gmail.com / 0000
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
