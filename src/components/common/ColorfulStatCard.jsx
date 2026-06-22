import React from "react";

export default function ColorfulStatCard({
  label,
  value,
  icon: Icon,
  colorTheme,
}) {
  // Color presets mapping
  const themes = {
    blue: "bg-blue-500/10 border-blue-500/30 text-blue-500",
    emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-500",
    rose: "bg-rose-500/10 border-rose-500/30 text-rose-500",
    indigo: "bg-indigo-500/10 border-indigo-500/30 text-indigo-500",
    amber: "bg-amber-500/10 border-amber-500/30 text-amber-500",
  };

  const selectedTheme = themes[colorTheme] || themes.blue;

  return (
    <div
      className={`p-5 border-l-4 rounded-r-md transition-all ${selectedTheme} shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">
            {label}
          </p>
          <p className="text-2xl font-mono font-bold">{value}</p>
        </div>
        <div className="p-3 bg-white/5 rounded-full">
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
