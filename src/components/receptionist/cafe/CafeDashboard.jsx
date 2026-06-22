import { DollarSign, Coffee } from "lucide-react";
// You can add recharts here later for graphs

export default function CafeDashboard() {
  // These would be calculated from real data
  const revenueToday = 450.75;
  const ordersToday = 85;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          icon={DollarSign}
          label="Cafeteria Revenue Today"
          value={`DZD ${revenueToday.toFixed(2)}`}
        />
        <StatCard icon={Coffee} label="Orders Today" value={ordersToday} />
      </div>
      <div className="bg-slate-900 border border-slate-800 p-6">
        <h2 className="text-xl font-serif text-orange-400 mb-4">
          Recent Activity
        </h2>
        <p className="text-slate-400">
          A list of recent orders or a sales chart would go here.
        </p>
      </div>
    </div>
  );
}

// Reusable Stat Card Component
const StatCard = ({ icon: Icon, label, value }) => (
  <div className="bg-slate-900 border border-slate-800 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-sm">{label}</p>
        <p className="text-3xl font-bold text-slate-100 mt-2">{value}</p>
      </div>
      <Icon className="w-8 h-8 text-orange-400" />
    </div>
  </div>
);
