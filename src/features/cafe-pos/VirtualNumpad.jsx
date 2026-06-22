import React from "react";
import { Delete, Check } from "lucide-react";

export default function VirtualNumpad({ value, onChange, onEnter, onCancel }) {
  const handlePress = (num) => {
    // Empêcher plusieurs points ou des zéros inutiles
    if (num === "." && value.includes(".")) return;
    if (value === "0" && num !== ".") {
      onChange(num);
    } else {
      onChange(value + num);
    }
  };

  const handleBackspace = () => {
    onChange(value.length > 1 ? value.slice(0, -1) : "0");
  };

  const handleClear = () => onChange("0");

  // Style de base pour les touches numériques (Gros boutons gris mat, texte contrasté)
  const numBtnClass =
    "bg-slate-800 border-b-4 border-slate-900 text-slate-100 text-3xl font-bold font-mono py-6 active:translate-y-1 active:border-b-0 active:bg-slate-700 transition-all select-none touch-manipulation rounded-sm shadow-md";

  return (
    <div className="w-full max-w-sm mx-auto bg-slate-950 p-6 border-4 border-slate-800 shadow-2xl rounded-xl">
      {/* Écran Digital (Le Display) */}
      <div className="bg-[#0a0a0a] border-4 border-slate-900 p-4 mb-6 shadow-inner relative flex flex-col justify-end">
        <span className="text-[10px] uppercase font-bold text-slate-500 absolute top-2 left-3 tracking-widest">
          Saisie en cours
        </span>
        <div className="text-right text-4xl font-mono font-black text-[#00ff00] drop-shadow-[0_0_5px_rgba(0,255,0,0.3)] tracking-wider mt-4 h-10 flex items-center justify-end overflow-hidden">
          {value}
        </div>
      </div>

      {/* Grille du Pavé Numérique */}
      <div className="grid grid-cols-4 gap-3">
        {/* Ligne 1 */}
        <button className={numBtnClass} onClick={() => handlePress("7")}>
          7
        </button>
        <button className={numBtnClass} onClick={() => handlePress("8")}>
          8
        </button>
        <button className={numBtnClass} onClick={() => handlePress("9")}>
          9
        </button>

        {/* Bouton Effacer Tout (C) */}
        <button
          className="bg-red-600 border-b-4 border-red-800 text-white text-2xl font-bold py-6 active:translate-y-1 active:border-b-0 active:bg-red-500 transition-all select-none touch-manipulation rounded-sm shadow-md"
          onClick={handleClear}
        >
          C
        </button>

        {/* Ligne 2 */}
        <button className={numBtnClass} onClick={() => handlePress("4")}>
          4
        </button>
        <button className={numBtnClass} onClick={() => handlePress("5")}>
          5
        </button>
        <button className={numBtnClass} onClick={() => handlePress("6")}>
          6
        </button>

        {/* Bouton Retour Arrière (Backspace) */}
        <button
          className="bg-slate-700 border-b-4 border-slate-900 text-slate-300 py-6 flex justify-center items-center active:translate-y-1 active:border-b-0 active:bg-slate-600 transition-all select-none touch-manipulation rounded-sm shadow-md"
          onClick={handleBackspace}
        >
          <Delete size={28} />
        </button>

        {/* Ligne 3 */}
        <button className={numBtnClass} onClick={() => handlePress("1")}>
          1
        </button>
        <button className={numBtnClass} onClick={() => handlePress("2")}>
          2
        </button>
        <button className={numBtnClass} onClick={() => handlePress("3")}>
          3
        </button>

        {/* Gros bouton Valider (Prend 2 lignes de hauteur) */}
        <button
          className="row-span-2 bg-green-600 border-b-4 border-green-800 text-white font-bold text-lg flex flex-col justify-center items-center gap-2 uppercase tracking-widest active:translate-y-1 active:border-b-0 active:bg-green-500 transition-all select-none touch-manipulation rounded-sm shadow-md"
          onClick={onEnter}
        >
          <Check size={28} />
          OK
        </button>

        {/* Ligne 4 */}
        <button className={numBtnClass} onClick={() => handlePress("0")}>
          0
        </button>
        <button className={numBtnClass} onClick={() => handlePress("00")}>
          00
        </button>
        <button className={numBtnClass} onClick={() => handlePress(".")}>
          .
        </button>
      </div>

      {/* Bouton Annuler global (Sous le pavé) */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="w-full mt-6 py-4 bg-slate-900 border-2 border-slate-800 text-slate-400 font-bold uppercase text-sm tracking-widest hover:text-white hover:bg-slate-800 transition-colors rounded-sm"
        >
          Annuler & Fermer
        </button>
      )}
    </div>
  );
}
