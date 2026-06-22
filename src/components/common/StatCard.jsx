export default function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  highlight,
}) {
  return (
    <div
      className={`bg-surface border p-6 transition-all duration-100 ${
        highlight ? "border-brand shadow-lg shadow-brand/10" : "border-subtle"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-t-muted text-sm font-medium transition-colors duration-100">
            {label}
          </p>
          <p
            className={`text-3xl font-bold mt-2 transition-colors duration-100 ${
              highlight ? "text-brand" : "text-t-main"
            }`}
          >
            {value}
          </p>
        </div>
        {Icon && <Icon className={`w-8 h-8 ${colorClass}`} />}
      </div>
    </div>
  );
}
