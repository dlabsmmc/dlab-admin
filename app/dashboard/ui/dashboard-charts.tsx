"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

type DashboardChartsProps = {
  revenueLabels: string[];
  revenueData: number[];
  usersData: number[];
};

export function DashboardCharts({ revenueLabels, revenueData, usersData }: DashboardChartsProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Revenue Overview</h3>
        <div className="h-[300px]">
          <Line
            data={{
              labels: revenueLabels,
              datasets: [
                {
                  label: "Revenue ($)",
                  data: revenueData,
                  borderColor: "rgb(15, 23, 42)",
                  backgroundColor: "rgba(15, 23, 42, 0.08)",
                  borderWidth: 2,
                  fill: true,
                  tension: 0.35,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
              },
              scales: {
                x: {
                  grid: { display: false },
                },
                y: {
                  beginAtZero: true,
                  grid: { color: "rgba(148, 163, 184, 0.2)" },
                },
              },
            }}
          />
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">User Registrations</h3>
        <div className="h-[300px]">
          <Bar
            data={{
              labels: revenueLabels,
              datasets: [
                {
                  label: "New Users",
                  data: usersData,
                  backgroundColor: "rgba(59, 130, 246, 0.8)",
                  borderRadius: 6,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
              },
              scales: {
                x: {
                  grid: { display: false },
                },
                y: {
                  beginAtZero: true,
                  grid: { color: "rgba(148, 163, 184, 0.2)" },
                },
              },
            }}
          />
        </div>
      </article>
    </section>
  );
}
