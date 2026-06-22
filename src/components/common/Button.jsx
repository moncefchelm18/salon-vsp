import React from "react";

export default function Button({
  children,
  onClick,
  variant = "primary",
  fullWidth = false,
  disabled = false,
  className = "",
  type = "button",
}) {
  // Core classes applied to ALL buttons: No rounded corners, bold, animated click
  const baseClasses =
    "inline-flex items-center justify-center gap-2 px-4 py-2.5 font-bold uppercase text-xs tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 active:scale-[0.98] rounded-none focus:outline-none cursor-pointer";

  const widthClass = fullWidth ? "w-full" : "w-fit";

  // Variant-specific styles
  const variants = {
    // The main Brand action button (Automatically Gold or Pink)
    primary:
      "bg-brand hover:opacity-80 text-white border border-brand shadow-lg shadow-brand/20",

    // A secondary dark/light button with a subtle border
    outline:
      "bg-surface border border-subtle text-t-muted hover:text-brand hover:border-brand/50",

    // For deleting/removing items (Stays Red)
    danger:
      "bg-red-500/10 border border-red-500/50 hover:bg-red-500/20 hover:border-red-500 text-red-500",

    // For very minimal actions
    minimal:
      "bg-transparent border border-transparent text-t-muted hover:text-brand hover:bg-subtle",

    // For actions that are not primary but still important
    secondary:
      "bg-surface border border-subtle text-t-main hover:border-brand/50 hover:text-brand",

    // For validating or confirming something important (Stays Green)
    success:
      "bg-green-600 hover:bg-green-500 text-white border border-green-600 shadow-lg shadow-green-500/20",

    // Just text, no borders
    ghost:
      "bg-transparent text-t-muted hover:text-brand border border-transparent hover:bg-subtle",

    // Specific Export Buttons
    csv: "bg-green-500/10 hover:bg-green-500/20 text-green-500 hover:text-green-400 border border-green-500/50",
    pdf: "bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 border border-red-500/50",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${widthClass} ${className}`}
    >
      {children}
    </button>
  );
}
