import React from "react";

export default function Input({ label, type = "text", ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-t-muted mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        {...props}
        className="w-full bg-main border border-subtle text-t-main px-4 py-3 focus:border-brand focus:outline-none transition-all duration-300 rounded-none placeholder:text-t-muted/50"
      />
    </div>
  );
}
