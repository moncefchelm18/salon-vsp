"use client";

import { useState } from "react";
import Button from "./common/Button"; // Reusing our master button
import { User, Lock } from "lucide-react";
import logo from "../assets/images/logo.png";

export default function LoginForm({ onSubmit, isLoading }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    console.log("Submitting login form with:", { username, password });
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 4) {
      setError("Password must be at least 4 characters long");
      return;
    }

    onSubmit(username, password);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-8 w-full max-w-md shadow-2xl relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600"></div>

      <div className="flex flex-col items-center mb-8">
        <img
          src={logo}
          alt="Sallon Picasso"
          className="w-20 h-20 object-contain mb-4"
        />
        <h2 className="text-2xl font-serif font-bold text-amber-500 uppercase tracking-widest text-center">
          Système Caisse
        </h2>
        <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mt-2">
          Authentification Requise
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Nom d'utilisateur
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 pl-11 pr-4 py-3 focus:border-amber-500 focus:outline-none transition-colors rounded-none placeholder:text-slate-700 font-bold"
              placeholder="Ex: receptionist"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Mot de passe / Code
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 pl-11 pr-4 py-3 focus:border-amber-500 focus:outline-none transition-colors rounded-none placeholder:text-slate-700 font-bold"
              placeholder="••••"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          className="py-4 shadow-lg shadow-amber-500/20"
          disabled={isLoading}
        >
          {isLoading ? "Vérification..." : "Accéder à la caisse"}
        </Button>
      </form>
    </div>
  );
}
