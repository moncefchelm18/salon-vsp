import { X } from "lucide-react";

export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-brand/50 w-full max-w-1/2 shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200 relative theme-transition">
        {" "}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-t-muted hover:text-t-main transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
}
