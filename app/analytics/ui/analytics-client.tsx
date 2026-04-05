"use client";

import { BarChart3, Download, Expand, PieChart, ShoppingCart, TrendingUp, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";

type DateRange = "7d" | "30d" | "quarter" | "year";

type ProductRow = {
  name: string;
  unitsSold: string;
  inventoryLevel: string;
  revenue: string;
  rating: string;
  trend: string;
  trendUp: boolean;
  lowStock?: boolean;
};

const topProducts: ProductRow[] = [
  {
    name: "Wireless Earbuds Pro",
    unitsSold: "1,248",
    inventoryLevel: "Only 4 Left",
    revenue: "$61,152",
    rating: "★★★★☆",
    trend: "+15%",
    trendUp: true,
    lowStock: true,
  },
  {
    name: "Smart Home Hub",
    unitsSold: "942",
    inventoryLevel: "142",
    revenue: "$45,216",
    rating: "★★★★★",
    trend: "+8%",
    trendUp: true,
  },
  {
    name: "External SSD 1TB",
    unitsSold: "764",
    inventoryLevel: "58",
    revenue: "$68,760",
    rating: "★★★★☆",
    trend: "-2%",
    trendUp: false,
  },
];

export function AnalyticsClient() {
  const [dateRange, setDateRange] = useState<DateRange>("7d");

  const selectedLabel = useMemo(() => {
    if (dateRange === "30d") return "Last 30 Days";
    if (dateRange === "quarter") return "Last Quarter";
    if (dateRange === "year") return "Last Year";
    return "Last 7 Days";
  }, [dateRange]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">Analytics &amp; Data Insights</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value as DateRange)}
            className="w-auto min-w-40"
            aria-label="Select analytics date range"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            <Download size={15} /> Export PDF Report
          </button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <TrendingUp size={18} />
            </span>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Gross Revenue</h3>
              <p className="text-xl font-semibold text-slate-900">$248,500</p>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <ShoppingCart size={18} />
            </span>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Avg. Order Value</h3>
              <p className="text-xl font-semibold text-slate-900">$142.30</p>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <UserPlus size={18} />
            </span>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Conversion Rate</h3>
              <p className="text-xl font-semibold text-slate-900">3.4%</p>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Users size={18} />
            </span>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Customer Growth</h3>
              <p className="text-xl font-semibold text-slate-900">+12.5%</p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Revenue Over Time</h3>
            <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
              <Expand size={14} />
            </button>
          </div>
          <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center">
            <div>
              <BarChart3 size={44} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">Monthly Revenue Chart Visualization ({selectedLabel})</p>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Sales by Category</h3>
            <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
              <Expand size={14} />
            </button>
          </div>
          <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center">
            <div>
              <PieChart size={44} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">Category Distribution Visualization</p>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Top Performing Products</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-2 py-2 font-medium">Product Name</th>
                <th className="px-2 py-2 font-medium">Units Sold</th>
                <th className="px-2 py-2 font-medium">Inventory Level</th>
                <th className="px-2 py-2 font-medium">Revenue Generated</th>
                <th className="px-2 py-2 font-medium">Rating</th>
                <th className="px-2 py-2 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((row) => (
                <tr key={row.name} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-2 py-3 font-medium text-slate-800">{row.name}</td>
                  <td className="px-2 py-3 text-slate-700">{row.unitsSold}</td>
                  <td className={`px-2 py-3 ${row.lowStock ? "font-semibold text-rose-600" : "text-slate-700"}`}>{row.inventoryLevel}</td>
                  <td className="px-2 py-3 text-slate-700">{row.revenue}</td>
                  <td className="px-2 py-3 text-amber-500">{row.rating}</td>
                  <td className={`px-2 py-3 font-medium ${row.trendUp ? "text-emerald-600" : "text-rose-600"}`}>{row.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
