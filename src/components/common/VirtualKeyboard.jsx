import React, { useRef, useEffect } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";

/**
 * Composant de Clavier Virtuel Tactile réutilisable (POS Drawer style)
 *
 * @param {boolean} isOpen - État d'ouverture du clavier
 * @param {function} onClose - Fonction de fermeture du clavier
 * @param {string} value - Valeur actuelle du champ ciblé (pour synchronisation)
 * @param {function} onChange - Fonction de mise à jour de la valeur
 * @param {string} label - Titre affiché en haut du clavier
 */
export default function VirtualKeyboard({
  isOpen,
  onClose,
  value,
  onChange,
  label,
}) {
  const keyboardRef = useRef(null);

  // Synchro cruciale : si la valeur change depuis l'extérieur (clavier physique ou reset),
  // on met à jour l'état interne du clavier virtuel pour qu'il soit toujours synchronisé !
  useEffect(() => {
    if (isOpen && keyboardRef.current && value !== undefined) {
      keyboardRef.current.setInput(value);
    }
  }, [isOpen, value]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-[100] bg-slate-200 border-t-4 border-slate-400 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full duration-300">
      <div className="max-w-4xl mx-auto font-sans">
        {/* Header */}
        <div className="flex justify-between items-center mb-2 px-2">
          <span className="text-xs font-bold uppercase text-slate-600 tracking-widest">
            {label || "Saisie Tactile"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded text-xs uppercase shadow-md active:scale-95 transition-all"
          >
            Masquer le clavier
          </button>
        </div>

        {/* Le Clavier Physique Simulé */}
        <div className="text-black rounded-lg shadow-lg overflow-hidden">
          <Keyboard
            keyboardRef={(r) => (keyboardRef.current = r)}
            onChange={onChange}
            layout={{
              default: [
                "1 2 3 4 5 6 7 8 9 0 {bksp}",
                "q w e r t y u i o p",
                "a s d f g h j k l",
                "{shift} z x c v b n m {shift}",
                "{space}",
              ],
              shift: [
                "! @ # $ % ^ & * ( ) {bksp}",
                "Q W E R T Y U I O P",
                "A S D F G H J K L",
                "{shift} Z X C V B N M {shift}",
                "{space}",
              ],
            }}
            display={{
              "{bksp}": "⌫ Effacer",
              "{space}": "Espace",
              "{shift}": "Majuscules",
            }}
          />
        </div>
      </div>
    </div>
  );
}
