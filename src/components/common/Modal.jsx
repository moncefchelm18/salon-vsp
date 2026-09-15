import { X } from "lucide-react";

export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200 overflow-y-auto">
      {/* max-w-xl et w-full garantissent une largeur parfaite sur mobile et tablette */}
      <div className="bg-surface border border-brand/50 w-full max-w-md sm:max-w-xl shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200 relative theme-transition my-auto rounded-none">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-t-muted hover:text-t-main transition-colors cursor-pointer z-20 p-1"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
}
