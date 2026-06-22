export default function StatusBadge({ status }) {
  const getStatusStyle = (s) => {
    switch (s) {
      case "completed":
        return "bg-green-900/50 text-green-400 border-green-800";
      case "in-progress":
        return "bg-blue-900/50 text-blue-400 border-blue-800";
      case "waiting":
        return "bg-slate-700 text-slate-300 border-slate-600";
      case "ready-to-pay":
        return "bg-amber-900/50 text-amber-400 border-amber-800 animate-pulse";
      default:
        return "bg-slate-700 text-slate-300 border-slate-600";
    }
  };

  return (
    <span
      className={`px-3 py-1 border text-xs font-bold uppercase tracking-wider ${getStatusStyle(
        status,
      )}`}
    >
      {status.replace(/-/g, " ")}
    </span>
  );
}
