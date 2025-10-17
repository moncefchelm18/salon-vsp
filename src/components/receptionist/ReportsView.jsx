"use client";

import { useState, useMemo } from "react";
import { generateRealisticTickets } from "../../lib/generateMockData";
import { mockTickets, mockServices, mockBarbers } from "../../lib/mockData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { DollarSign, Ticket, Users, FileDown, FileText } from "lucide-react";
import {
  isWithinInterval,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  parseISO,
} from "date-fns";

// Import libraries for exporting
import jsPDF from "jspdf";
import "jspdf-autotable";

const COLORS = ["#d4af37", "#f59e0b", "#fbbf24", "#fcd34d", "#fef08a"];

const allTickets = generateRealisticTickets();

// --- CUSTOM TOOLTIP FOR CHARTS ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-3  text-sm shadow-lg">
        <p className="font-bold text-slate-100">{label}</p>
        {payload.map((pld, index) => (
          <p key={index} style={{ color: pld.color }}>
            {`${pld.name}: ${
              pld.dataKey.includes("revenue") ? "$" : ""
            }${pld.value.toFixed(2)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsView() {
  const [filterPeriod, setFilterPeriod] = useState("year"); // 'today', 'week', 'month', 'year'

  // --- 1. DYNAMIC DATA PROCESSING with DATE FILTERING ---
  const reportData = useMemo(() => {
    const now = new Date();
    let interval;
    switch (filterPeriod) {
      case "today":
        interval = { start: startOfDay(now), end: endOfDay(now) };
        break;
      case "week":
        interval = { start: startOfWeek(now), end: endOfWeek(now) };
        break;
      case "month":
        interval = { start: startOfMonth(now), end: endOfMonth(now) };
        break;
      default:
        interval = { start: startOfYear(now), end: endOfYear(now) };
        break; // 'year'
    }

    const completedTickets = allTickets.filter((ticket) => {
      return (
        ticket.status === "completed" &&
        isWithinInterval(parseISO(ticket.createdAt), interval)
      );
    });

    // ... all the previous calculations remain the same ...
    const totalRevenue = completedTickets.reduce(
      (sum, t) =>
        sum + (mockServices.find((s) => s.name === t.service)?.price || 0),
      0
    );
    const totalTicketsSold = completedTickets.length;
    const avgTransaction =
      totalTicketsSold > 0 ? totalRevenue / totalTicketsSold : 0;

    const revenuePerBarber = mockBarbers
      .map((barber) => ({
        name: barber.name,
        revenue: completedTickets
          .filter((t) => t.barber === barber.name)
          .reduce(
            (sum, t) =>
              sum +
              (mockServices.find((s) => s.name === t.service)?.price || 0),
            0
          ),
      }))
      .filter((b) => b.revenue > 0);

    const serviceDataForChart = Object.entries(
      completedTickets.reduce((acc, t) => {
        if (t.service) acc[t.service] = (acc[t.service] || 0) + 1;
        return acc;
      }, {})
    )
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value);

    return {
      totalRevenue,
      totalTicketsSold,
      avgTransaction,
      revenuePerBarber,
      serviceDataForChart,
      detailedTransactions: completedTickets,
    };
  }, [filterPeriod]); // RE-RUNS whenever the filterPeriod changes!

  // --- 2. EXPORT HANDLERS ---
  const handleExportCSV = () => {
    const headers = "TicketID,Client,Barber,Service,Price,Date\n";
    const rows = reportData.detailedTransactions
      .map((t) => {
        const service = mockServices.find((s) => s.name === t.service);
        // NOTE: We simulate a date here, a real app would use the actual transaction timestamp
        return `${t.id},"${t.clientName}","${t.barber}","${t.service}",${
          service ? service.price : 0
        },"${new Date().toLocaleDateString()}"`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "sallon_picasso_report.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.text("Sallon Picasso - Sales Report", 14, 22);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableColumn = [
      "Ticket ID",
      "Client",
      "Barber",
      "Service",
      "Price ($)",
    ];
    const tableRows = reportData.detailedTransactions.map((t) => {
      const service = mockServices.find((s) => s.name === t.service);
      return [
        t.id,
        t.clientName,
        t.barber,
        t.service,
        service ? service.price.toFixed(2) : "0.00",
      ];
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      headStyles: { fillColor: [212, 175, 55] }, // Amber color for header
      styles: { font: "helvetica", fontSize: 10 },
    });

    const finalY = doc.previousAutoTable.finalY;
    doc.setFontSize(12);
    doc.text(
      `Total Revenue: $${reportData.totalRevenue.toFixed(2)}`,
      14,
      finalY + 10
    );

    doc.save("sallon_picasso_report.pdf");
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 ">
        <h2 className="text-xl font-serif font-bold text-slate-100">
          Sales Report
        </h2>
        <div className="flex items-center gap-2 p-1 bg-slate-800 ">
          {["Today", "Week", "Month", "Year"].map((period) => {
            const id = period.toLowerCase();
            return (
              <button
                key={id}
                onClick={() => setFilterPeriod(id)}
                className={`px-4 py-1.5 text-sm font-semibold  transition-colors ${
                  filterPeriod === id
                    ? "bg-amber-500 text-slate-950"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                {period}
              </button>
            );
          })}
        </div>
      </div>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${reportData.totalRevenue.toFixed(2)}`}
        />
        <StatCard
          icon={Ticket}
          label="Total Services Sold"
          value={reportData.totalTicketsSold}
        />
        <StatCard
          icon={Users}
          label="Avg. Transaction"
          value={`$${reportData.avgTransaction.toFixed(2)}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Main Charts */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 p-6 ">
          <h2 className="text-xl font-serif font-bold text-amber-400 mb-4">
            Revenue per Barber
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={reportData.revenuePerBarber}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(212, 175, 55, 0.1)" }}
              />
              <Bar
                dataKey="revenue"
                fill="#d4af37"
                name="Revenue"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 ">
          <h2 className="text-xl font-serif font-bold text-amber-400 mb-4">
            Service Popularity
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData.serviceDataForChart}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#d4af37"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
              >
                {reportData.serviceDataForChart.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Transactions & Export Section */}
      <div className="bg-slate-900 border border-slate-800 ">
        <div className="p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-serif font-bold text-amber-400">
              Detailed Transaction Log
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              A complete list of all completed sales.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportCSV}
              className="bg-green-800/50 hover:bg-green-800/80 text-green-300 font-semibold px-4 py-2  flex items-center gap-2"
            >
              <FileText size={16} /> Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="bg-red-800/50 hover:bg-red-800/80 text-red-300 font-semibold px-4 py-2  flex items-center gap-2"
            >
              <FileDown size={16} /> Download PDF
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="py-3 px-6 text-left text-slate-400">Ticket #</th>
                <th className="py-3 px-6 text-left text-slate-400">Client</th>
                <th className="py-3 px-6 text-left text-slate-400">Barber</th>
                <th className="py-3 px-6 text-left text-slate-400">Service</th>
                <th className="py-3 px-6 text-right text-slate-400">Price</th>
              </tr>
            </thead>
            <tbody>
              {reportData.detailedTransactions.map((ticket) => {
                const service = mockServices.find(
                  (s) => s.name === ticket.service
                );
                return (
                  <tr
                    key={ticket.id}
                    className="border-t border-slate-800 hover:bg-slate-800/30"
                  >
                    <td className="py-3 px-6 text-slate-400 font-mono">
                      #{ticket.id}
                    </td>
                    <td className="py-3 px-6 text-slate-100 font-medium">
                      {ticket.clientName}
                    </td>
                    <td className="py-3 px-6 text-slate-300">
                      {ticket.barber}
                    </td>
                    <td className="py-3 px-6 text-slate-300">
                      {ticket.service}
                    </td>
                    <td className="py-3 px-6 text-right text-amber-400 font-mono font-semibold">
                      ${service ? service.price.toFixed(2) : "0.00"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- REUSABLE STAT CARD COMPONENT ---
const StatCard = ({ icon: Icon, label, value }) => (
  <div className="bg-slate-900 border border-slate-800 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-sm">{label}</p>
        <p className="text-3xl font-bold text-slate-100 mt-2">{value}</p>
      </div>
      <Icon className="w-8 h-8 text-amber-400" />
    </div>
  </div>
);
