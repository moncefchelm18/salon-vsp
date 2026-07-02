import React from "react";
import Modal from "./Modal";
import Button from "./Button";
import { AlertTriangle } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmation requise",
  message = "Êtes-vous sûr de vouloir continuer ?",
  confirmText = "Confirmer",
  cancelText = "Annuler",
  isDanger = true,
}) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div
        className={`p-8 bg-slate-950 border-t-4 ${isDanger ? "border-red-500" : "border-amber-500"} max-w-md mx-auto shadow-2xl relative overflow-hidden`}
      >
        {/* Icône d'alerte en filigrane */}
        <div className="absolute -top-6 -right-6 opacity-5 pointer-events-none">
          <AlertTriangle size={150} />
        </div>

        <div className="flex flex-col items-center text-center space-y-4 relative z-10">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${isDanger ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"}`}
          >
            <AlertTriangle size={32} />
          </div>

          <h3 className="text-xl font-bold text-slate-100 uppercase tracking-widest">
            {title}
          </h3>

          <p className="text-sm font-medium text-slate-400 whitespace-pre-line leading-relaxed">
            {message}
          </p>

          <div className="grid grid-cols-2 gap-4 w-full pt-6 mt-4 border-t border-slate-800">
            <Button
              variant="outline"
              onClick={onClose}
              className="py-3 font-bold border-slate-700 text-slate-400"
            >
              {cancelText}
            </Button>
            <Button
              variant={isDanger ? "danger" : "primary"}
              onClick={() => {
                onConfirm();
                onClose(); // Ferme la modale après la confirmation
              }}
              className={`py-3 font-bold ${isDanger ? "bg-red-600 hover:bg-red-500 text-white" : ""}`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
